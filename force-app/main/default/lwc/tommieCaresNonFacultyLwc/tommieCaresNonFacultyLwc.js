/**
 * Created by nguy0092 on 2/7/2025.
 */

import {LightningElement, api, wire, track} from 'lwc';
import {getPicklistValues} from "lightning/uiObjectInfoApi";
import advisorInformation from "@salesforce/apex/TommieCaresNonFacultyLwcController.advisorInformation";
import searchStudent from "@salesforce/apex/TommieCaresNonFacultyLwcController.searchStudent";
import TOMMIE_CARES_REASONS from '@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c';
import TOMMIE_HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";
import saveCase from "@salesforce/apex/TommieCaresNonFacultyLwcController.saveCase";

export default class TommieCaresNonFacultyLwc extends LightningElement {

    @api paramUrl = "";
    paramBId = "";
    searchParamsUrl;
    advisorContactInfo;
    @track tommieCaresOptionsAll = [];
    @track tommieCaresOptions = [];
    @track tommieHigh5Options = [];

    tommieCaresGeneralExclusions = [
        "Academic performance concerns",
        "Attendance concerns"
    ];

    tommieCaresGraduateExclusions = [
        "Behavior concerns",
        "Financial concerns",
        "Mental health concerns",
        "Relationship violence/stalking",
        "Sense of belonging",
        "Other",
    ];

    alertGroupingsFilter = [
        {"Positive Alert": ["Tommie High 5"]},
        {"Advising": ["Academic Standing Requirement Not Met (only for Academic Counselors)", "Missed Advising Appointment", "Non-Responsive to Outreach"]},
        {"Behavior Mental Health": ["Behavior concerns", "Mental health concerns", "Relationship violence/stalking"]},
        {"Life Circumstances": ["Difficulty Meeting Basic Needs (food/housing, etc)", "Financial concerns", "Life Circumstances Impacting Success", "Sense of belonging", "Other"]},
    ]

    @track positiveAlertGroup = [];
    @track advisingGroup = [];
    @track behaviorMentalHealthGroup = [];
    @track lifeCircumstanceGroup = [];

    get initialPageView() {
        return this.advisorContactInfo && !this.caseSubmittedCheck;
    }

    get studentSelectionCheck() {
        return this.formSubmitSelections.StudentContactId && !this.noStudentsFound;
    }

    get caresSelectionCheck() {
        return !!this.formSubmitSelections.TommieCares_Reasons;
    }

    advisorContactIdCheck = false;
    noAdvisorContactIdCheck = false;
    caseSubmittedCheck = false;
    caseSubmittedErrorCheck = false;

    @track selectionsCheck = {
        high5Check: false,
        nonResponsiveOutreachCheck: false,
        missedAdvisingAppointments: false,
        behaviorCheck: false,
        financialConcernsCheck: false,
        mentalHealthCheck: false,
        relationshipCheck: false,
        difficultyMeetingBasicNeedsCheck: false,
        lifeCircumstanceImpactingSuccessCheck: false,
        senseOfBelongingCheck: false,
        otherCheck: false,
    }

    @track formSubmitSelections = {
        AdvisorContactId: "",
        AdvisorEmail: "",
        StudentContactId: "",
        StudentName: "",
        StudentEmail: "",
        StudentType: "",
        TommieCares_Reasons: "",
        High5_Reasons: "",
        High5_Details: "",
        Pass_Course_Selection: "",
        Other_Details: "",
        Personal_Message: "",
        Additional_Concerns: "",
    };

    @track formRequired = {
        High5_Required: false,
        Other_Required: false,
    }

    submitCaseSpinner = false;

    get submitDisable() {
        return Object.values(this.formRequired).includes(true);
    }

    connectedCallback() {
        const baseUrl = this.paramUrl || window.location.href;
        this.searchParamsUrl = new URL(baseUrl);
        // let searchParamsUrl = new URL(this.paramUrl);
        // let paramsString = new URLSearchParams(searchParamsUrl.searchParams);

        for (let [key, value] of this.searchParamsUrl.searchParams.entries()) {
            switch (key) {
                case "bid":
                    if (!this.paramBId) this.paramBId = value;
                    break;
                case "submitted":
                    if (value === "true") this.caseSubmittedCheck = true;
                    break;
            }
        }

        // for (let keyValue of paramsString.entries()) {
        //
        //     switch (keyValue[0]) {
        //         case "bid":
        //             if (!this.paramBId) {
        //                 this.paramBId = keyValue[1];
        //             }
        //             break;
        //         case "submitted":
        //             if (keyValue[1] === "true") {
        //                 this.caseSubmittedCheck = true;
        //             }
        //     }
        // }
    }

