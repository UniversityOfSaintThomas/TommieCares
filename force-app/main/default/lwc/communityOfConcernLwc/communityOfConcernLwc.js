/**
 * Created by nguy0092 on 7/18/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import {gql, graphql} from "lightning/uiGraphQLApi";
import {getPicklistValues} from "lightning/uiObjectInfoApi";
import COMMUNITY_CONCERN_REPORTER_TYPE from "@salesforce/schema/Case.Community_Concern_Reporter_Type__c";
import COMMUNITY_CONCERN_WHO_TYPE from "@salesforce/schema/Case.Community_Concern_Who_Type__c";
import COMMUNITY_CONCERN_WHAT from "@salesforce/schema/Case.Community_Concern__c";
import iAmContactInfo from "@salesforce/apex/CommunityOfConcernLwcController.iAmContactInfo";
import saveCase from "@salesforce/apex/CommunityOfConcernLwcController.saveCase";

export default class CommunityOfConcernLwc extends LightningElement {

    @api paramSfId = "";
    @api paramBId = "";
    // @api paramSBid = "";
    // @api paramCrn = "";
    @api paramUrl = "";
    // testUrl = "https://uofstthomasmn--edastaging.sandbox.my.salesforce-sites.com/CommunityOfConcern?bid=101218824&sfid=003f200002qXsc4AAC&sbid=&crn=";
    // testUrl = "https://uofstthomasmn--edastaging.sandbox.my.salesforce-sites.com/CommunityOfConcern?bid=100408312&sfid=&sbid=&crn="
    searchParamsUrl;
    paramsString;
    caseSubmittedCheck = false;

    get communityOfConcernReportType() {
        return this.communityOfConcernCase?.IAmValue;
    };
    @track childProps = {
        communityOfConcernName: "",
        communityOfConcernEmail: ""
    }

    @track iAmOptions = [];
    @track concernedWhoOptions = [];
    whatPicklist = [];
    whatNoStudentPicklist = [];

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: COMMUNITY_CONCERN_REPORTER_TYPE })
    pickListReporterType({ error, data }) {
        if (data) {
            this.iAmOptions = JSON.parse(JSON.stringify(data.values));
            // this.iAmOptions.push( {label: "Anonymous", value: "Anonymous"} );
        } else if (error) {
            console.log("pickListReporterType Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: COMMUNITY_CONCERN_WHO_TYPE })
    pickListWhoTypes({ error, data }) {
        if (data) {
            this.concernedWhoOptions = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("pickListWhoTypes Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: COMMUNITY_CONCERN_WHAT })
    pickListConcern({ error, data }) {
        if (data) {
            this.whatPicklist = JSON.parse(JSON.stringify(data.values));
            this.whatNoStudentPicklist = this.whatPicklist.filter((obj) => obj.label !== "I would like to report a concern about a student in one of my classes");
            // this.whatNoStudentPicklist = JSON.parse(JSON.stringify(data.values));
            // const index = this.whatNoStudentPicklist.findIndex((obj) => obj.label === "I would like to report a concern about a student in one of my classes");
            // if (index !== -1) {
            //     this.whatNoStudentPicklist.splice(index, 1);
            // }
        } else if (error) {
            console.log("pickListConcern Error: " + error);
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

    get showConcernedWhoSelect() {
        // return !!(!!this.communityOfConcernCase.IAmValue && ((!!this.communityOfConcernCase.IAmFirstName && !!this.communityOfConcernCase.IAmLastName && !!this.communityOfConcernCase.IAmEmail) || this.communityOfConcernCase.IAmValue === "Anonymous"));
        return !!this.communityOfConcernCase.IAmValue;
    }
    get showConcernedWhatSelect() {
        // return this.showConcernedWhoInfo && !!this.communityOfConcernCase.ConcernedWhoFirstName && !!this.communityOfConcernCase.ConcernedWhoLastName;
        return this.showConcernedWhoSelect && !!this.communityOfConcernCase.ConcernedWhoValue;
    }

    get showWhatTommieAlerts() {
        return this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a concern about a student in one of my classes" && this.communityOfConcernCase.IAmValue === "Faculty" && this.communityOfConcernCase.ConcernedWhoValue === "Student";
    }

    get showWhatDiscrimination() {
        // let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I want to report an incident of possible discrimination, bias, or harassment";
        // return {
        //     text: requiredSelected,
        //     anon: requiredSelected && this.communityOfConcernCase.IAmValue === "Anonymous",
        //     facStaff: requiredSelected && (this.communityOfConcernCase.IAmValue === "Faculty" || this.communityOfConcernCase.IAmValue === "Staff"),
        //     student: requiredSelected && this.communityOfConcernCase.IAmValue === "Student",
        //     other: requiredSelected && this.communityOfConcernCase.IAmValue === "Other"
        // }
        return this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I want to report an incident of possible discrimination, bias, or harassment";
    }

    // get showWhatMisconduct() {
    //     let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a concern related to possible sexual misconduct (including Title IX)";
    //     return {
    //         text: requiredSelected,
    //         anon: requiredSelected && this.communityOfConcernCase.IAmValue === "Anonymous",
    //         facStaff: requiredSelected && (this.communityOfConcernCase.IAmValue === "Faculty" || this.communityOfConcernCase.IAmValue === "Staff"),
    //         student: requiredSelected && this.communityOfConcernCase.IAmValue === "Student",
    //         other: requiredSelected && this.communityOfConcernCase.IAmValue === "Other"
    //     }
    // }

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
////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // get showIAmInfo() {
    //     const matchValue = /\b(faculty)\b|\b(staff)\b|\b(student)\b|\b(other)\b/ig;
    //     if (!!this.communityOfConcernCase.IAmValue) {
    //         return !!this.communityOfConcernCase?.IAmValue.match(matchValue);
    //     } else {
    //         return false;
    //     }
    // }

    // get showConcernedWhoInfo() {
    //     return this.showConcernedWhoSelect && !!this.communityOfConcernCase.ConcernedWhoValue;
    // }


    get showWhatWellBeing() {
        let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a behavior or well-being concern";
        return {
            student: requiredSelected && this.communityOfConcernCase.ConcernedWhoValue === "Student",
            nonStudent: requiredSelected && this.communityOfConcernCase.ConcernedWhoValue !== "Student",
        }
    }

    get submitDisable() {
        return !!!this.communityOfConcernCase.ConcernedWhatAdditionalInfo;
    }

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

    submitCaseSpinner = false;

    get iAmInfoInputDisabled() {
        return !!this.communityOfConcernCase.IAmContactId;
    }

    connectedCallback() {
        console.log("Version 55");

        this.searchParamsUrl = new URL(this.paramUrl);
        this.paramsString = new URLSearchParams(this.searchParamsUrl.searchParams);

        for (let keyValue of this.paramsString.entries()) {
            switch (keyValue[0]) {
                case "sfid":
                    if (!this.paramSfId) {
                        this.paramSfId = keyValue[1];
                    }
                    break;
                case "bid":
                    if (!this.paramBId) {
                        this.paramBId = keyValue[1];
                    }
                    break;
                // case "crn":
                //     if (!this.paramCrn) {
                //         this.paramCrn = keyValue[1];
                //     }
                //     break;
                case "submitted":
                    if (keyValue[1] === "true") {
                        this.caseSubmittedCheck = true;
                    }
            }
        }
    }

    @wire(iAmContactInfo,{salesforceId: "$paramSfId", bannerId: "$paramBId"})
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
                    IAmEmail: this.initialContactInfo.hed__UniversityEmail__c,
                    IAmBannerId: this.initialContactInfo.University_Banner_ID__c,
                }

                this.childProps = {
                    communityOfConcernName: this.initialContactInfo.FirstName + ' ' + this.initialContactInfo.LastName,
                    communityOfConcernEmail: this.initialContactInfo.hed__UniversityEmail__c,
                };

                if (this.communityOfConcernCase.IAmStThomasConnection?.includes("Faculty")) {
                    this.communityOfConcernCase.IAmValue = "Faculty"
                } else if (this.communityOfConcernCase.IAmStThomasConnection?.includes("Staff")) {
                    this.communityOfConcernCase.IAmValue = "Staff"
                } else if (this.communityOfConcernCase.IAmStThomasConnection?.includes("Student")) {
                    this.communityOfConcernCase.IAmValue = "Student"
                }

                this.searchParamsUrl.searchParams.set("bid", this.communityOfConcernCase.IAmBannerId);
                this.searchParamsUrl.searchParams.set("sfid", this.communityOfConcernCase.IAmContactId);
                this.paramUrl = this.searchParamsUrl.toString();
                console.log("paramUrl: " + this.paramUrl)
            }
        }

        if (error) {
            console.log("iAmContactInfoWire error: " + error);
        }
    }

    singleSelectHandler(event) {
        this.communityOfConcernCase.ConcernedWhatValue = "";
        this.communityOfConcernCase.ConcernedWhatAdditionalInfo = "";
        switch (event.currentTarget.dataset.selecttype) {
            case "iamselect":
                this.communityOfConcernCase.IAmValue = event.detail.value;
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
                break;
            case "concernedwhoselect":
                this.communityOfConcernCase.ConcernedWhoValue = event.detail.value;
                break;
            case "concernedwhatselect":
                this.communityOfConcernCase.ConcernedWhatValue = event.detail.value;
                break;
        }
    }

    inputTextHandler(event) {
        switch (event.currentTarget.dataset.inputgroup) {
            case "iaminfo":
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.communityOfConcernCase.IAmFirstName = event.detail.value.trim();
                        break;
                    case "lastname":
                        this.communityOfConcernCase.IAmLastName = event.detail.value.trim();
                        break;
                    case "email":
                        this.communityOfConcernCase.IAmEmail = event.target.checkValidity() ? event.detail.value.trim() : "";
                        break;
                    case "phone":
                        this.communityOfConcernCase.IAmPhone = event.detail.value.trim();
                        break;
                }
                break;
            case "concernedwhoinfo":
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.communityOfConcernCase.ConcernedWhoFirstName = event.detail.value.trim();
                        break;
                    case "lastname":
                        this.communityOfConcernCase.ConcernedWhoLastName = event.detail.value.trim();
                        break;
                    case "email":
                        this.communityOfConcernCase.ConcernedWhoEmail = event.target.checkValidity() ? event.detail.value.trim() : "";
                        break;
                    case "phone":
                        this.communityOfConcernCase.ConcernedWhoPhone = event.detail.value.trim();
                        break;
                }
                break;
            case "concernedwhatadditionalinfo":
                this.communityOfConcernCase.ConcernedWhatAdditionalInfo = event.detail.value.trim();
                break;
        }
    }

    formLink(event) {
        switch (event.currentTarget.dataset.formlink) {
            case "bias":
                window.open('https://stthomas-advocate.symplicity.com/public_report/index.php/', '_blank');
                break;
            case "misconduct":
                window.open('https://stthomas-advocate.symplicity.com/titleix_report/index.php/', '_blank');
                break;
        }
        location.replace(this.submittedUrl());
    }

    submittedUrl() {
        // this.searchParamsUrl.searchParams.set("bid", this.paramBId);
        // this.searchParamsUrl.searchParams.set("sbid", "");
        // this.searchParamsUrl.searchParams.set("crn", "");
        this.searchParamsUrl.searchParams.set("submitted", "true");

        return this.searchParamsUrl;
    }

    async submitCase() {
        console.log("We good 3");
        console.log("communityOfConcernCase: " + JSON.stringify(this.communityOfConcernCase));
        try {
            window.scrollTo(0, 0);
            this.submitCaseSpinner = true;
            await saveCase({formSelections: this.communityOfConcernCase});
            this.submitCaseSpinner = false;
            location.replace(this.submittedUrl());
        } catch (e) {
            console.log("Submission Error: " + JSON.stringify(e));
            this.submitCaseSpinner = false;
        }
    }

}