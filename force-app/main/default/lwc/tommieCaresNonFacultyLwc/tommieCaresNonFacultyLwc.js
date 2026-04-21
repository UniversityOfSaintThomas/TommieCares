/**
 * Created by nguy0092 on 2/7/2025.
 */

import {LightningElement, api, wire, track} from 'lwc';
import {getPicklistValues} from "lightning/uiObjectInfoApi";
import advisorInformation from "@salesforce/apex/TommieCaresNonFacultyLwcController.advisorInformation";
import TOMMIE_CARES_REASONS from '@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c';
import TOMMIE_HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";
import saveCase from "@salesforce/apex/TommieCaresNonFacultyLwcController.saveCase";

export default class TommieCaresNonFacultyLwc extends LightningElement {

    @api paramUrl = "";
    paramBId = "";
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

    get studentSelectionCheck() {
        return !!this.formSubmitSelections.StudentContactId;
    };

    get caresSelectionCheck() {
        return !!this.formSubmitSelections.TommieCares_Reasons;
    };

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
        let searchParamsUrl = new URL(this.paramUrl);
        let paramsString = new URLSearchParams(searchParamsUrl.searchParams);

        for (let keyValue of paramsString.entries()) {

            switch (keyValue[0]) {
                case "bid":
                    if (!this.paramBId) {
                        this.paramBId = keyValue[1];
                    }
                    break;
                case "submitted":
                    if (keyValue[1] === "true") {
                        this.caseSubmittedCheck = true;
                    }
            }
        }
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

    selectStudentContactId(event) {
        const { id, subField } = event.detail;

        this.caseSubmittedCheck = false;

        if (!id) {
            this.resetForm();
            return;
        }

        // Student selected — rebuild and filter alert reason options
        this.tommieCaresOptions = [...this.tommieCaresOptionsAll];
        this.formSubmitSelections.StudentContactId = id;

        if (subField?.toLowerCase().includes("graduate student")) {
            this.removeTommieCaresOptions(this.tommieCaresGraduateExclusions, this.tommieCaresOptions);
        }

        this.buildAlertGroups();
    }

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

        if (!(!!this.formSubmitSelections.TommieCares_Reasons)) {
            this.formSubmitSelections.Additional_Concerns = "";
        }
    }

    checkBoxSelect(evt, selectionType) {
        let selections = !!selectionType ? selectionType.split(";") : [];

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

        for (const selection in this.formSubmitSelections) {
            this.formSubmitSelections[selection] = "";
        }

        for (const check in this.selectionsCheck) {
            this.selectionsCheck[check] = false;
        }

        for (const required in this.formRequired) {
            this.formRequired[required] = false;
        }

        this.positiveAlertGroup = [];
        this.advisingGroup = [];
        this.behaviorMentalHealthGroup = [];
        this.lifeCircumstanceGroup = [];
    }

    submittedUrl() {
        let reloadUrl = new URL(this.paramUrl);

        reloadUrl.searchParams.set("bid", this.paramBId);
        reloadUrl.searchParams.set("submitted", "true");

        return reloadUrl;
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

}