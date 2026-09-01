/**
 * Created by nguy0092 on 8/30/2026.
 */

import {LightningElement, api, wire, track} from 'lwc';
// import {getPicklistValues} from "lightning/uiObjectInfoApi";
import getTommieCaresPicklists from "@salesforce/apex/TommieAlertsAdvisingStudentLwcController.getTommieCaresPicklists";
import advisorInformation from "@salesforce/apex/TommieAlertsAdvisingStudentLwcController.advisorInformation";
import searchStudent from "@salesforce/apex/TommieAlertsAdvisingStudentLwcController.searchStudent";
// import TOMMIE_CARES_REASONS from '@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c';
// import TOMMIE_HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";
import submitTommieAlertsAdvisingStudent from "@salesforce/apex/TommieAlertsAdvisingStudentLwcController.submitTommieAlertsAdvisingStudent";
import submitWellBeingReportForm from "@salesforce/apex/TellSomeoneLwcController.submitWellBeingReportForm";
import submitTitleIxReportForm from "@salesforce/apex/TellSomeoneLwcController.submitTitleIxReportForm";
import {tommieAlertsTellSomeoneSubmission} from "c/tellSomeoneUtilJs";

export default class TommieAlertsAdvisingStudentSupportLwc extends LightningElement {

    get childProps() {
        return {
            tellSomeoneReportType: this.advisorContactInfo.St_Thomas_Connection__c,
            tellSomeoneReporterFirstName: this.advisorContactInfo.FirstName,
            tellSomeoneReporterLastName: this.advisorContactInfo.LastName,
            tellSomeoneReporterEmail: this.advisorContactInfo.hed__UniversityEmail__c,
            tellSomeoneConcernWhoValue: "Student",
            tellSomeoneParamsUrl: this.searchParamsUrl,
            tommieAlertsReporterPhone: "Tommie Alerts Submission",
            tommieAlertsStudentName: this.formSubmitSelections.StudentName,
            tommieAlertsStudentEmail: this.formSubmitSelections.StudentEmail,
            tommieAlertsHideCss: "tommie-alerts_hide",
        }
    }

    @api paramUrl = "";
    @api tellSomeoneLwc = ""; //used as a variable for child component in Tell Someone LWC

    @track tommieCaresOptionsAll = [];
    @track tommieCaresOptions = [];
    @track tommieHigh5Options = [];
    @track positiveAlertGroup = [];
    @track advisingGroup = [];
    @track behaviorWellBeingGroup = [];
    @track lifeCircumstanceGroup = [];
    @track formSubmitSelections = {
        AdvisorContactId: "",
        AdvisorContactName: "",
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
        submitWellBeingFormFail: false,
        TellSomeoneWellBeingReportNumber: "",
        submitTitleIxIncidentFormFail: false,
        TellSomeoneTitleIxReportNumber: "",
    };
    @track selectionsCheck = {
        high5Check: false,
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
        Other_Required: false,
        // TellSomeoneWellBeingRequired: false,
    }

    searchParamsUrl;
    advisorContactInfo;
    paramBId = "";
    bannerId = '';
    lastName = '';
    stThomasEmail = '';
    isValidStThomasEmail = false;
    advisorContactIdCheck = false;
    noAdvisorContactIdCheck = false;
    submitCaseSpinner = false;
    noStudentsFound = false;
    searchMode = null; // default

    tommieCaresGeneralExclusions = [
        "Academic performance concerns",
        "Attendance concerns",
        "Life Circumstances Impacting Success"
    ];
    tommieCaresGraduateExclusions = [
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
        {"Advising Alert": ["Academic Standing Requirement Not Met (only for Academic Counselors)", "Missed Advising Appointment", "Non-Responsive to Outreach"]},
        {"Behavior Well Being Alert": ["Behavior or Well-Being Concern", "Relationship violence/stalking", "Sense of belonging"]},
        {"Life Circumstances Alert": ["Difficulty Meeting Basic Needs (food/housing, etc)", "Financial concerns",  "Other"]},
    ]

