/**
 * Created by nguy0092 on 6/23/2026.
 * Utilize child components:
 * -AdvocateBiasIncidentReportLwc
 * -AdvocateTitleIxIncidentReportLwc
 * -AdvocateWellBeingIncidentReportLwc
 * -TommieCaresLwc
 */

import {api, LightningElement, track, wire} from 'lwc';
// import {getPicklistValues} from "lightning/uiObjectInfoApi";
// import COMMUNITY_CONCERN_REPORTER_TYPE from "@salesforce/schema/Case.Community_Concern_Reporter_Type__c";
// import COMMUNITY_CONCERN_WHO_TYPE from "@salesforce/schema/Case.Community_Concern_Who_Type__c";
// import COMMUNITY_CONCERN_WHAT from "@salesforce/schema/Case.Community_Concern__c";
import getTellSomeonePicklists from "@salesforce/apex/TellSomeoneLwcController.getTellSomeonePicklists";
import iAmContactInfo from "@salesforce/apex/TellSomeoneLwcController.iAmContactInfo";
import saveCase from "@salesforce/apex/CommunityOfConcernLwcController.saveCase";
import TELL_SOMEONE_LOGO from '@salesforce/resourceUrl/TellSomeoneLogoPng';
import {emailValidation} from "c/communityOfConcernUtilJs";

export default class TellSomeoneLwc extends LightningElement {

    @api paramSfId = "";
    @api paramBId = "";
    @api paramPageType = "";
    // @api paramSBid = "";
    // @api paramCrn = "";
    @api paramUrl = "";

    searchParamsUrl;
    paramsString;
    caseSubmittedCheck = false;

    @track iAmOptions = [];
    @track concernedWhoOptions = [];
    @track whatPicklist = [];
    @track whatNoStudentPicklist = [];
    @track initialContactInfo = {};
    @track communityOfConcernCase = {
        IAmValue: "",
        IAmContactId: "",
        IAmFirstName: "",
        IAmLastName: "",
        IAmStThomasConnection: "",
        IAmEmail: "",
        IAmPhone: "",
        IAmBannerId: "",
        ConcernedWhoValue: "",
        ConcernedWhoFirstName: "",
        ConcernedWhoLastName: "",
        ConcernedWhoEmail: "",
        ConcernedWhoPhone: "",
        ConcernedWhatValue: "",
        ConcernedWhatAdditionalInfo: "",
    }

    get tellSomeoneLogo() {
        return TELL_SOMEONE_LOGO;
    }

    get childProps() {
        return {
            tellSomeoneReportType: this.communityOfConcernCase?.IAmValue,
            tellSomeoneReporterFirstName: this.communityOfConcernCase?.IAmFirstName,
            tellSomeoneReporterLastName: this.communityOfConcernCase?.IAmLastName,
            tellSomeoneReporterEmail: this.communityOfConcernCase?.IAmEmail,
            tellSomeoneConcernWhoValue: this.communityOfConcernCase?.ConcernedWhoValue,
            tellSomeoneParamsUrl: this.searchParamsUrl,
        }
    }

    get concernedWhatOptions() {
        if (this.communityOfConcernCase.IAmValue === "Faculty" && this.communityOfConcernCase.IAmStThomasConnection?.includes("Faculty") && this.communityOfConcernCase.ConcernedWhoValue === "Student") {
            return this.whatPicklist;
        } else {
            return this.whatNoStudentPicklist;
        }
    }

    get iAmAnonymousCheck() {
        return this.communityOfConcernCase.IAmValue === "Anonymous";
    }

    get iAmNotAnonymousCheck() {
        return !this.iAmAnonymousCheck;
    }

    get showConcernedWhoSelect() {
        return !!this.communityOfConcernCase.IAmValue;
    }

    get showConcernedWhatSelect() {
        return this.showConcernedWhoSelect && !!this.communityOfConcernCase.ConcernedWhoValue;
    }

