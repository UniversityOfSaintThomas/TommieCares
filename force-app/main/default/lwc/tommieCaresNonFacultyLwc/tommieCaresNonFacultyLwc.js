/**
 * Created by nguy0092 on 2/7/2025.
 */

import {LightningElement, api, wire, track} from 'lwc';
// import {getPicklistValues} from "lightning/uiObjectInfoApi";
import getTommieCaresPicklists from "@salesforce/apex/TommieCaresNonFacultyLwcController.getTommieCaresPicklists";
import advisorInformation from "@salesforce/apex/TommieCaresNonFacultyLwcController.advisorInformation";
import searchStudent from "@salesforce/apex/TommieCaresNonFacultyLwcController.searchStudent";
// import TOMMIE_CARES_REASONS from '@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c';
// import TOMMIE_HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";
import saveCase from "@salesforce/apex/TommieCaresNonFacultyLwcController.saveCase";

export default class TommieCaresNonFacultyLwc extends LightningElement {

    get childProps() {
        return {
            tellSomeoneReportType: this.advisorContactInfo.St_Thomas_Connection__c,
            tellSomeoneReporterFirstName: this.advisorContactInfo.FirstName,
            tellSomeoneReporterLastName: this.advisorContactInfo.LastName,
            tellSomeoneReporterEmail: this.advisorContactInfo.hed__UniversityEmail__c,
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
        // TellSomeoneWellBeingDate: "",
        // TellSomeoneWellBeingDescription: "",
        TellSomeoneWellBeingReportNumber: "",
        TellSomeoneTitleIxReportNumber: "",
    };
    @track selectionsCheck = {
        high5Check: false,
        missedAdvisingAppointmentCheck: false,
        nonResponsiveOutreachCheck: false,
        // behaviorCheck: false,
        // mentalHealthCheck: false,
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
    caseSubmittedCheck = false;
    caseSubmittedErrorCheck = false;
    submitCaseSpinner = false;
    noStudentsFound = false;
    searchMode = null; // default
    // _incidentDate = "";

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
    alertGroupingsFilter = [
        {"Positive Alert": ["Tommie High 5"]},
        {"Advising Alert": ["Academic Standing Requirement Not Met (only for Academic Counselors)", "Missed Advising Appointment", "Non-Responsive to Outreach"]},
        {"Behavior Well Being Alert": ["Behavior or Well-Being Concern", "Relationship violence/stalking", "Sense of belonging"]},
        {"Life Circumstances Alert": ["Difficulty Meeting Basic Needs (food/housing, etc)", "Financial concerns",  "Other"]},
    ]

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
    get initialPageView() {
        return this.advisorContactIdCheck && !this.caseSubmittedCheck;
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

    // @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_CARES_REASONS })
    // pickListTommieCares({ error, data }) {
    //     if (data) {
    //         this.tommieCaresOptionsAll = JSON.parse(JSON.stringify(data.values));
    //         this.removeTommieCaresOptions(this.tommieCaresGeneralExclusions, this.tommieCaresOptionsAll);
    //     } else if (error) {
    //         console.log("tommieCaresPicklist Error: " + error);
    //     }
    // }
    //
    // @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_HIGH_5_REASONS })
    // pickListTommieHigh5({ error, data }) {
    //     if (data) {
    //         this.tommieHigh5Options = JSON.parse(JSON.stringify(data.values));
    //     } else if (error) {
    //         console.log("tommieHigh5PicklistWire Error: " + error);
    //     }
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
                // if (eventValue === "Mental health concerns") {
                //     this.selectionsCheck.mentalHealthCheck = eventChecked;
                // }
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
                this.buildAlertGroups();
            })
            .catch(error => {
                // handle error, e.g. show message
                console.error("Search error:", error);
                // Example: this.emailSearchMessage = "Search failed. Please try again.";
            });
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

    submitAnother() {
        if (window.location && window.location.search) {
            this.searchParamsUrl.searchParams.delete("submitted");
        }
        location.replace(this.searchParamsUrl.toString());
    }

    async submitCase() {
        this.formSubmitSelections.AdvisorContactId = this.advisorContactInfo.Id;
        this.formSubmitSelections.AdvisorContactName = this.advisorContactInfo.Name;
        this.formSubmitSelections.AdvisorEmail = this.advisorContactInfo.hed__UniversityEmail__c;
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
        // Find the child component using querySelector
        const tellSomeoneTitleIx = this.template.querySelector('c-tell-someone-title-ix-incident-report-lwc');

        if (tellSomeoneTitleIx) {
            // Read the exposed public getter
            const titleIxFormValues = tellSomeoneTitleIx.formToTommieAlerts;
            const titleIxDocuments = tellSomeoneTitleIx.documentsToTommieAlerts;
            console.log('titleIxFormValues pulled from child: ', JSON.stringify(titleIxFormValues));
            console.log('titleIxDocuments pulled from child: ', JSON.stringify(titleIxDocuments));
        }
    }

}