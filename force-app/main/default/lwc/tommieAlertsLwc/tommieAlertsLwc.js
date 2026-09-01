/**
 * Created by nguy0092 on 09/01/2026
 * Calls TellSomeone child LWC components:
 * tellSomeoneTitleIxIncidentReport and tellSomeoneWellBeingIncidentReport
 */

import {LightningElement, api, wire, track} from 'lwc';
import {refreshApex} from "@salesforce/apex";
import getTommieCaresPicklists from "@salesforce/apex/TommieAlertsLwcController.getTommieCaresPicklists";
import currentTermAdvisor from "@salesforce/apex/TommieAlertsLwcController.currentTermAdvisor";
import advisorCoursesList from "@salesforce/apex/TommieAlertsLwcController.advisorCoursesList";
import studentCourseList from "@salesforce/apex/TommieAlertsLwcController.studentCourseList";
import submitTommieAlertsCase from "@salesforce/apex/TommieAlertsLwcController.submitTommieAlertsCase";
import submitWellBeingReportForm from "@salesforce/apex/TellSomeoneLwcController.submitWellBeingReportForm";
import submitTitleIxReportForm from "@salesforce/apex/TellSomeoneLwcController.submitTitleIxReportForm";
import {tommieAlertsTellSomeoneSubmission} from "c/tellSomeoneUtilJs";

export default class TommieAlertsLwc extends LightningElement {
    //To TellSomeone child component
    get childProps() {
        return {
            tellSomeoneReportType: "Faculty",
            tellSomeoneReporterFirstName: this.termAdvisorData.Advisor_FirstName,
            tellSomeoneReporterLastName: this.termAdvisorData.Advisor_LastName,
            tellSomeoneReporterEmail: this.termAdvisorData.Advisor_Email,
            tellSomeoneConcernWhoValue: "Student",
            tellSomeoneParamsUrl: this.searchParamsUrl,
            tommieAlertsReporterPhone: "Tommie Alerts Submission",
            tommieAlertsStudentName: this.studentName,
            tommieAlertsStudentEmail: this.studentEmail,
            tommieAlertsHideCss: "tommie-alerts_hide",
        }
    }

    @api paramBId = "";
    @api paramSBid = "";
    @api paramCrn = "";
    @api paramUrl = "";
    @api tellSomeoneLwc = ""; //used as a variable for child component in Tell Someone LWC

    @track studentsListOptions = [];
    @track tommieCaresOptionsAll = [];
    @track tommieCaresOptions = [];
    @track tommieHigh5Options = [];
    @track attendanceOptions = [];
    @track academicOptions = [];
    @track termAdvisorData = {};
    @track positiveAlertGroup = [];
    @track advisingGroup = [];
    @track behaviorWellBeingGroup = [];
    @track lifeCircumstanceGroup = [];
    @track formSubmitSelections = {
        currentTermId: "",
        AdvisorContactId: "",
        AdvisorContactName: "",
        AdvisorEmail: "",
        CourseSelectionId: "",
        StudentContactId: "",
        StudentName: "",
        StudentEmail: "",
        TommieCares_Reasons: "",
        High5_Reasons: "",
        Attendance_Reasons: "",
        Academic_Reasons: "",
        High5_Details: "",
        Pass_Course_Selection: "",
        Other_Details: "",
        Personal_Message: "",
        Additional_Concerns: "",
        submitWellBeingFormFail: false,
        TellSomeoneWellBeingReportNumber: "",
        submitTitleIxIncidentFormFail: false,
        TellSomeoneTitleIxReportNumber: "",
    };
    @track selectionsCheck = {
        high5Check: false,
        attendanceCheck: false,
        academicCheck: false,
        attendanceAcademicCheck: false,
        missedAdvisingAppointmentCheck: false,
        nonResponsiveOutreachCheck: false,
        behaviorWellBeingCheck: false,
        relationshipCheck: false,
        difficultyMeetingBasicNeedsCheck: false,
        financialConcernsCheck: false,
        lifeCircumstanceImpactingSuccessCheck: false,
        senseOfBelongingCheck: false,
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
        "Behavior or Well-Being Concern",
        "Behavior concerns",
        "Financial concerns",
        "Mental health concerns",
        "Relationship violence/stalking",
        "Sense of belonging",
        "Other",
    ];
    tellSomeoneExclusions = [
        "Behavior or Well-Being Concern",
        "Behavior concerns",
        "Mental health concerns",
        "Relationship violence/stalking",
        "Sense of belonging",
    ]
    alertGroupingsFilter = [
        {"Positive Alert": ["Tommie High 5"]},
        {"Advising Alert": [
                "Academic performance concerns",
                "Attendance concerns",
                "Academic Standing Requirement Not Met (only for Academic Counselors)",
                "Missed Advising Appointment",
                "Non-Responsive to Outreach"
            ]},
        {"Behavior Well Being Alert": ["Behavior or Well-Being Concern", "Relationship violence/stalking", "Sense of belonging",]},
        {"Life Circumstances Alert": ["Difficulty Meeting Basic Needs (food/housing, etc)", "Financial concerns", "Life Circumstances Impacting Success",  "Other"]},
    ]
    passCourseOptions = [
        {label: "", value: ""},
        {label: "Yes", value: "Yes"},
        {label: "No", value: "No"},
        {label: "Maybe", value: "Maybe"},
    ]
    searchParamsUrl;
    courseSelection;
    studentName = "";
    studentEmail = "";
    noCurrentTermCheck = false;
    advisorContactIdCheck = false;
    noAdvisorContactIdCheck = false;
    submitCaseSpinner = false;
    // _incidentDate = "";

