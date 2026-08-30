/**
 * Created by nguy0092 on 6/23/2026.
 * Utilize child components:
 * -AdvocateBiasIncidentReportLwc
 * -AdvocateTitleIxIncidentReportLwc
 * -AdvocateWellBeingIncidentReportLwc
 * -TommieCaresLwc
 */

import {api, LightningElement, track, wire} from 'lwc';
import getTellSomeonePicklists from "@salesforce/apex/TellSomeoneLwcController.getTellSomeonePicklists";
import iAmContactInfo from "@salesforce/apex/TellSomeoneLwcController.iAmContactInfo";
import saveCase from "@salesforce/apex/CommunityOfConcernLwcController.saveCase";
import TELL_SOMEONE_LOGO from '@salesforce/resourceUrl/TellSomeoneLogoPng';
import {emailValidation} from "c/tellSomeoneUtilJs";

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
    formSubmitError = false;
    documentAttachFail = false;

    @track iAmOptions = [];
    @track concernedWhoOptions = [];
    @track whatPicklist = [];
    @track whatNoStudentPicklist = [];
    @track initialContactInfo = {};
    @track tellSomeoneCase = {
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
            tellSomeoneReportType: this.tellSomeoneCase?.IAmValue,
            tellSomeoneReporterFirstName: this.tellSomeoneCase?.IAmFirstName,
            tellSomeoneReporterLastName: this.tellSomeoneCase?.IAmLastName,
            tellSomeoneReporterEmail: this.tellSomeoneCase?.IAmEmail,
            tellSomeoneConcernWhoValue: this.tellSomeoneCase?.ConcernedWhoValue,
            tellSomeoneParamsUrl: this.searchParamsUrl,
        }
    }

    get concernedWhatOptions() {
        if (this.tellSomeoneCase.IAmValue === "Faculty" && this.tellSomeoneCase.IAmStThomasConnection?.includes("Faculty") && this.tellSomeoneCase.ConcernedWhoValue === "Student") {
            return this.whatPicklist;
        } else {
            return this.whatNoStudentPicklist;
        }
    }

    get iAmAnonymousCheck() {
        return this.tellSomeoneCase.IAmValue === "Anonymous";
    }

    get iAmNotAnonymousCheck() {
        return !this.iAmAnonymousCheck;
    }

    get showConcernedWhoSelect() {
        return !!this.tellSomeoneCase.IAmValue;
    }

    get showConcernedWhatSelect() {
        return this.showConcernedWhoSelect && !!this.tellSomeoneCase.ConcernedWhoValue;
    }

    get showWhatTommieAlerts() {
        return this.showConcernedWhatSelect && this.tellSomeoneCase.ConcernedWhatValue === "I would like to report a concern about a student in one of my classes" && this.tellSomeoneCase.IAmValue === "Faculty" && this.tellSomeoneCase.ConcernedWhoValue === "Student";
    }

    get showWhatTommieAlertsAdvisingStudent() {
        return this.showConcernedWhatSelect && this.tellSomeoneCase.ConcernedWhatValue === "I would like to report a Advising and Student Support concern" && this.tellSomeoneCase.ConcernedWhoValue === "Student";
    }

    get showWhatWellBeing() {
        let requiredSelected = this.showConcernedWhatSelect && this.tellSomeoneCase.ConcernedWhatValue === "I would like to report a behavior or well-being concern";
        return {
            show: requiredSelected,
            student: requiredSelected && this.tellSomeoneCase.ConcernedWhoValue === "Student",
            nonStudent: requiredSelected && this.tellSomeoneCase.ConcernedWhoValue !== "Student",
        }
    }

    get showWhatDiscrimination() {
        return this.showConcernedWhatSelect && this.tellSomeoneCase.ConcernedWhatValue === "I want to report an incident of possible discrimination, bias, or harassment";
    }

    get showWhatMisconduct() {
        return this.showConcernedWhatSelect && this.tellSomeoneCase.ConcernedWhatValue === "I would like to report a concern related to possible sexual misconduct (including Title IX)";
    }

    get showWhatOther() {
        let requiredSelected = this.showConcernedWhatSelect && this.tellSomeoneCase.ConcernedWhatValue === "I would like to submit an information report that does not fit the criteria of any of the above reports";
        return {
            show: requiredSelected,
            text: this.tellSomeoneCase.ConcernedWhoValue !== "Student"
        }
    }

    get submitDisable() {
        return !(!!this.tellSomeoneCase.ConcernedWhatAdditionalInfo && this.validEmailWho);
    }

    get iAmInfoInputDisabled() {
        return !!this.tellSomeoneCase.IAmContactId;
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
                    if (value === "true") this.caseSubmittedCheck = true
                    break
                case "submitvalid":
                    if (value === "false") this.formSubmitError = true;
                    break;
                case "nodocument":
                    if (value === "true") this.documentAttachFail = true;
                    break
            }
        }
    }

    // rendered = false;
    renderedCount = 1;
    // renderedCallback() {
    //     // if (!this.rendered) {
    //         window.scrollTo({
    //             top: 0,
    //             behavior: 'smooth'
    //         });
    //         // if (this.caseSubmittedCheck) {
    //         //     const caseSubmittedElement = this.template.querySelector(".case-submitted");
    //         //     if (caseSubmittedElement) {
    //         //         caseSubmittedElement.scrollIntoView({
    //         //             top: 0,
    //         //             behavior: "instant",
    //         //             // block: "center"
    //         //         });
    //         //     }
    //         // }
    //         // this.rendered = !this.rendered;
    //     console.log("rendered count: "+this.renderedCount);
    //     }
    // }

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
                //
                // const excludedWhatLabels = [
                //     "I would like to report a concern about a student in one of my classes",
                //     "I would like to report a Advising and Student Support concern"
                // ];
                // this.whatNoStudentPicklist = this.whatPicklist.filter((obj) => !excludedWhatLabels.includes(obj.label));
                this.whatNoStudentPicklist = this.whatPicklist.filter((obj) => obj.label !== "I would like to report a concern about a student in one of my classes");
                // this.whatNoStudentPicklist = this.whatPicklist.filter((obj) => obj.label !== "I would like to report a Advising and Student support concern");
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
                this.tellSomeoneCase = {
                    IAmContactId: this.initialContactInfo.Id,
                    IAmFirstName: this.initialContactInfo.FirstName,
                    IAmLastName: this.initialContactInfo.LastName,
                    IAmStThomasConnection: this.initialContactInfo.St_Thomas_Connection__c,
                    IAmBannerId: this.initialContactInfo.University_Banner_ID__c,
                }
                if (this.initialContactInfo.hed__UniversityEmail__c) {
                    let emailValidationResults = emailValidation(this.initialContactInfo.hed__UniversityEmail__c);
                    this.tellSomeoneCase.IAmEmail = emailValidationResults.emailAddress;
                    this.validEmail = emailValidationResults.validEmail;
                }

                if (this.tellSomeoneCase.IAmStThomasConnection?.includes("Faculty")) {
                    this.tellSomeoneCase.IAmValue = "Faculty";
                } else if (this.tellSomeoneCase.IAmStThomasConnection?.includes("Staff")) {
                    this.tellSomeoneCase.IAmValue = "Staff";
                } else if (this.tellSomeoneCase.IAmStThomasConnection?.includes("Student")) {
                    this.tellSomeoneCase.IAmValue = "Student";
                }
            }
            if (window.location && window.location.search) {
                this.searchParamsUrl.searchParams.set("bid", this.tellSomeoneCase.IAmBannerId);
                this.searchParamsUrl.searchParams.set("sfid", this.tellSomeoneCase.IAmContactId);
                // eslint-disable-next-line @lwc/lwc/no-api-reassignments
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
        this.tellSomeoneCase.ConcernedWhatValue = "";
        this.tellSomeoneCase.ConcernedWhatAdditionalInfo = "";
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.selecttype) {
            case "iamselect":
                this.tellSomeoneCase.IAmValue = eventValue;
                if (this.tellSomeoneCase.IAmValue === "Anonymous") {
                    this.tellSomeoneCase.IAmContactId = "";
                    this.tellSomeoneCase.IAmFirstName = "";
                    this.tellSomeoneCase.IAmLastName = "";
                    this.tellSomeoneCase.IAmStThomasConnection = "";
                    this.tellSomeoneCase.IAmEmail = "";
                    this.tellSomeoneCase.IAmPhone = "";
                    this.tellSomeoneCase.IAmBannerId = "";
                } else {
                    if (this.initialContactInfo) {
                        this.tellSomeoneCase.IAmContactId = this.initialContactInfo.Id;
                        this.tellSomeoneCase.IAmFirstName = this.initialContactInfo.FirstName;
                        this.tellSomeoneCase.IAmLastName = this.initialContactInfo.LastName;
                        this.tellSomeoneCase.IAmStThomasConnection = this.initialContactInfo.St_Thomas_Connection__c;
                        this.tellSomeoneCase.IAmEmail = this.initialContactInfo.hed__UniversityEmail__c;
                        this.tellSomeoneCase.IAmPhone = "";
                        this.tellSomeoneCase.IAmBannerId = this.initialContactInfo.University_Banner_ID__c;
                    }
                }
                // eslint-disable-next-line no-case-declarations
                let emailValidationResults = emailValidation(this.tellSomeoneCase.IAmEmail);
                this.tellSomeoneCase.IAmEmail = emailValidationResults.emailAddress;
                this.validEmail = emailValidationResults.validEmail;
                break;
            case "concernedwhoselect":
                this.tellSomeoneCase.ConcernedWhoValue = eventValue;
                break;
            case "concernedwhatselect":
                this.tellSomeoneCase.ConcernedWhatValue = eventValue;
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
                        this.tellSomeoneCase.IAmFirstName = eventValue.trim();
                        break;
                    case "lastname":
                        this.tellSomeoneCase.IAmLastName = eventValue.trim();
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
                        this.tellSomeoneCase.IAmPhone = eventValue.trim();
                        break;
                }
                break;
            case "concernedwhoinfo":
                // eslint-disable-next-line default-case
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.tellSomeoneCase.ConcernedWhoFirstName = eventValue.trim();
                        break;
                    case "lastname":
                        this.tellSomeoneCase.ConcernedWhoLastName = eventValue.trim();
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
                        this.tellSomeoneCase.ConcernedWhoPhone = eventValue.trim();
                        break;
                }
                break;
            case "concernedwhatadditionalinfo":
                this.tellSomeoneCase.ConcernedWhatAdditionalInfo = eventValue.trim();
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
                this.tellSomeoneCase.IAmEmail = emailValidationResults.emailAddress;
                this.validEmail = emailValidationResults.validEmail;
                this.validEmailWarning = emailValidationResults.validEmailWarning;
                if (this.validEmailWarning) {
                    emailField.classList.add("slds-has-error");
                } else {
                    emailField.classList.remove("slds-has-error");
                }
                break;
            case "concernedwhoinfo":
                this.tellSomeoneCase.ConcernedWhoEmail = emailValidationResults.emailAddress;
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

    get submittedUrl() {
        this.searchParamsUrl.searchParams.set("submitted", "true");
        return this.searchParamsUrl;
    }

    openNewForm() {
        this.searchParamsUrl.searchParams.set("bid", this.tellSomeoneCase.IAmBannerId);
        this.searchParamsUrl.searchParams.set("sfid", this.tellSomeoneCase.IAmContactId);
        this.searchParamsUrl.searchParams.delete("submitted");
        this.searchParamsUrl.searchParams.delete("submitvalid");
        this.searchParamsUrl.searchParams.delete("nodocument");
        // eslint-disable-next-line no-restricted-globals
        location.replace(this.searchParamsUrl.toString());
    }

    submitCaseFail = false;
    async submitCase(event) {
        // console.log("communityOfConcernCase: " + JSON.stringify(this.communityOfConcernCase));
        const eventField = event.currentTarget;
        this.submitCaseFail = false;
        try {
            this.handleShowSpinner();
            await saveCase({formSelections: this.tellSomeoneCase}).then((result) => {
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
            // eslint-disable-next-line no-restricted-globals
            location.replace(this.submittedUrl);
        }
    }

}