    get showWhatTommieAlerts() {
        return this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a concern about a student in one of my classes" && this.communityOfConcernCase.IAmValue === "Faculty" && this.communityOfConcernCase.ConcernedWhoValue === "Student";
    }

    get showWhatWellBeing() {
        let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a behavior or well-being concern";
        return {
            show: requiredSelected,
            student: requiredSelected && this.communityOfConcernCase.ConcernedWhoValue === "Student",
            nonStudent: requiredSelected && this.communityOfConcernCase.ConcernedWhoValue !== "Student",
        }
    }

    get showWhatDiscrimination() {
        return this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I want to report an incident of possible discrimination, bias, or harassment";
    }

    get showWhatMisconduct() {
        return this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a concern related to possible sexual misconduct (including Title IX)";
    }

    get showWhatOther() {
        let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to submit an information report that does not fit the criteria of any of the above reports";
        return {
            show: requiredSelected,
            text: this.communityOfConcernCase.ConcernedWhoValue !== "Student"
        }
    }

    get submitDisable() {
        return !(!!this.communityOfConcernCase.ConcernedWhatAdditionalInfo && this.validEmailWho);
    }

    get iAmInfoInputDisabled() {
        return !!this.communityOfConcernCase.IAmContactId;
    }

    connectedCallback() {
        const baseUrl = this.paramUrl || window.location.href;
        this.searchParamsUrl = new URL(baseUrl);
        for (let [key, value] of this.searchParamsUrl.searchParams.entries()) {
            // eslint-disable-next-line default-case
            switch (key) {
                case "bid":
                    if (!this.paramBId) this.paramBId = value;
                    break;
                case "sfid":
                    if (!this.paramSfId) this.paramSfId = value;
                    break;
                case "submitted":
                    if (value === "true") this.caseSubmittedCheck = true;
                    break;
            }
        }
    }

    rendered = false;
    renderedCallback() {
        if (!this.rendered) {
            if (this.caseSubmittedCheck) {
                const caseSubmittedElement = this.template.querySelector(".case-submitted");
                if (caseSubmittedElement) {
                    caseSubmittedElement.scrollIntoView({
                        behavior: "instant",
                        block: "center"
                    });
                }
            }
            this.rendered = !this.rendered;
        }
    }

    @wire(getTellSomeonePicklists, {})
    wireGetTellSomeonePicklists({error, data}) {
        if (data) {
            const removeTypes = ["Faculty", "Staff", "Student"];
            if (data) {
                this.iAmOptions = JSON.parse(JSON.stringify(data.tellSomeoneReporterType || []));
                if (this.paramPageType === "public") {
                    for (const types of removeTypes) {
                        const index = this.iAmOptions.findIndex(option => option.label === types);

                        if (index !== -1) {
                            this.iAmOptions.splice(index, 1);
                        }
                    }
                }

                this.concernedWhoOptions = JSON.parse(JSON.stringify(data.tellSomeoneWhoType || []));
                this.whatPicklist = JSON.parse(JSON.stringify(data.tellSomeoneWhatType || []));
                this.whatNoStudentPicklist = this.whatPicklist.filter((obj) => obj.label !== "I would like to report a concern about a student in one of my classes");
            }
        }

        if (error) {
            console.log("wireGetTellSomeonePicklists Error: " + error);
        }
    }