    get initialPageView() {
        return this.advisorContactIdCheck && !this.caseSubmittedCheck;
    }
    get caseSubmittedSuccessCheck() {
        return this.caseSubmittedCheck
            && !this.caseSubmittedErrorCheck
            && !this.formSubmitSelections.submitWellBeingFormFail
            && !this.formSubmitSelections.submitTitleIxIncidentFormFail;
    }
    get advisorInfoViewClass() {
        return "advisor_info "+this.tellSomeoneLwc; //hiding Advisor information when displaying on Community of Concern LWC
    }
    get tellSomeoneLwcNoAdvisor() {
        return !!this.tellSomeoneLwc; //returns no faculty information was found when displaying on Community of Concern LWC
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
        const excluded = new Set(['high5Check', 'behaviorWellBeingCheck', 'senseOfBelongingCheck', 'otherCheck']);
        return Object.entries(this.selectionsCheck).some(([key, value]) => !excluded.has(key) && value);
    }
    get tellSomeoneWellBeingVisible() {
        return !!(this.selectionsCheck.behaviorWellBeingCheck || this.selectionsCheck.senseOfBelongingCheck);
    }
    get submitDisable() {
        return Object.values(this.formRequired).includes(true)
            || (this.tellSomeoneWellBeingVisible && this.tellSomeoneWellBeingSubmitDisable)
            || (this.selectionsCheck.relationshipCheck && this.tellSomeoneTitleIxSubmitDisable);
    }

    hasAncestorWithId(startNode, id) {
        let node = startNode;

        while (node) {
            node = node.parentNode;

            if (typeof ShadowRoot !== "undefined" && node instanceof ShadowRoot) {
                node = node.host;
            }

            if (node && node.nodeType === 1 && node.id === id) {
                return true;
            }
        }

        return false;
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

        // eslint-disable-next-line @lwc/lwc/no-document-query
        const idInUse = document.getElementById('tommieAlertsLightingOut') || this.hasAncestorWithId(this, 'tommieAlertsLightingOut');
        if (idInUse) {
            console.log("Lighting Out");
        } else {
            console.log("NOT Lighting Out");
        }

    }

    @wire(getTommieCaresPicklists)
    picklistsWire({ error, data }) {
        if (data) {
            this.tommieCaresOptionsAll = JSON.parse(JSON.stringify(data.tommieCaresReasons || []));
            this.tommieHigh5Options = JSON.parse(JSON.stringify(data.tommieHigh5Reasons || []));
            this.academicOptions = JSON.parse(JSON.stringify(data.academicPerformanceReasons || []));
            this.attendanceOptions = JSON.parse(JSON.stringify(data.attendanceConcernsReasons || []));
        } else if (error) {
            console.log("picklistsWire Error: " + JSON.stringify(error));
        }
    }

