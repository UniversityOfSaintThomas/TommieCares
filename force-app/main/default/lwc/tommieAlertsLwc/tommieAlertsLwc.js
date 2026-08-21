/**
 * Created by nguy0092 on 10/8/2024.
 */

import {LightningElement, api, wire, track} from 'lwc';
import {refreshApex} from "@salesforce/apex";
import getTommieCaresPicklists from "@salesforce/apex/TommieAlertsLwcController.getTommieCaresPicklists";
import currentTermAdvisor from "@salesforce/apex/TommieAlertsLwcController.currentTermAdvisor";
import advisorCoursesList from "@salesforce/apex/TommieAlertsLwcController.advisorCoursesList";
import studentCourseList from "@salesforce/apex/TommieAlertsLwcController.studentCourseList";
import submitTellSomeoneTitleIx from "@salesforce/apex/TellSomeoneLwcController.submitTitleIxReporting";
import saveCase from "@salesforce/apex/TommieAlertsLwcController.saveCase";

export default class TommieAlertsLwc extends LightningElement {
    //To TellSomeone child component
    get childProps() {
        return {
            tellSomeoneReportType: "Faculty",
            tellSomeoneReporterFirstName: this.termAdvisorData.Advisor_FirstName,
            tellSomeoneReporterLastName: this.termAdvisorData.Advisor_LastName,
            tellSomeoneReporterEmail: this.termAdvisorData.Advisor_Email,
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
    @track behaviorMentalHealthGroup = [];
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
        // TellSomeoneWellBeingDate: "",
        // TellSomeoneWellBeingDescription: "",
        TellSomeoneWellBeingReportNumber: "",
        TellSomeoneTitleIxReportNumber: "",
    };
    @track selectionsCheck = {
        high5Check: false,
        attendanceCheck: false,
        academicCheck: false,
        attendanceAcademicCheck: false,
        missedAdvisingAppointmentCheck: false,
        nonResponsiveOutreachCheck: false,
        behaviorMentalHealthCheck: false,
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
        // TellSomeoneWellBeingRequired: false,
    }

    coursesListOptions = [];
    studentsList = [];
    tommieCaresGraduateExclusions = [
        "Behavior and Mental Health concerns",
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
        {"Behavior Mental Health Alert": ["Behavior or Mental Health concerns", "Relationship violence/stalking", "Sense of belonging",]},
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
    caseSubmittedCheck = false;
    caseSubmittedErrorCheck = false;
    submitCaseSpinner = false;
    _incidentDate = "";

    get initialPageView() {
        return this.advisorContactIdCheck && !this.caseSubmittedCheck;
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
        const excluded = new Set(['high5Check', 'behaviorMentalHealthCheck', 'senseOfBelongingCheck', 'otherCheck']);
        return Object.entries(this.selectionsCheck).some(([key, value]) => !excluded.has(key) && value);
    }
    get tellSomeoneWellBeingVisible() {
        return !!(this.selectionsCheck.behaviorMentalHealthCheck || this.selectionsCheck.senseOfBelongingCheck);
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

    studentTypeCheck(contactId) {
        this.tommieCaresOptions.splice(0, this.tommieCaresOptions.length, ...this.tommieCaresOptionsAll);

        function removeTommieCaresOptions(exclusionList, optionsList) {
            for (const exclusion of exclusionList) {
                const index = optionsList.findIndex(option => option.label === exclusion);

                if (index !== -1) {
                    optionsList.splice(index, 1);
                }
            }
        }

        let foundStudent = this.studentsList.find(s => s.hed__Contact__c === contactId);
        console.log("Selected Student: ", foundStudent);

        if (foundStudent) {
            this.studentName = foundStudent.hed__Contact__r.Mailing_First_Name__c + " " + foundStudent.hed__Contact__r.LastName;
            this.studentEmail = foundStudent.hed__Contact__r.hed__UniversityEmail__c;
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
                if (eventValue === "Behavior or Mental Health concerns") {
                    this.selectionsCheck.behaviorMentalHealthCheck = eventChecked;
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
            // case "wellBeingDescription":
            //     this.formSubmitSelections.TellSomeoneWellBeingDescription = eventValueTrim;
            //     // this.tellSomeoneWellBeingRequired();
            //     break;
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

    // tellSomeoneWellBeingRequired() {
    //     if (!this.tellSomeoneWellBeingVisible) {
    //         this.formSubmitSelections.TellSomeoneWellBeingDate = "";
    //         this._incidentDate = "";
    //     }
    //     this.formRequired.TellSomeoneWellBeingRequired = this.tellSomeoneWellBeingVisible && (!this.formSubmitSelections.TellSomeoneWellBeingDate || !this.formSubmitSelections.TellSomeoneWellBeingDescription);
    // }

    // get today() {
    //     return new Date().toISOString().split('T')[0];
    // }
    //
    // dateValidation(event) {
    //     const dateField = event.target;
    //     this._incidentDate = dateField.value;
    //     console.log("checkValidity: ", dateField.checkValidity());
    //     console.log("today: ", this.today);
    //     console.log("this._incidentDate: ", this._incidentDate);
    //     if (dateField.checkValidity() && !!this._incidentDate) {
    //         this.formSubmitSelections.TellSomeoneWellBeingDate = this._incidentDate;
    //     } else {
    //         this.formSubmitSelections.TellSomeoneWellBeingDate = "";
    //     }
    //     // this.tellSomeoneWellBeingRequired();
    //     console.log("TellSomeoneWellBeingDate: ", this.formSubmitSelections.TellSomeoneWellBeingDate);
    // }

    resetForm() {
        // this._incidentDate = "";
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

    submitAnother() {
        if (window.location && window.location.search) {
            this.searchParamsUrl.searchParams.delete("submitted");
        }
        location.replace(this.searchParamsUrl.toString());
    }

    titleIxSubmitError = false;
    async submitCase() {
        this.formSubmitSelections.currentTermId = this.termAdvisorData.Current_Term;
        this.formSubmitSelections.AdvisorContactId = this.termAdvisorData.Advisor_ContactId;
        this.formSubmitSelections.AdvisorContactName = this.termAdvisorData.Advisor_ContactName;
        this.formSubmitSelections.AdvisorEmail = this.termAdvisorData.Advisor_Email;
        this.formSubmitSelections.CourseSelectionId = this.courseSelection;
        this.formSubmitSelections.StudentName = this.studentName;
        this.formSubmitSelections.StudentEmail = this.studentEmail;
        let titleIxFormValues = "";
        let titleIxDocuments = [];

        if (this.selectionsCheck.relationshipCheck && !this.tellSomeoneTitleIxSubmitDisable) {
            // Find the child component using querySelector
            const tellSomeoneTitleIx = this.template.querySelector('c-advocate-title-ix-incident-report-lwcv2');

            if (tellSomeoneTitleIx) {
                // Read the exposed public getter
                titleIxFormValues = JSON.stringify(tellSomeoneTitleIx.formToTommieAlerts);
                titleIxDocuments = tellSomeoneTitleIx.documentsToTommieAlerts;
                console.log('titleIxFormValues pulled from child: ', JSON.stringify(titleIxFormValues));
                console.log('titleIxDocuments pulled from child: ', titleIxDocuments);
            }
        }

        try {
            this.caseSubmittedErrorCheck = false;
            window.parent.scrollTo({top: 0, behavior: 'smooth' });
            this.submitCaseSpinner = true;

            if (titleIxFormValues.trim().length > 0) {
                const titleIxReportNumber = await submitTellSomeoneTitleIx({formValues: titleIxFormValues});
                console.log('titleIxReportNumber returned from Apex: ', titleIxReportNumber);
                this.formSubmitSelections.TellSomeoneTitleIxReportNumber = titleIxReportNumber;
                this.titleIxSubmitError = !this.formSubmitSelections.TellSomeoneTitleIxReportNumber ? "true" : "false";
            }

            await saveCase({formSelections: this.formSubmitSelections});
            this.submitCaseSpinner = false;
            // eslint-disable-next-line no-restricted-globals
            location.replace(this.submittedUrl());
        } catch (e) {
            console.log("Submission Error: "+JSON.stringify(e));
            this.caseSubmittedErrorCheck = true;
            this.submitCaseSpinner = false;
        }
    }

    tellSomeoneWellBeingSubmitDisable = true;
    tellSomeoneWellBeingCheck(event) {
        this.tellSomeoneWellBeingSubmitDisable = event.detail.value;
        console.log("tellSomeoneWellBeingCheck event: ", this.tellSomeoneWellBeingSubmitDisable);
    }

    tellSomeoneWellBeingForm() {
        if (this.tellSomeoneWellBeingVisible && !this.tellSomeoneWellBeingSubmitDisable) {
            // Find the child component using querySelector
            const tellSomeoneWellBeing = this.template.querySelector('c-tell-someone-well-being-incident-report-lwc');

            if (tellSomeoneWellBeing) {
                // Read the exposed public getter
                const wellBeingFormValues = JSON.stringify(tellSomeoneWellBeing.formToTommieAlerts);
                const wellBeingDocuments = tellSomeoneWellBeing.documentsToTommieAlerts;
                console.log('wellBeingFormValues pulled from child: ', wellBeingFormValues);
                console.log('wellBeingDocuments pulled from child: ', JSON.stringify(wellBeingDocuments));
            }
        }
    }

    tellSomeoneTitleIxSubmitDisable = true;
    tellSomeoneTitleIxSubmitCheck(event) {
        this.tellSomeoneTitleIxSubmitDisable = event.detail.value;
        console.log("tellSomeoneTitleIxSubmitCheck event: ", this.tellSomeoneTitleIxSubmitDisable);
    }

    tellSomeoneTitleIxForm() {
        if (this.selectionsCheck.relationshipCheck && !this.tellSomeoneTitleIxSubmitDisable) {
            // Find the child component using querySelector
            const tellSomeoneTitleIx = this.template.querySelector('c-tell-someone-title-ix-incident-report-lwc');

            if (tellSomeoneTitleIx) {
                // Read the exposed public getter
                const titleIxFormValues = JSON.stringify(tellSomeoneTitleIx.formToTommieAlerts);
                const titleIxDocuments = tellSomeoneTitleIx.documentsToTommieAlerts;
                console.log('titleIxFormValues pulled from child: ', titleIxFormValues);
                console.log('titleIxDocuments pulled from child: ', JSON.stringify(titleIxDocuments));
            }
        }
    }

}