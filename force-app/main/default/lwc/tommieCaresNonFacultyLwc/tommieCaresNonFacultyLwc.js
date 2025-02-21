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


export default class TommieCaresNonFacultyLwc extends LightningElement {

    formAccessIdCheck = true;
    advisorBannerId = "101276434";
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

    selectedStudentContactId(event) {

        this.formSubmitSelections.StudentContactId = event.detail.id;

        // if (this.studentsListOptions.length === 1) {
        //     this.formSubmitSelections.StudentContactId = this.studentsListOptions[0].value;
        // } else {
        //     this.studentsListOptions.unshift({value: "", label: "Select Student"});
        //     this.formSubmitSelections.StudentContactId = "";
        // }
        console.log("What is Student Contact Id: "+event.detail.id);
    }

    clickMeValue(event) {
        console.log("formSubmitSelections: "+JSON.stringify(this.formSubmitSelections));
    }

    @wire (advisorInformation, {advisorBannerId: "$advisorBannerId"})
    advisorInformationWire({error, data}) {
        if (data) {
            this.advisorContactInfo = JSON.parse(JSON.stringify(data));

            this.formSubmitSelections.AdvisorContactId = this.advisorContactInfo.Id;
            this.formSubmitSelections.AdvisorEmail = this.advisorContactInfo.Email;
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
                // if (event.target.value === "Attendance concerns") {
                //     if (!event.target.checked) {
                //         this.formSubmitSelections.Attendance_Reasons = "";
                //     }
                //     this.selectionsCheck.attendanceCheck = event.target.checked;
                //     this.formRequired.Attendance_Required = event.target.checked;
                //     this.attendanceAcademic();
                // }
                // if (event.target.value === "Academic performance concerns") {
                //     if (!event.target.checked) {
                //         this.formSubmitSelections.Academic_Reasons = "";
                //     }
                //     this.selectionsCheck.academicCheck = event.target.checked;
                //     this.formRequired.Academic_Required = event.target.checked;
                //     this.attendanceAcademic();
                // }
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