    @wire(currentTermAdvisor, {urlBid: "$paramBId"})
    termAdvisorWire({error, data}) {
        if (data) {
            this.termAdvisorData = JSON.parse(JSON.stringify(data));

            this.noCurrentTermCheck = !this.termAdvisorData.Current_Term;
            this.advisorContactIdCheck = !!this.termAdvisorData.Advisor_ContactId;
            this.noAdvisorContactIdCheck = !this.advisorContactIdCheck;

            // if (this.termAdvisorData.Advisor_StThomasConnection?.includes("Faculty")) {
            //     this.termAdvisorData.Advisor_StThomasConnection = "Faculty";
            // } else if (this.termAdvisorData.Advisor_StThomasConnection?.includes("Staff")) {
            //     this.termAdvisorData.Advisor_StThomasConnection = "Staff";
            // } else if (this.termAdvisorData.Advisor_StThomasConnection?.includes("Student")) {
            //     this.termAdvisorData.Advisor_StThomasConnection = "Student";
            // }
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

    singleSelect(event) {
        const eventValue = event.detail.value;

        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.selecttype) {
            case "courseSelect":
                this.resetForm();
                this.courseSelection = eventValue;
                refreshApex(this.studentsList);
                this.caseSubmittedCheck = false;
                break;
            case "studentSelect":
                this.resetForm();
                this.formSubmitSelections.StudentContactId = eventValue;
                this.studentTypeCheck(eventValue);
                break;
            case "passCourseSelect":
                this.formSubmitSelections.Pass_Course_Selection = eventValue;
                this.passCourseRequired();
                break;
        }
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
            "Advising Alert":               "advisingGroup",
            "Behavior Well Being Alert": "behaviorWellBeingGroup",
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

    studentTypeCheck(contactId) {
        this.tommieCaresOptions.splice(0, this.tommieCaresOptions.length, ...this.tommieCaresOptionsAll);

        let foundStudent = this.studentsList.find(s => s.hed__Contact__c === contactId);
        console.log("Selected Student: ", foundStudent);

        if (foundStudent) {
            this.studentName = foundStudent.hed__Contact__r.Mailing_First_Name__c + " " + foundStudent.hed__Contact__r.LastName;
            this.studentEmail = foundStudent.hed__Contact__r.hed__UniversityEmail__c;
            if (foundStudent.hed__Contact__r.St_Thomas_Connection__c?.toLowerCase().includes("graduate student")) {
                this.removeTommieCaresOptions(this.tommieCaresGraduateExclusions, this.tommieCaresOptions);
            }
        }
        
        if (this.tellSomeoneLwc) {
            this.removeTommieCaresOptions(this.tellSomeoneExclusions, this.tommieCaresOptions);
        }

        this.buildAlertGroups();
    }

    reasonsCheckbox(event) {
        const eventValue = event.target.value;
        const eventChecked = event.target.checked;

        // eslint-disable-next-line default-case
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
                    this.selectionsCheck.nonResponsiveOutreachCheck = eventChecked;
                }
                if (eventValue === "Behavior or Well-Being Concern") {
                    this.selectionsCheck.behaviorWellBeingCheck = eventChecked;
                    if(!this.tellSomeoneWellBeingVisible) {
                        this.tellSomeoneWellBeingSubmitDisable = true;
                    }
                }
                if (eventValue === "Relationship violence/stalking") {
                    this.selectionsCheck.relationshipCheck = eventChecked;
                    if(!eventChecked) {
                        this.tellSomeoneTitleIxSubmitDisable = true;
                    }
                }
                if (eventValue === "Sense of belonging") {
                    this.selectionsCheck.senseOfBelongingCheck = eventChecked;
                    if(!this.tellSomeoneWellBeingVisible) {
                        this.tellSomeoneWellBeingSubmitDisable = true;
                    }
                }
                if (eventValue === "Difficulty Meeting Basic Needs (food/housing, etc)") {
                    this.selectionsCheck.difficultyMeetingBasicNeedsCheck = eventChecked;
                }
                if (eventValue === "Financial concerns") {
                    this.selectionsCheck.financialConcernsCheck = eventChecked;
                }
                if (eventValue === "Life Circumstances Impacting Success") {
                    this.selectionsCheck.lifeCircumstanceImpactingSuccessCheck = eventChecked;
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

        // eslint-disable-next-line default-case
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
        this.behaviorWellBeingGroup = [];
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

    submitAnother() {
        if (window.location && window.location.search) {
            this.searchParamsUrl.searchParams.delete("submitted");
        }
        // eslint-disable-next-line no-restricted-globals
        location.replace(this.searchParamsUrl.toString());
    }

    tellSomeoneWellBeingSubmitDisable = true;
    tellSomeoneWellBeingCheck(event) {
        this.tellSomeoneWellBeingSubmitDisable = event.detail.value;
        console.log("tellSomeoneWellBeingCheck event: ", this.tellSomeoneWellBeingSubmitDisable);
    }

    tellSomeoneTitleIxSubmitDisable = true;
    tellSomeoneTitleIxSubmitCheck(event) {
        this.tellSomeoneTitleIxSubmitDisable = event.detail.value;
        console.log("tellSomeoneTitleIxSubmitCheck event: ", this.tellSomeoneTitleIxSubmitDisable);
    }

    get tellSomeoneWellBeingAttempt() {
        if (!this.formSubmitSelections.submitWellBeingFormFail && this.formSubmitSelections.TellSomeoneWellBeingReportNumber) {
            return "pass"
        }
        if (this.formSubmitSelections.submitWellBeingFormFail) {
            return "fail"
        }
        return "no attempt"
    }

    get tellSomeoneTitleIXAttempt() {
        if (!this.formSubmitSelections.submitTitleIxIncidentFormFail && this.formSubmitSelections.TellSomeoneTitleIxReportNumber) {
            return "pass"
        }
        if (this.formSubmitSelections.submitTitleIxIncidentFormFail) {
            return "fail"
        }
        return "no attempt"
    }

    get tellSomeoneSubmitErrorMsg() {
        const groups = [];

        // Tommie Alert case submission
        const caseGroup = [];
        if (this.caseSubmittedErrorCheck) {
            caseGroup.push(`Not Received: Tommie Alert to the Center for Student Achievement: Retention and Student Success.<br>
            Please contact the Center for Student Achievement: Retention and Student Success directly at <a href="mailto:studentsuccess@stthomas.edu" target="_blank" style="color:rebeccapurple">studentsuccess@stthomas.edu</a> so this concern is recorded.`);
        } else {
            caseGroup.push(`Received: Tommie Alert to the Center for Student Achievement: Retention and Student Success.`);
        }
        groups.push(caseGroup);

        // Behavior/Well Being (Dean of Students) submission
        const wellBeingGroup = [];
        if (this.tellSomeoneWellBeingAttempt === 'fail') {
            wellBeingGroup.push(`Not Received: the report to the Dean of Students.<br>
            Please contact the Dean of Students directly at <a href="mailto:deanstudents@stthomas.edu" target="_blank" style="color:rebeccapurple">deanstudents@stthomas.edu</a> so this concern is recorded.`);
        } else if (this.tellSomeoneWellBeingAttempt === 'pass') {
            wellBeingGroup.push(`Received: The report to the Dean of Students.`);
            if (this.wellBeingSaveDocumentsFail) {
                wellBeingGroup.push(`Documents did not save. Please contact the Dean of Students directly at <a href="mailto:deanstudents@stthomas.edu" target="_blank" style="color:rebeccapurple">deanstudents@stthomas.edu</a> to have your supporting documents attached.`);
            }
        }
        if (wellBeingGroup.length > 0) {
            groups.push(wellBeingGroup);
        }

        // Title IX submission
        const titleIxGroup = [];
        if (this.tellSomeoneTitleIXAttempt === 'fail') {
            titleIxGroup.push(`Not Received: the Title IX report.<br>
            For a relationship violence, stalking, or Title IX concern, please contact the Title IX Office directly at <a href="mailto:centerforwellbeing@stthomas.edu" target="_blank" style="color:rebeccapurple">centerforwellbeing@stthomas.edu</a> so this concern is recorded.`);
        } else if (this.tellSomeoneTitleIXAttempt === 'pass') {
            titleIxGroup.push(`Received: The Title IX report.`);
            if (this.titleIxSaveDocumentsFail) {
                titleIxGroup.push(`Documents did not save. Please contact the Title IX Office directly at <a href="mailto:centerforwellbeing@stthomas.edu" target="_blank" style="color:rebeccapurple">centerforwellbeing@stthomas.edu</a> to have your supporting documents attached.`);
            }
        }
        if (titleIxGroup.length > 0) {
            groups.push(titleIxGroup);
        }

        const anyFailed = this.caseSubmittedErrorCheck
            || this.tellSomeoneWellBeingAttempt === 'fail'
            || this.tellSomeoneTitleIXAttempt === 'fail'
            || this.wellBeingSaveDocumentsFail
            || this.titleIxSaveDocumentsFail;
        const anyPassed = !this.caseSubmittedErrorCheck
            || this.tellSomeoneWellBeingAttempt === 'pass'
            || this.tellSomeoneTitleIXAttempt === 'pass';

        let header;
        if (anyFailed && anyPassed) {
            header = `<p class="slds-m-bottom_none"><b>Your submission was only partly successful</b></p>`;
        } else if (anyFailed) {
            header = `<p class="slds-m-bottom_none"><b>Your submission was not successful</b></p>`;
        } else {
            return "";
        }

        const body = groups
            .map(group => `<p>${group.join('<br>')}</p>`)
            .join('');

        return `${header}${body}`.replace(/\n\s*/g, ' ');
    }

    caseSubmittedCheck = false;
    caseSubmittedErrorCheck = false;
    wellBeingSaveDocumentsFail = false;
    titleIxSaveDocumentsFail = false;
    async submitCase() {
        this.formSubmitSelections.currentTermId = this.termAdvisorData.Current_Term;
        this.formSubmitSelections.AdvisorContactId = this.termAdvisorData.Advisor_ContactId;
        this.formSubmitSelections.AdvisorContactName = this.termAdvisorData.Advisor_ContactName;
        this.formSubmitSelections.AdvisorEmail = this.termAdvisorData.Advisor_Email;
        this.formSubmitSelections.CourseSelectionId = this.courseSelection;
        this.formSubmitSelections.StudentName = this.studentName;
        this.formSubmitSelections.StudentEmail = this.studentEmail;

        try {
            this.caseSubmittedErrorCheck = false;
            this.submitCaseSpinner = true;

            try {
                const wellBeingResult = await tommieAlertsTellSomeoneSubmission(this.template, "wellbeing", {
                    selectorName: 'c-tell-someone-well-being-incident-report-lwc',
                    visible: this.selectionsCheck.behaviorWellBeingCheck && !this.tellSomeoneWellBeingSubmitDisable,
                    documentTypeLabel: 'Advocate Well-Being Incident',
                    submitApexMethod: submitWellBeingReportForm,
                    // formSubmitSelectionsKey: 'TellSomeoneWellBeingReportNumber'
                });
                this.wellBeingSaveDocumentsFail = wellBeingResult.saveDocumentsFail;
                this.formSubmitSelections.TellSomeoneWellBeingReportNumber = wellBeingResult.reportNumber;
                this.formSubmitSelections.submitWellBeingFormFail = wellBeingResult.submitFormFail;
            } catch (e) {
                console.log("Well Being Submission Error: "+JSON.stringify(e));
                this.wellBeingSaveDocumentsFail = true;
                this.formSubmitSelections.submitWellBeingFormFail = true;
            }

            try {
                const titleIxResult = await tommieAlertsTellSomeoneSubmission(this.template, "titleix", {
                    selectorName: 'c-tell-someone-title-ix-incident-report-lwc',
                    visible: this.selectionsCheck.relationshipCheck && !this.tellSomeoneTitleIxSubmitDisable,
                    documentTypeLabel: 'Advocate Title IX Incident',
                    submitApexMethod: submitTitleIxReportForm,
                    // formSubmitSelectionsKey: 'TellSomeoneTitleIxReportNumber'
                });
                this.titleIxSaveDocumentsFail = titleIxResult.saveDocumentsFail;
                this.formSubmitSelections.TellSomeoneTitleIxReportNumber = titleIxResult.reportNumber;
                this.formSubmitSelections.submitTitleIxIncidentFormFail = titleIxResult.submitFormFail;
            } catch (e) {
                console.log("Title IX Submission Error: "+JSON.stringify(e));
                this.titleIxSaveDocumentsFail = true;
                this.formSubmitSelections.submitTitleIxIncidentFormFail = true;
            }

            try {
                this.caseSubmittedErrorCheck = await submitTommieAlertsCase({formSelections: this.formSubmitSelections});
            } catch (e) {
                console.log("Case Submission Error: "+JSON.stringify(e));
                this.caseSubmittedErrorCheck = true;
            }

            this.submitCaseSpinner = false;

            if (this.caseSubmittedErrorCheck || this.formSubmitSelections.submitWellBeingFormFail || this.formSubmitSelections.submitTitleIxIncidentFormFail) {
                this.caseSubmittedCheck = true;
                console.log("this.caseSubmittedErrorCheck: " + this.caseSubmittedErrorCheck);
                console.log("this.formSubmitSelections.submitWellBeingFormFail: " + this.formSubmitSelections.submitWellBeingFormFail);
                console.log("this.formSubmitSelections.submitTitleIxIncidentFormFail: " + this.formSubmitSelections.submitTitleIxIncidentFormFail);
            } else {
                // eslint-disable-next-line no-restricted-globals
                location.replace(this.submittedUrl());
            }
        } catch (e) {
            console.log("Submission Error: "+JSON.stringify(e));
            this.caseSubmittedErrorCheck = true;
            this.submitCaseSpinner = false;
        }
    }

    //TESTING
    //         get failedSubmitMessages() {
    //             return [
    //                 { label: 'Behavior or Well Being Report Failed', value: 'Behavior or Well Being Report Failed' },
    //                 { label: 'Title IX Public Report Failed', value: 'Title IX Public Report Failed' },
    //                 { label: 'Case Submission Error Failed', value: 'Case Submission Error Failed' }
    //             ];
    //         }
    //
    //         @track checkBoxSubmitValue = [];
    //
    //         failedSubmitCheckbox(event) {
    //             this.value = event.detail.value;
    //             this.formSubmitSelections.submitWellBeingFormFail = this.value.includes('Behavior or Well Being Report Failed');
    //             this.formSubmitSelections.submitTitleIxIncidentFormFail = this.value.includes('Title IX Public Report Failed');
    //             this.caseSubmittedErrorCheck = this.value.includes('Case Submission Error Failed');
    //         }
    //
    //         get failedSubmitDocuments() {
    //             return [
    //                 { label: 'Behavior or Well Being Report Documents Failed', value: 'Behavior or Well Being Report Documents Failed' },
    //                 { label: 'Title IX Public Report Documents Failed', value: 'Title IX Public Report Documents Failed' },
    //             ];
    //         }
    //
    //         @track checkBoxDocumentsValue = [];
    //
    //         failedDocumentsCheckbox(event) {
    //             this.value = event.detail.value;
    //             this.wellBeingSaveDocumentsFail = this.value.includes('Behavior or Well Being Report Documents Failed');
    //             this.titleIxSaveDocumentsFail = this.value.includes('Title IX Public Report Documents Failed');
    //         }
    //
    //         get reportNumber() {
    //             return [
    //                 { label: 'Behavior or Well Being Report', value: 'Behavior or Well Being Report' },
    //                 { label: 'TitleIX Report', value: 'TitleIX Report' },
    //             ];
    //         }
    //
    //         @track checkBoxReportNumberValue = [];
    //
    //         reportNumberCheckbox(event) {
    //             this.value = event.detail.value;
    //             this.formSubmitSelections.TellSomeoneWellBeingReportNumber = this.value.includes('Behavior or Well Being Report') ? "1234" : "";
    //             this.formSubmitSelections.TellSomeoneTitleIxReportNumber = this.value.includes('TitleIX Report') ? "1234" : "";
    //         }
    //END TESTING
}