    @wire(iAmContactInfo, {salesforceId: "$paramSfId", bannerId: "$paramBId"})
    iAmContactInfoWire({error, data}) {
        if (data) {
            let wireContactInfo = JSON.parse(JSON.stringify(data));
            if (wireContactInfo.length > 0) {
                this.initialContactInfo = wireContactInfo[0];
                this.communityOfConcernCase = {
                    IAmContactId: this.initialContactInfo.Id,
                    IAmFirstName: this.initialContactInfo.FirstName,
                    IAmLastName: this.initialContactInfo.LastName,
                    IAmStThomasConnection: this.initialContactInfo.St_Thomas_Connection__c,
                    IAmBannerId: this.initialContactInfo.University_Banner_ID__c,
                }
                if (this.initialContactInfo.hed__UniversityEmail__c) {
                    let emailValidationResults = emailValidation(this.initialContactInfo.hed__UniversityEmail__c);
                    this.communityOfConcernCase.IAmEmail = emailValidationResults.emailAddress;
                    this.validEmail = emailValidationResults.validEmail;
                }

                if (this.communityOfConcernCase.IAmStThomasConnection?.includes("Faculty")) {
                    this.communityOfConcernCase.IAmValue = "Faculty";
                } else if (this.communityOfConcernCase.IAmStThomasConnection?.includes("Staff")) {
                    this.communityOfConcernCase.IAmValue = "Staff";
                } else if (this.communityOfConcernCase.IAmStThomasConnection?.includes("Student")) {
                    this.communityOfConcernCase.IAmValue = "Student";
                }
            }
            if (window.location && window.location.search) {
                this.searchParamsUrl.searchParams.set("bid", this.communityOfConcernCase.IAmBannerId);
                this.searchParamsUrl.searchParams.set("sfid", this.communityOfConcernCase.IAmContactId);
                this.paramUrl = this.searchParamsUrl.toString();
                // console.log("paramUrl: " + this.paramUrl)
            }
        }

        if (error) {
            console.log("iAmContactInfoWire error: " + error);
        }
    }

