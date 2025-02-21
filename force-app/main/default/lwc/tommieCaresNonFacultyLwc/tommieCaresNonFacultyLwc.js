/**
 * Created by nguy0092 on 2/7/2025.
 */

import {LightningElement, api, wire, track} from 'lwc';
import {getPicklistValues} from "lightning/uiObjectInfoApi";
import studentCourseList from "@salesforce/apex/tommieCaresNonFacultyLwcController.studentCourseList";
import studentInformation from "@salesforce/apex/tommieCaresNonFacultyLwcController.studentInformation";
import advisorInformation from "@salesforce/apex/tommieCaresNonFacultyLwcController.advisorInformation";

import TOMMIE_CARES_REASONS from '@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c';
import TOMMIE_HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";
// import saveCase from "@salesforce/apex/TommieCaresLwcController.saveCase";


export default class TommieCaresNonFacultyLwc extends LightningElement {

    @api paramBId = "";
    @api paramUrl = "";
    formAccessIdCheck = true;
    advisorBannerId = ""; /*"101276434";*/
    advisorContactInfo;
    studentContactInfo;
    courseListInfo;
    tommieCaresOptions = [];
    tommieHigh5Options = [];
    tommieCaresExclusions = [
        "Academic performance concerns",
        "Attendance concerns"
    ];

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
        behaviorCheck: false,
        financialConcernsCheck: false,
        mentalHealthCheck: false,
        relationshipCheck: false,
        belongingCheck: false,
        otherCheck: false,
    }

    @track formSubmitSelections = {
        // currentTermId: "",
        AdvisorContactId: "",
        AdvisorEmail: "",
        // CourseSelectionId: "",
        StudentContactId: "",
        TommieCares_Reasons: "",
        High5_Reasons: "",
        // Attendance_Reasons: "",
        // Academic_Reasons: "",
        High5_Details: "",
        Pass_Course_Selection: "",
        Other_Details: "",
        Personal_Message: "",
        Additional_Concerns: "",
    };

    @track formRequired = {
        High5_Required: false,
        // Attendance_Required: false,
        // Academic_Required: false,
        PassCourse_Required: false,
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
                // case "sbid":
                //     if (!this.paramSBid) {
                //         this.paramSBid = keyValue[1];
                //     }
                //     break;
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

    @wire (advisorInformation, {advisorBannerId: "$paramBId"})
    advisorInformationWire({error, data}) {
        if (data) {
            this.advisorContactInfo = JSON.parse(JSON.stringify(data));

            this.advisorContactIdCheck = !!this.advisorContactInfo.Id;
            this.noAdvisorContactIdCheck = !this.advisorContactIdCheck;
        }

        if (error) {
            console.log("advisorInformationWire error!");
        }
    }

    // @wire (studentInformation, {studentContactId: "$studentContactId"})
    // studentInformationWire({error, data}) {
    //     if (data) {
    //         this.studentContactInfo = JSON.parse(JSON.stringify(data));
    //     }
    //
    //     if (error) {
    //         console.log("studentInformationWire error!");
    //     }
    // }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_CARES_REASONS })
    pickListTommieCares({ error, data }) {
        if (data) {
            this.tommieCaresOptions = JSON.parse(JSON.stringify(data.values));

            for (const exclusion of this.tommieCaresExclusions) {
                const index = this.tommieCaresOptions.findIndex((obj) => obj.label === exclusion);

                if (index !== -1) {
                    this.tommieCaresOptions.splice(index, 1);
                }
            }
            // console.log("Cares List: "+JSON.stringify(data.values));
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

    selectedStudentContactId(event) {
        this.formSubmitSelections.StudentContactId = event.detail.id;

        if (!(!!this.formSubmitSelections.StudentContactId)) {
            this.resetForm();
        }
        console.log("What is Student Contact Id: "+event.detail.id);
    }

    clickMeValue(event) {
        console.log("formSubmitSelections: "+JSON.stringify(this.formSubmitSelections));
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
                if (event.target.value === "Sense of belonging") {
                    this.selectionsCheck.belongingCheck = event.target.checked;
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

        for (const selection in this.formSubmitSelections) {
            this.formSubmitSelections[selection] = "";
        }

        for (const check in this.selectionsCheck) {
            this.selectionsCheck[check] = false;
        }

        for (const required in this.formRequired) {
            this.formRequired[required] = false;
        }
    }

    submittedUrl() {
        let reloadUrl = new URL(this.paramUrl);

        reloadUrl.searchParams.set("bid", this.paramBId);
        // reloadUrl.searchParams.set("sbid", "");
        // reloadUrl.searchParams.set("crn", "");
        reloadUrl.searchParams.set("submitted", "true");

        return reloadUrl;
    }

    async submitCase() {
        // this.formSubmitSelections.currentTermId = this.termAdvisorData.Current_Term;
        this.formSubmitSelections.AdvisorContactId = this.advisorContactInfo.Id;
        this.formSubmitSelections.AdvisorEmail = this.advisorContactInfo.Email;
        // this.formSubmitSelections.CourseSelectionId = this.courseSelection;

        try {
            this.caseSubmittedErrorCheck = false;
            window.scrollTo(0, 0);
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

    // @wire (studentCourseList, {studentContactId: "$studentContactId"})
    // coursesListWire({error, data}) {
    //     if (data) {
    //         this.courseListInfo = JSON.parse(JSON.stringify(data));
    //     }
    //
    //     if (error) {
    //         console.log("coursesListWire error!");
    //     }
    // }

    // showId(event) {
    //
    //     this.studentContactId = event.detail.recordId;
    //     console.log("What is ID: "+event.detail.recordId);
    // }

}