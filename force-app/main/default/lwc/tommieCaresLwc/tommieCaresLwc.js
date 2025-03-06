/**
 * Created by nguy0092 on 10/8/2024.
 */

import {LightningElement, api, wire, track} from 'lwc';
import {refreshApex} from "@salesforce/apex";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import currentTermAdvisor from "@salesforce/apex/TommieCaresLwcController.currentTermAdvisor";
import advisorCoursesList from "@salesforce/apex/TommieCaresLwcController.advisorCoursesList";
import studentCourseList from "@salesforce/apex/TommieCaresLwcController.studentCourseList";
import saveCase from "@salesforce/apex/TommieCaresLwcController.saveCase";
import TOMMIE_CARES_REASONS from '@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c';
import TOMMIE_HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";
import ATTENDANCE_CONCERNS_REASONS from "@salesforce/schema/Case.Attendance_Concerns_Reason_s__c";
import ACADEMIC_PERFORMANCE_REASONS from '@salesforce/schema/Case.Academic_Performance_Reason_s__c';

export default class TommieCaresLwc extends LightningElement {

    @api paramBId = "";
    @api paramSBid = "";
    @api paramCrn = "";
    @api paramUrl = "";

    coursesListOptions = [];
    studentsList = [];
    @track studentsListOptions = [];
    tommieCaresOptionsAll = [];
    @track tommieCaresOptions = [];
    tommieHigh5Options = [];
    attendanceOptions = [];
    academicOptions = [];

    tommieCaresGraduateExclusions = [
        "Behavior concerns",
        "Financial concerns",
        "Mental health concerns",
        "Relationship violence/stalking",
        "Sense of belonging",
        "Other",
    ];

    passCourseOptions = [
        {label: "", value: ""},
        {label: "Yes", value: "Yes"},
        {label: "No", value: "No"},
        {label: "Maybe", value: "Maybe"},
    ]

    @track termAdvisorData = {};

    courseSelection;

    get studentSelection() {
        return this.formSubmitSelections.StudentContactId;
    }

    @track formSubmitSelections = {
        currentTermId: "",
        AdvisorContactId: "",
        AdvisorEmail: "",
        CourseSelectionId: "",
        StudentContactId: "",
        TommieCares_Reasons: "",
        High5_Reasons: "",
        Attendance_Reasons: "",
        Academic_Reasons: "",
        High5_Details: "",
        Pass_Course_Selection: "",
        Other_Details: "",
        Personal_Message: "",
        Additional_Concerns: "",
    };

    noCurrentTermCheck = false;
    advisorContactIdCheck = false;
    noAdvisorContactIdCheck = false;
    caseSubmittedCheck = false;
    caseSubmittedErrorCheck = false;

    get courseSelectionCheck() {
        return !!this.courseSelection;
    }
    get studentSelectionCheck() {
        return !!this.formSubmitSelections.StudentContactId;
    };
    get caresSelectionCheck() {
        return !!this.formSubmitSelections.TommieCares_Reasons;
    };

    @track selectionsCheck = {
        high5Check: false,
        attendanceCheck: false,
        academicCheck: false,
        attendanceAcademicCheck: false,
        behaviorCheck: false,
        financialConcernsCheck: false,
        mentalHealthCheck: false,
        relationshipCheck: false,
        belongingCheck: false,
        otherCheck: false,
    }