    selectValueHandler(event) {
        let eventValue = event.detail.value;
        this.communityOfConcernCase.ConcernedWhatValue = "";
        this.communityOfConcernCase.ConcernedWhatAdditionalInfo = "";
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.selecttype) {
            case "iamselect":
                this.communityOfConcernCase.IAmValue = eventValue;
                if (this.communityOfConcernCase.IAmValue === "Anonymous") {
                    this.communityOfConcernCase.IAmContactId = "";
                    this.communityOfConcernCase.IAmFirstName = "";
                    this.communityOfConcernCase.IAmLastName = "";
                    this.communityOfConcernCase.IAmStThomasConnection = "";
                    this.communityOfConcernCase.IAmEmail = "";
                    this.communityOfConcernCase.IAmPhone = "";
                    this.communityOfConcernCase.IAmBannerId = "";
                } else {
                    if (this.initialContactInfo) {
                        this.communityOfConcernCase.IAmContactId = this.initialContactInfo.Id;
                        this.communityOfConcernCase.IAmFirstName = this.initialContactInfo.FirstName;
                        this.communityOfConcernCase.IAmLastName = this.initialContactInfo.LastName;
                        this.communityOfConcernCase.IAmStThomasConnection = this.initialContactInfo.St_Thomas_Connection__c;
                        this.communityOfConcernCase.IAmEmail = this.initialContactInfo.hed__UniversityEmail__c;
                        this.communityOfConcernCase.IAmPhone = "";
                        this.communityOfConcernCase.IAmBannerId = this.initialContactInfo.University_Banner_ID__c;
                    }
                }
                // eslint-disable-next-line no-case-declarations
                let emailValidationResults = emailValidation(this.communityOfConcernCase.IAmEmail);
                this.communityOfConcernCase.IAmEmail = emailValidationResults.emailAddress;
                this.validEmail = emailValidationResults.validEmail;
                break;
            case "concernedwhoselect":
                this.communityOfConcernCase.ConcernedWhoValue = eventValue;
                break;
            case "concernedwhatselect":
                this.communityOfConcernCase.ConcernedWhatValue = eventValue;
                break;
        }
    }

    inputValueHandler(event) {
        let eventValue = event.detail.value;
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputgroup) {
            case "iaminfo":
                // eslint-disable-next-line default-case
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.communityOfConcernCase.IAmFirstName = eventValue.trim();
                        break;
                    case "lastname":
                        this.communityOfConcernCase.IAmLastName = eventValue.trim();
                        break;
                    case "email":
                        if (!eventValue) {
                            this.validEmailWarning = false;
                            this.validEmail = true;
                        } else {
                            this.validEmail = false;
                        }
                        break;
                    case "phone":
                        this.communityOfConcernCase.IAmPhone = eventValue.trim();
                        break;
                }
                break;
            case "concernedwhoinfo":
                // eslint-disable-next-line default-case
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.communityOfConcernCase.ConcernedWhoFirstName = eventValue.trim();
                        break;
                    case "lastname":
                        this.communityOfConcernCase.ConcernedWhoLastName = eventValue.trim();
                        break;
                    case "email":
                        if (!eventValue) {
                            this.validEmailWarningWho = false;
                            this.validEmailWho = true;
                        } else {
                            this.validEmailWho = false;
                        }
                        break;
                    case "phone":
                        this.communityOfConcernCase.ConcernedWhoPhone = eventValue.trim();
                        break;
                }
                break;
            case "concernedwhatadditionalinfo":
                this.communityOfConcernCase.ConcernedWhatAdditionalInfo = eventValue.trim();
                break;
        }
    }

    validEmail = true;
    validEmailWarning = false;
    validEmailWho = true;
    validEmailWarningWho = false;
    emailValidationBlur(event) {
        const emailField = event.currentTarget;
        const emailAddress = event.target.value;
        let emailValidationResults = emailValidation(emailAddress);

        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputgroup) {
            case "iaminfo":
                this.communityOfConcernCase.IAmEmail = emailValidationResults.emailAddress;
                this.validEmail = emailValidationResults.validEmail;
                this.validEmailWarning = emailValidationResults.validEmailWarning;
                if (this.validEmailWarning) {
                    emailField.classList.add("slds-has-error");
                } else {
                    emailField.classList.remove("slds-has-error");
                }
                break;
            case "concernedwhoinfo":
                this.communityOfConcernCase.ConcernedWhoEmail = emailValidationResults.emailAddress;
                this.validEmailWho = emailValidationResults.validEmail;
                this.validEmailWarningWho = emailValidationResults.validEmailWarning;
                if (this.validEmailWarningWho) {
                    emailField.classList.add("slds-has-error");
                } else {
                    emailField.classList.remove("slds-has-error");
                }
                break;
        }

    }

    showSpinner = false;

    handleShowSpinner() {
        this.showSpinner = true;
    }

    handleHideSpinner() {
        this.showSpinner = false;
    }

    submittedUrl() {
        if (window.location) {
            this.searchParamsUrl.searchParams.set("submitted", "true");
            return this.searchParamsUrl;
        }
    }

    openNewForm() {
        if (window.location && window.location.search) {
            this.searchParamsUrl.searchParams.set("bid", this.communityOfConcernCase.IAmBannerId);
            this.searchParamsUrl.searchParams.set("sfid", this.communityOfConcernCase.IAmContactId);
            this.searchParamsUrl.searchParams.delete("submitted");
        }
        location.replace(this.searchParamsUrl.toString());
    }

    submitCaseFail = false;

    async submitCase(event) {
        // console.log("communityOfConcernCase: " + JSON.stringify(this.communityOfConcernCase));
        const eventField = event.currentTarget;
        this.submitCaseFail = false;
        try {
            this.handleShowSpinner();
            await saveCase({formSelections: this.communityOfConcernCase}).then((result) => {
                this.submitCaseFail = !!result;
            });
        } catch (e) {
            console.log("Submission Error: " + JSON.stringify(e));
            this.submitCaseFail = true;
        }

        if (this.submitCaseFail) {
            this.handleHideSpinner();
            eventField.scrollIntoView({
                behavior: 'smooth',
            });
        } else {
            this.handleHideSpinner();
            location.replace(this.submittedUrl());
        }
    }

}