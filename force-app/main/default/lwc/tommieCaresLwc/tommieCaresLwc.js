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
    @api communityOfConcernLwc = ""; //used as a variable for child component in Community of Concern LWC

    @track studentsListOptions = [];
    @track tommieCaresOptionsAll = [];
    @track tommieCaresOptions = [];
    @track tommieHigh5Options = [];
    @track attendanceOptions = [];
    @track academicOptions = [];
    @track termAdvisorData = {};
    @track positiveAlertGroup = [];
    @track advisingGroup = [];
    @track behaviorMentalHealthGroup = [];
    @track lifeCircumstanceGroup = [];
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
    @track selectionsCheck = {
        high5Check: false,
        attendanceCheck: false,
        academicCheck: false,
        attendanceAcademicCheck: false,
        behaviorCheck: false,
        financialConcernsCheck: false,
        mentalHealthCheck: false,
        missedAdvisingAppointmentCheck: false,
        nonResponsiveToOutreachCheck: false,
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

    coursesListOptions = [];
    studentsList = [];
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
        {"Advising Alert": [
                "Academic performance concerns",
                "Attendance concerns",
                "Academic Standing Requirement Not Met (only for Academic Counselors)",
                "Missed Advising Appointment",
                "Non-Responsive to Outreach"
            ]},
        {"Behavior Mental Health Alert": ["Behavior concerns", "Mental health concerns", "Relationship violence/stalking"]},
        {"Life Circumstances Alert": ["Difficulty Meeting Basic Needs (food/housing, etc)", "Financial concerns", "Life Circumstances Impacting Success", "Sense of belonging", "Other"]},
    ]
    passCourseOptions = [
        {label: "", value: ""},
        {label: "Yes", value: "Yes"},
        {label: "No", value: "No"},
        {label: "Maybe", value: "Maybe"},
    ]
    searchParamsUrl;
    courseSelection;
    noCurrentTermCheck = false;
    advisorContactIdCheck = false;
    noAdvisorContactIdCheck = false;
    caseSubmittedCheck = false;
    caseSubmittedErrorCheck = false;
    submitCaseSpinner = false;

    get advisorInfoViewClass() {
        return "advisor_info "+this.communityOfConcernLwc; //hiding Advisor information when displaying on Community of Concern LWC
    }
    get communityOfConcernLwcNoAdvisor() {
        return !!this.communityOfConcernLwc; //returns no faculty information was found when displaying on Community of Concern LWC
    }
    get studentSelection() {
        return this.formSubmitSelections.StudentContactId;
    }
    get courseSelectionCheck() {
        return !!this.courseSelection;
    }
    get studentSelectionCheck() {
        return !!this.formSubmitSelections.StudentContactId;
    }
    get caresSelectionCheck() {
        return !!this.formSubmitSelections.TommieCares_Reasons;
    }
    get showAdditionalConcerns() {
        const excluded = new Set(['otherCheck', 'high5Check']);
        return Object.entries(this.selectionsCheck).some(([key, value]) => !excluded.has(key) && value);
    }
    get submitDisable() {
        return Object.values(this.formRequired).includes(true);
    }

    connectedCallback() {
        const baseUrl = this.paramUrl || window.location.href;
        this.searchParamsUrl = new URL(baseUrl);
        for (let [key, value] of this.searchParamsUrl.searchParams.entries()) {
            switch (key) {
                case "bid":
                    if (!this.paramBId) this.paramBId = value;
                    break;
                case "sbid":
                    if (!this.paramSBid) this.paramSBid = value;
                    break;
                case "crn":
                    if (!this.paramCrn) this.paramCrn = value;
                    break;
                case "submitted":
                    if (value === "true") this.caseSubmittedCheck = true;
                    break;
            }
        }
    }

    @wire(currentTermAdvisor, {urlBid: "$paramBId"})
    termAdvisorWire({error, data}) {
        if (data) {
            this.termAdvisorData = JSON.parse(JSON.stringify(data));

            this.noCurrentTermCheck = !this.termAdvisorData.Current_Term;
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

        if (foundStudent) {
            if (foundStudent.hed__Contact__r.St_Thomas_Connection__c?.toLowerCase().includes("graduate student")) {
                removeTommieCaresOptions(this.tommieCaresGraduateExclusions, this.tommieCaresOptions);
            }
        }

        this.buildAlertGroups();
    }

    buildAlertGroups() {
        const groupMap = {
            "Positive Alert":         "positiveAlertGroup",
            "Advising Alert":               "advisingGroup",
            "Behavior Mental Health Alert": "behaviorMentalHealthGroup",
            "Life Circumstances Alert":     "lifeCircumstanceGroup",
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
        const eventValue = event.target.value;
        const eventChecked = event.target.checked;

        switch (event.currentTarget.dataset.checkboxtype) {
            case "cares":
                this.formSubmitSelections.TommieCares_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.TommieCares_Reasons);

                if (eventValue === "Tommie High 5") {
                    if (!eventChecked) {
                        this.formSubmitSelections.High5_Reasons = "";
                        this.formSubmitSelections.High5_Details = "";
                    }
                    this.selectionsCheck.high5Check = eventChecked;
                    this.formRequired.High5_Required = eventChecked;
                }
                if (eventValue === "Academic performance concerns") {
                    if (!eventChecked) {
                        this.formSubmitSelections.Academic_Reasons = "";
                    }
                    this.selectionsCheck.academicCheck = eventChecked;
                    this.formRequired.Academic_Required = eventChecked;
                    this.attendanceAcademic();
                }
                if (eventValue === "Attendance concerns") {
                    if (!eventChecked) {
                        this.formSubmitSelections.Attendance_Reasons = "";
                    }
                    this.selectionsCheck.attendanceCheck = eventChecked;
                    this.formRequired.Attendance_Required = eventChecked;
                    this.attendanceAcademic();
                }
                if (eventValue === "Missed Advising Appointment") {
                    this.selectionsCheck.missedAdvisingAppointmentCheck = eventChecked;
                }
                if (eventValue === "Non-Responsive to Outreach") {
                    this.selectionsCheck.nonResponsiveToOutreachCheck = eventChecked;
                }
                if (eventValue === "Behavior concerns") {
                    this.selectionsCheck.behaviorCheck = eventChecked;
                }
                if (eventValue === "Financial concerns") {
                    this.selectionsCheck.financialConcernsCheck = eventChecked;
                }
                if (eventValue === "Mental health concerns") {
                    this.selectionsCheck.mentalHealthCheck = eventChecked;
                }
                if (eventValue === "Relationship violence/stalking") {
                    this.selectionsCheck.relationshipCheck = eventChecked;
                }
                if (eventValue === "Sense of belonging") {
                    this.selectionsCheck.belongingCheck = eventChecked;
                }
                if (eventValue === "Other") {
                    if (!eventChecked) {
                        this.formSubmitSelections.Other_Details = "";
                    }
                    this.selectionsCheck.otherCheck = eventChecked;
                    this.formRequired.Other_Required = eventChecked;
                }
                break;
            case "high5":
                this.formSubmitSelections.High5_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.High5_Reasons);
                this.formRequired.High5_Required = !(this.formSubmitSelections.High5_Reasons && this.formSubmitSelections.High5_Details);
                break;
            case "attendance":
                this.formSubmitSelections.Attendance_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.Attendance_Reasons);
                this.formRequired.Attendance_Required = !this.formSubmitSelections.Attendance_Reasons;
                this.passCourseRequired();
                break;
            case "academic":
                this.formSubmitSelections.Academic_Reasons = this.checkBoxSelect(event, this.formSubmitSelections.Academic_Reasons);
                this.formRequired.Academic_Required = !this.formSubmitSelections.Academic_Reasons;
                this.passCourseRequired();
                break;
        }

        if (!this.formSubmitSelections.TommieCares_Reasons || !this.showAdditionalConcerns) {
            this.formSubmitSelections.Additional_Concerns = "";
        }
    }

    textAreaDetails(event) {
        const eventValueTrim = event.detail.value.trim();

        switch (event.currentTarget.dataset.texttype) {
            case "high5Details":
                this.formSubmitSelections.High5_Details = eventValueTrim;
                this.formRequired.High5_Required = !(this.formSubmitSelections.High5_Reasons && this.formSubmitSelections.High5_Details);
                break;
            case "otherDetails":
                this.formSubmitSelections.Other_Details = eventValueTrim;
                this.formRequired.Other_Required = !this.formSubmitSelections.Other_Details;
                break;
            case "personalMessage":
                this.formSubmitSelections.Personal_Message = eventValueTrim;
                break;
            case "additionalConcerns":
                this.formSubmitSelections.Additional_Concerns = eventValueTrim;
                break;
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
        this.formRequired.PassCourse_Required = !this.formSubmitSelections.Pass_Course_Selection;
    }

    resetForm() {
        this.positiveAlertGroup = [];
        this.advisingGroup = [];
        this.behaviorMentalHealthGroup = [];
        this.lifeCircumstanceGroup = [];

        this.template.querySelectorAll("input[type='checkbox']").forEach(check => {
            check.checked = false;
        });

        Object.keys(this.formSubmitSelections).forEach(k => {
            this.formSubmitSelections[k] = ""
        });
        Object.keys(this.selectionsCheck).forEach(k => {
            this.selectionsCheck[k] = false
        });
        Object.keys(this.formRequired).forEach(k => {
            this.formRequired[k] = false
        });
    }

    submittedUrl() {
        this.searchParamsUrl.searchParams.set("bid", this.paramBId);
        this.searchParamsUrl.searchParams.set("sbid", "");
        this.searchParamsUrl.searchParams.set("crn", "");
        this.searchParamsUrl.searchParams.set("submitted", "true");

        return this.searchParamsUrl;
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