    @wire (advisorInformation, {advisorBannerId: "$paramBId"})
    advisorInformationWire({error, data}) {
        if (data) {
            this.advisorContactInfo = JSON.parse(JSON.stringify(data));
            this.advisorContactIdCheck = !!this.advisorContactInfo.Id;
            this.noAdvisorContactIdCheck = !this.advisorContactIdCheck;
        }

        if (error) {
            this.noAdvisorContactIdCheck = true;
            console.log("advisorInformationWire error!");
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_CARES_REASONS })
    pickListTommieCares({ error, data }) {
        if (data) {
            this.tommieCaresOptionsAll = JSON.parse(JSON.stringify(data.values));
            this.removeTommieCaresOptions(this.tommieCaresGeneralExclusions, this.tommieCaresOptionsAll);
        } else if (error) {
            console.log("tommieCaresPicklist Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_HIGH_5_REASONS })
    pickListTommieHigh5({ error, data }) {
        if (data) {
            this.tommieHigh5Options = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("tommieHigh5PicklistWire Error: " + error);
        }
    }

    // selectStudentContactId(event) {
    //     const { id, subField } = event.detail;
    //
    //     this.caseSubmittedCheck = false;
    //
    //     if (!id) {
    //         this.resetForm();
    //         return;
    //     }
    //
    //     // Student selected — rebuild and filter alert reason options
    //     this.tommieCaresOptions = [...this.tommieCaresOptionsAll];
    //     this.formSubmitSelections.StudentContactId = id;
    //
    //     if (subField?.toLowerCase().includes("graduate student")) {
    //         this.removeTommieCaresOptions(this.tommieCaresGraduateExclusions, this.tommieCaresOptions);
    //     }
    //
    //     this.buildAlertGroups();
    // }

    removeTommieCaresOptions(exclusionList, optionsList) {
        for (const exclusion of exclusionList) {
            const index = optionsList.findIndex(option => option.label === exclusion);

            if (index !== -1) {
                optionsList.splice(index, 1);
            }
        }
    }

    buildAlertGroups() {
        const groupMap = {
            "Positive Alert":         "positiveAlertGroup",
            "Advising":               "advisingGroup",
            "Behavior Mental Health": "behaviorMentalHealthGroup",
            "Life Circumstances":     "lifeCircumstanceGroup",
        };

        for (const groupObj of this.alertGroupingsFilter) {
            const [groupName, values] = Object.entries(groupObj)[0];
            const propName = groupMap[groupName];
            if (propName) {
                this[propName] = this.tommieCaresOptions
                    .filter(option => values.includes(option.value))
                    .sort((a, b) => {
                        if (a.value === "Other") return 1;
                        if (b.value === "Other") return -1;
                        return a.label.localeCompare(b.label);
                    });
            }
        }
    }

    reasonsCheckbox(event) {
        switch (event.currentTarget.dataset.checkboxtype) {
            case "cares":
                this.formSubmitSelections.TommieCares_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.TommieCares_Reasons);

                if (event.target.value === "Tommie High 5") {
                    if (!event.target.checked) {
                        this.formSubmitSelections.High5_Reasons = "";
                        this.formSubmitSelections.High5_Details = "";
                    }
                    this.selectionsCheck.high5Check = event.target.checked;
                    this.formRequired.High5_Required = event.target.checked;
                }
                if (event.target.value === "Non-Responsive to Outreach") {
                    this.selectionsCheck.nonResponsiveOutreachCheck = event.target.checked;
                }
                if (event.target.value === "Missed Advising Appointment") {
                    this.selectionsCheck.missedAdvisingAppointments = event.target.checked;
                }
                if (event.target.value === "Behavior concerns") {
                    this.selectionsCheck.behaviorCheck = event.target.checked;
                }
                if (event.target.value === "Financial concerns") {
                    this.selectionsCheck.financialConcernsCheck = event.target.checked;
                }
                if (event.target.value === "Mental health concerns") {
                    this.selectionsCheck.mentalHealthCheck = event.target.checked;
                }
                if (event.target.value === "Relationship violence/stalking") {
                    this.selectionsCheck.relationshipCheck = event.target.checked;
                }
                if (event.target.value === "Difficulty Meeting Basic Needs (food/housing, etc)") {
                    this.selectionsCheck.difficultyMeetingBasicNeedsCheck = event.target.checked;
                }
                if (event.target.value === "Life Circumstances Impacting Success") {
                    this.selectionsCheck.lifeCircumstanceImpactingSuccessCheck = event.target.checked;
                }
                if (event.target.value === "Sense of belonging") {
                    this.selectionsCheck.senseOfBelongingCheck = event.target.checked;
                }
                if (event.target.value === "Other") {
                    if (!event.target.checked) {
                        this.formSubmitSelections.Other_Details = "";
                    }
                    this.selectionsCheck.otherCheck = event.target.checked;
                    this.formRequired.Other_Required = event.target.checked;
                }
                break;
            case "high5":
                this.formSubmitSelections.High5_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.High5_Reasons);
                this.formRequired.High5_Required = !(!!this.formSubmitSelections.High5_Reasons && !!this.formSubmitSelections.High5_Details);
                break;
        }

        if (!(this.formSubmitSelections.TommieCares_Reasons)) {
            this.formSubmitSelections.Additional_Concerns = "";
        }
    }

    checkBoxSelect(evt, selectionType) {
        let selections = selectionType ? selectionType.split(";") : [];

        if (evt.target.checked) {
            selections.push(evt.target.value);
        } else {
            const index = selections.indexOf(evt.target.value);

            if (index !== -1) {
                selections.splice(index, 1);
            }
        }
        return selections.join(";");
    }

    textAreaDetails(event) {
        switch (event.currentTarget.dataset.texttype) {
            case "high5Details":
                this.formSubmitSelections.High5_Details = event.detail.value.trim();
                this.formRequired.High5_Required = !(!!this.formSubmitSelections.High5_Reasons && !!this.formSubmitSelections.High5_Details);
                break;
            case "otherDetails":
                this.formSubmitSelections.Other_Details = event.detail.value.trim();
                this.formRequired.Other_Required = !(!!this.formSubmitSelections.Other_Details);
                break;
            case "personalMessage":
                this.formSubmitSelections.Personal_Message = event.detail.value.trim();
                break;
            case "additionalConcerns":
                this.formSubmitSelections.Additional_Concerns = event.detail.value.trim();
                break;
        }
    }

    resetForm() {

        const checkboxes = this.template.querySelectorAll("input[type='checkbox']");

        if (checkboxes) {
            checkboxes.forEach(check => {
                check.checked = false;
            })
        }

        const textareas = this.template.querySelectorAll("lightning-textarea");
        if (textareas) {
            textareas.forEach(ta => { ta.value = ""; });
        }

        // for (const selection in this.formSubmitSelections) {
        //     this.formSubmitSelections[selection] = "";
        // }
        Object.keys(this.formSubmitSelections).forEach(k => {
            this.formSubmitSelections[k] = '';
        });

        // for (const check in this.selectionsCheck) {
        //     this.selectionsCheck[check] = false;
        // }
        Object.keys(this.selectionsCheck).forEach(k => {
            this.selectionsCheck[k] = false;
        });

        // for (const required in this.formRequired) {
        //     this.formRequired[required] = false;
        // }
        Object.keys(this.formRequired).forEach(k => {
            this.formRequired[k] = false;
        });

        this.positiveAlertGroup = [];
        this.advisingGroup = [];
        this.behaviorMentalHealthGroup = [];
        this.lifeCircumstanceGroup = [];
    }

    submittedUrl() {
        this.searchParamsUrl.searchParams.set("submitted", "true");
        return this.searchParamsUrl.toString();
        // let reloadUrl = new URL(this.paramUrl);
        //
        // reloadUrl.searchParams.set("bid", this.paramBId);
        // reloadUrl.searchParams.set("submitted", "true");
        //
        // return reloadUrl;
    }

    async submitCase() {
        this.formSubmitSelections.AdvisorContactId = this.advisorContactInfo.Id;
        this.formSubmitSelections.AdvisorEmail = this.advisorContactInfo.Email;

        console.log("I am being submitted");

        try {
            this.caseSubmittedErrorCheck = false;
            window.parent.scrollTo({top: 0, behavior: 'smooth' });
            this.submitCaseSpinner = true;
            await saveCase({formSelections: this.formSubmitSelections});
            this.submitCaseSpinner = false;
            location.replace(this.submittedUrl());
        } catch (e) {
            console.log("Submission Error: "+JSON.stringify(e));
            this.caseSubmittedErrorCheck = true;
            this.submitCaseSpinner = false;
        }
    }

    //start new

    // reactive fields
    searchMode = null; // default
    stThomasEmail = '';
    bannerId = '';
    lastName = '';

    // getters for template binding
    get isEmail() {
        return this.searchMode === 'email';
    }
    get isBanner() {
        return this.searchMode === 'banner';
    }

    // disable banner search until both fields have non-empty values
    get isBannerSearchDisabled() {
        // disable until both non-empty
        return !(this.bannerId && /^\d+$/.test(this.bannerId) && this.lastName);
    }

    //disable email search until valid email is entered
    get isEmailSearchDisabled() {
        return !(this.isValidStThomasEmail && this.stThomasEmail);
    }

    handleSearchModeChange(event) {
        this.resetForm();
        this.noStudentsFound = false;
        this.searchMode = event.target.value;

        if (this.searchMode === 'email') {
            // clear banner inputs
            this.bannerId = '';
            this.lastName = '';
            // this.showBannerValidation = false;
        } else if (this.searchMode === 'banner') {
            // clear email input
            this.stThomasEmail = '';
            // this.emailSearchMessage = '';
        }
    }

    // isValidBannerId = false;
// input handlers
    handleBannerIdInput(event) {
        const eventField = event.target;
        eventField.setCustomValidity("");

        this.bannerId = (event.detail?.value ?? '').trim();
        const isInputValueDigits = /^\d+$/.test(this.bannerId);

        if (!isInputValueDigits && this.bannerId) {
            eventField.setCustomValidity("Must be numbers");
        }

        eventField.reportValidity();
        console.log("this.bannerId: "+this.bannerId);
    }

    handleLastNameInput(event) {
        this.lastName = (event.detail?.value || '').trim();
        console.log("this.lastName: "+this.lastName);
    }

    isValidStThomasEmail = false;
    handleEmailChange(event) {
        const eventField = event.target;
        eventField.setCustomValidity("");

        this.stThomasEmail = (event.detail?.value || '').trim();
        const stThomasEmailRegex = /^[A-Za-z0-9._%+\-=]+@stthomas\.edu$/i;
        const stThomasEmailStagingRegex = /^[A-Za-z0-9._%+\-=]+@example\.com$/i;
        this.isValidStThomasEmail = stThomasEmailRegex.test(this.stThomasEmail) || stThomasEmailStagingRegex.test(this.stThomasEmail);

        if (!this.isValidStThomasEmail && this.stThomasEmail) {
            eventField.setCustomValidity("Must contain @stthomas.edu");
        }

        eventField.reportValidity();
        console.log("this.stThomasEmail: "+this.stThomasEmail);
    }

    noStudentsFound = false;

// handle search actions
    handleSearchStudent() {
        this.resetForm();
        console.log("email: " + this.stThomasEmail + "bannerId: " + this.bannerId + "lastName: " + this.lastName);

        searchStudent({ searchMode: this.searchMode, bannerId: this.bannerId, lastName: this.lastName, email: this.stThomasEmail })
            .then(result => {
                if (!Array.isArray(result) || result.length === 0) {
                    this.noStudentsFound = true;
                    console.log('No students found');
                    return;
                }

                this.noStudentsFound = false;
                console.log("Found Search Result:", JSON.stringify(result));

                const { Id, FirstName, LastName, Name, Email, hed__UniversityEmail__c, University_Banner_ID__c, St_Thomas_Connection__c } = result[0];
                this.formSubmitSelections.StudentContactId = Id;
                this.formSubmitSelections.StudentName = Name;
                this.formSubmitSelections.StudentEmail = hed__UniversityEmail__c;

                this.tommieCaresOptions = [...this.tommieCaresOptionsAll];
                if (St_Thomas_Connection__c?.toLowerCase().includes("graduate student")) {
                    this.removeTommieCaresOptions(this.tommieCaresGraduateExclusions, this.tommieCaresOptions);
                }
                this.buildAlertGroups();
            })
            .catch(error => {
                // handle error, e.g. show message
                console.error("Search error:", error);
                // Example: this.emailSearchMessage = "Search failed. Please try again.";
            });
    }

    submitAnother() {
        if (window.location && window.location.search) {
            this.searchParamsUrl.searchParams.delete("submitted");
        }
        location.replace(this.searchParamsUrl.toString());
    }

}