    get initialPageView() {
        return this.advisorContactIdCheck && !this.caseSubmittedCheck;
    }
    get caseSubmittedSuccessCheck() {
        return this.caseSubmittedCheck
            && !this.caseSubmittedErrorCheck
            && !this.formSubmitSelections.submitWellBeingFormFail
            && !this.formSubmitSelections.submitTitleIxIncidentFormFail;
    }
    get isEmail() {
        return this.searchMode === 'email';
    }
    get isBanner() {
        return this.searchMode === 'banner';
    }
    get isBannerSearchDisabled() {
        // disable until both non-empty
        return !(this.bannerId && /^\d+$/.test(this.bannerId) && this.lastName);
    }
    get isEmailSearchDisabled() {
        return !(this.isValidStThomasEmail && this.stThomasEmail);
    }
    get advisorInfoViewClass() {
        return "advisor_info "+this.tellSomeoneLwc; //hiding Advisor information when displaying on Community of Concern LWC
    }
    get tellSomeoneLwcNoAdvisor() {
        return !!this.tellSomeoneLwc; //returns no faculty information was found when displaying on Community of Concern LWC
    }
    get studentSelectionCheck() {
        return this.formSubmitSelections.StudentContactId && !this.noStudentsFound;
    }
    get caresSelectionCheck() {
        return !!this.formSubmitSelections.TommieCares_Reasons;
    }
    get showAdditionalConcerns() {
        const excluded = new Set(['otherCheck', 'high5Check']);
        return Object.entries(this.selectionsCheck).some(([key, value]) => !excluded.has(key) && value);
    }
    get noStudentFoundMessage() {
        return this.noStudentsFound && (!!this.bannerId || !!this.lastName || !!this.stThomasEmail);
    }
    get tellSomeoneWellBeingVisible() {
        return !!(this.selectionsCheck.behaviorWellBeingCheck || this.selectionsCheck.senseOfBelongingCheck);
    }
    get submitDisable() {
        return Object.values(this.formRequired).includes(true)
            || (this.tellSomeoneWellBeingVisible && this.tellSomeoneWellBeingSubmitDisable)
            || (this.selectionsCheck.relationshipCheck && this.tellSomeoneTitleIxSubmitDisable);
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
                case "submitted":
                    if (value === "true") this.caseSubmittedCheck = true;
                    break;
            }
        }
    }

    @wire(getTommieCaresPicklists)
    picklistsWire({ error, data }) {
        if (data) {
            this.tommieCaresOptionsAll = JSON.parse(JSON.stringify(data.tommieCaresReasons || []));
            this.tommieHigh5Options = JSON.parse(JSON.stringify(data.tommieHigh5Reasons || []));
            // this.academicOptions = JSON.parse(JSON.stringify(data.academicPerformanceReasons || []));
            // this.attendanceOptions = JSON.parse(JSON.stringify(data.attendanceConcernsReasons || []));
        } else if (error) {
            console.log("picklistsWire Error: " + JSON.stringify(error));
        }
    }

    @wire (advisorInformation, {advisorBannerId: "$paramBId"})
    advisorInformationWire({error, data}) {
        if (data) {
            this.advisorContactInfo = JSON.parse(JSON.stringify(data));
            this.advisorContactIdCheck = !!this.advisorContactInfo.Id;
            this.noAdvisorContactIdCheck = !this.advisorContactIdCheck;

            if (this.advisorContactInfo.St_Thomas_Connection__c?.includes("Faculty")) {
                this.advisorContactInfo.St_Thomas_Connection__c = "Faculty";
            } else if (this.advisorContactInfo.St_Thomas_Connection__c?.includes("Staff")) {
                this.advisorContactInfo.St_Thomas_Connection__c = "Staff";
            } else if (this.advisorContactInfo.St_Thomas_Connection__c?.includes("Student")) {
                this.advisorContactInfo.St_Thomas_Connection__c = "Student";
            }
        }

        if (error) {
            this.noAdvisorContactIdCheck = true;
            console.log("advisorInformationWire error!");
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

    handleSearchModeChange(event) {
        this.resetForm();
        this.noStudentsFound = false;
        this.searchMode = event.target.value;

        if (this.searchMode === 'email') {
            this.bannerId = '';
            this.lastName = '';
        } else if (this.searchMode === 'banner') {
            this.stThomasEmail = '';
        }
    }

    handleBannerIdInput(event) {
        const eventField = event.target;
        eventField.setCustomValidity("");
        this.noStudentsFound = false;

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
        this.noStudentsFound = false;
        console.log("this.lastName: "+this.lastName);
    }

    handleEmailChange(event) {
        const eventField = event.target;
        eventField.setCustomValidity("");
        this.noStudentsFound = false;

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

                if (this.tellSomeoneLwc) {
                    this.removeTommieCaresOptions(this.tellSomeoneExclusions, this.tommieCaresOptions);
                }

                this.buildAlertGroups();
            })
            .catch(error => {
                // handle error, e.g. show message
                console.error("Search error:", error);
                // Example: this.emailSearchMessage = "Search failed. Please try again.";
            });
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
        }

        if (!(this.formSubmitSelections.TommieCares_Reasons || !this.showAdditionalConcerns)) {
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

        Object.keys(this.formSubmitSelections).forEach(k => {
            this.formSubmitSelections[k] = '';
        });
        Object.keys(this.selectionsCheck).forEach(k => {
            this.selectionsCheck[k] = false;
        });
        Object.keys(this.formRequired).forEach(k => {
            this.formRequired[k] = false;
        });

        this.positiveAlertGroup = [];
        this.advisingGroup = [];
        this.behaviorWellBeingGroup = [];
        this.lifeCircumstanceGroup = [];
        // this._incidentDate = "";
    }

    submittedUrl() {
        this.searchParamsUrl.searchParams.set("submitted", "true");
        return this.searchParamsUrl.toString();
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
        this.formSubmitSelections.AdvisorContactId = this.advisorContactInfo.Id;
        this.formSubmitSelections.AdvisorContactName = this.advisorContactInfo.Name;
        this.formSubmitSelections.AdvisorEmail = this.advisorContactInfo.hed__UniversityEmail__c;
        console.log("I am being submitted");

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
                this.caseSubmittedErrorCheck = await submitTommieAlertsAdvisingStudent({formSelections: this.formSubmitSelections});
            } catch (e) {
                console.log("Tommie Alerts Submission Error: "+JSON.stringify(e));
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
    get failedSubmitMessages() {
        return [
            { label: 'Behavior or Well Being Report Failed', value: 'Behavior or Well Being Report Failed' },
            { label: 'Title IX Public Report Failed', value: 'Title IX Public Report Failed' },
            { label: 'Case Submission Error Failed', value: 'Case Submission Error Failed' }
        ];
    }

    @track checkBoxSubmitValue = [];

    failedSubmitCheckbox(event) {
        this.value = event.detail.value;
        this.formSubmitSelections.submitWellBeingFormFail = this.value.includes('Behavior or Well Being Report Failed');
        this.formSubmitSelections.submitTitleIxIncidentFormFail = this.value.includes('Title IX Public Report Failed');
        this.caseSubmittedErrorCheck = this.value.includes('Case Submission Error Failed');
    }

    get failedSubmitDocuments() {
        return [
            { label: 'Behavior or Well Being Report Documents Failed', value: 'Behavior or Well Being Report Documents Failed' },
            { label: 'Title IX Public Report Documents Failed', value: 'Title IX Public Report Documents Failed' },
        ];
    }

    @track checkBoxDocumentsValue = [];

    failedDocumentsCheckbox(event) {
        this.value = event.detail.value;
        this.wellBeingSaveDocumentsFail = this.value.includes('Behavior or Well Being Report Documents Failed');
        this.titleIxSaveDocumentsFail = this.value.includes('Title IX Public Report Documents Failed');
    }

    get reportNumber() {
        return [
            { label: 'Behavior or Well Being Report', value: 'Behavior or Well Being Report' },
            { label: 'TitleIX Report', value: 'TitleIX Report' },
        ];
    }

    @track checkBoxReportNumberValue = [];

    reportNumberCheckbox(event) {
        this.value = event.detail.value;
        this.formSubmitSelections.TellSomeoneWellBeingReportNumber = this.value.includes('Behavior or Well Being Report') ? "1234" : "";
        this.formSubmitSelections.TellSomeoneTitleIxReportNumber = this.value.includes('TitleIX Report') ? "1234" : "";
    }

    testBoolean = true;
    //END TESTING
}