    @track formRequired = {
        High5_Required: false,
        Attendance_Required: false,
        Academic_Required: false,
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
                case "sbid":
                    if (!this.paramSBid) {
                        this.paramSBid = keyValue[1];
                    }
                    break;
                case "crn":
                    if (!this.paramCrn) {
                        this.paramCrn = keyValue[1];
                    }
                    break;
                case "submitted":
                    if (keyValue[1] === "true") {
                        this.caseSubmittedCheck = true;
                    }
            }
        }
    }

    @wire(currentTermAdvisor, {urlBid: "$paramBId"})
    termAdvisorWire({error, data}) {
        if (data) {
            this.termAdvisorData = JSON.parse(JSON.stringify(data));

            this.noCurrentTermCheck = !(!!this.termAdvisorData.Current_Term);
            this.advisorContactIdCheck = !!this.termAdvisorData.Advisor_ContactId;
            this.noAdvisorContactIdCheck = !this.advisorContactIdCheck;
        }

        if (error) {
            console.log("termAdvisorWire error!");
        }
    }

    @wire(advisorCoursesList, {advisorContactId: "$termAdvisorData.Advisor_ContactId", courseCrn: "$paramCrn"})
    coursesListWire({error, data}) {
        if (data) {
            this.coursesListOptions = JSON.parse(JSON.stringify(data));

            if (this.coursesListOptions.length === 1) {
                this.courseSelection = this.coursesListOptions[0].value;
            } else {
                this.coursesListOptions.unshift({value: "", label: "Select Course"});
                this.courseSelection= "";
            }
        }

        if (error) {
            console.log("coursesListWire error!");
        }
    }

    @wire(studentCourseList, {studentBannerId: "$paramSBid", courseId: "$courseSelection"})
    studentCourseListWire({error, data}) {
        let listOptions = [];

        if (data) {
            this.studentsList = JSON.parse(JSON.stringify(data));

            this.studentsList.forEach(s => {
                listOptions.push({label: s.hed__Contact__r.Last_Name_First_Name__c+' ('+s.hed__Contact__r.hed__UniversityEmail__c+')', value: s.hed__Contact__r.Id});
            })

            this.studentsListOptions = listOptions;

            if (this.studentsListOptions.length === 1) {
                this.formSubmitSelections.StudentContactId = this.studentsListOptions[0].value;
                this.studentTypeCheck(this.formSubmitSelections.StudentContactId);
            } else {
                this.studentsListOptions.unshift({label: "Select Student", value: ""});
                this.formSubmitSelections.StudentContactId = "";
            }
        }

        if (error) {
            console.log("studentCourseListWire error!");
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_CARES_REASONS })
    pickListTommieCares({ error, data }) {
        if (data) {
            this.tommieCaresOptionsAll = JSON.parse(JSON.stringify(data.values));
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

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: ACADEMIC_PERFORMANCE_REASONS })
    pickListAcademicPerformance({ error, data }) {
        if (data) {
            this.academicOptions = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("academicPerformancePicklistWire Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: ATTENDANCE_CONCERNS_REASONS })
    pickListAttendanceConcerns({ error, data }) {
        if (data) {
            this.attendanceOptions = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("attendanceConcernsPicklistWire Error: " + error);
        }
    }

    singleSelect(event) {

        switch (event.currentTarget.dataset.selecttype) {
            case "courseSelect":
                this.resetForm();
                this.courseSelection = event.detail.value;
                refreshApex(this.studentsList);
                this.caseSubmittedCheck = false;
                break;
            case "studentSelect":
                this.resetForm();
                this.formSubmitSelections.StudentContactId = event.detail.value;
                this.studentTypeCheck(event.detail.value);
                break;
            case "passCourseSelect":
                this.formSubmitSelections.Pass_Course_Selection = event.detail.value;
                this.passCourseRequired();
                break;
        }
    }

    studentTypeCheck(contactId) {
        this.tommieCaresOptions.splice(0, this.tommieCaresOptions.length, ...this.tommieCaresOptionsAll);

        let foundStudent = this.studentsList.find(s => s.hed__Contact__c === contactId);
        console.log("Selected Student: ", foundStudent);

        function removeTommieCaresOptions(exclusionList, optionsList) {
            for (const exclusion of exclusionList) {
                const index = optionsList.findIndex(option => option.label === exclusion);

                if (index !== -1) {
                    optionsList.splice(index, 1);
                }
            }
        }

        if (foundStudent.hed__Contact__r.St_Thomas_Connection__c.toLowerCase().includes("graduate student")) {
            removeTommieCaresOptions(this.tommieCaresGraduateExclusions, this.tommieCaresOptions);
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
                if (event.target.value === "Attendance concerns") {
                    if (!event.target.checked) {
                        this.formSubmitSelections.Attendance_Reasons = "";
                    }
                    this.selectionsCheck.attendanceCheck = event.target.checked;
                    this.formRequired.Attendance_Required = event.target.checked;
                    this.attendanceAcademic();
                }
                if (event.target.value === "Academic performance concerns") {
                    if (!event.target.checked) {
                        this.formSubmitSelections.Academic_Reasons = "";
                    }
                    this.selectionsCheck.academicCheck = event.target.checked;
                    this.formRequired.Academic_Required = event.target.checked;
                    this.attendanceAcademic();
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
            case "attendance":
                this.formSubmitSelections.Attendance_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.Attendance_Reasons);
                this.formRequired.Attendance_Required = !(!!this.formSubmitSelections.Attendance_Reasons)
                this.passCourseRequired();
                break;
            case "academic":
                this.formSubmitSelections.Academic_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.Academic_Reasons);
                this.formRequired.Academic_Required = !(!!this.formSubmitSelections.Academic_Reasons)
                this.passCourseRequired();
                break;
        }

        if (!(!!this.formSubmitSelections.TommieCares_Reasons)) {
            this.formSubmitSelections.Additional_Concerns = "";
        }
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

    attendanceAcademic() {
        if (this.selectionsCheck.attendanceCheck || this.selectionsCheck.academicCheck) {
            this.selectionsCheck.attendanceAcademicCheck = true;
            this.passCourseRequired();
        } else {
            this.selectionsCheck.attendanceAcademicCheck = false;
            this.formSubmitSelections.Pass_Course_Selection = "";
            this.formSubmitSelections.Personal_Message = "";
            this.formRequired.PassCourse_Required = false;
        }
    }

    passCourseRequired() {
        this.formRequired.PassCourse_Required = !(!!this.formSubmitSelections.Pass_Course_Selection);
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
        reloadUrl.searchParams.set("sbid", "");
        reloadUrl.searchParams.set("crn", "");
        reloadUrl.searchParams.set("submitted", "true");

        return reloadUrl;
    }

    async submitCase() {
        this.formSubmitSelections.currentTermId = this.termAdvisorData.Current_Term;
        this.formSubmitSelections.AdvisorContactId = this.termAdvisorData.Advisor_ContactId;
        this.formSubmitSelections.AdvisorEmail = this.termAdvisorData.Advisor_Email;
        this.formSubmitSelections.CourseSelectionId = this.courseSelection;

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

}