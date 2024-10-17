/**
 * Created by nguy0092 on 10/8/2024.
 */

import {LightningElement, api, wire, track} from 'lwc';
import {refreshApex} from "@salesforce/apex";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import currentTermAdvisor from "@salesforce/apex/TommieCaresLwcController.currentTermAdvisor";
import advisorCoursesList from "@salesforce/apex/TommieCaresLwcController.advisorCoursesList";
import studentCourseList from "@salesforce/apex/TommieCaresLwcController.studentCourseList";
import TOMMIE_CARES_REASONS from '@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c';
import TOMMIE_HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";
import ATTENDANCE_CONCERNS_REASONS from "@salesforce/schema/Case.Attendance_Concerns_Reason_s__c";
import ACADEMIC_PERFORMANCE_REASONS from '@salesforce/schema/Case.Academic_Performance_Reason_s__c';

export default class TommieCaresLwc extends LightningElement {

    @api paramBId = '';
    @api paramSBid = '';
    @api paramCrn= '';
    advisorBannerId;
    courseCrn;
    studentBannerId;
    get courseSelection() {
        return this.formSelections.Course_Selection;
    };
    get studentSelection() {
        return this.formSelections.Student_Selection;
    }
    currentTerm;
    advisorContactName= '';
    advisorLNameFName ='';
    coursesList = [];
    studentsList = [];
    tommieCaresPicklist= [];
    tommieCaresSelection= [];
    tommieHigh5Picklist=[];
    tommieHigh5Selection=[];
    get high5DetailsSelection() {
        return this.formSelections.High5_Details;
    };
    academicPerformancePicklist=[];
    academicPerformanceSelection = [];
    attendanceConcernsPicklist=[];
    attendanceConcernsSelection=[];
    @track formSelections = {
        TommieCares_Reasons: "",
        High5_Reasons: "",
        Academic_Reasons: "",
        Attendance_Reasons: "",
        High5_Details: "",
        Pass_Course_Selection: "",
        Other_Details: "",
        Personal_Message: "",
    };

    passCourseOption = [
        {label: "", value: ""},
        {label: "Yes", value: "Yes"},
        {label: "No", value: "No"},
        {label: "Maybe", value: "Maybe"},
    ]

    high5Check = false;
    behaviorCheck = false;
    financialConcernsCheck = false;
    mentalHealthCheck = false;
    relationshipCheck = false;
    belongingCheck = false;

    @wire(currentTermAdvisor, {urlBid: "$paramBId"})
    termAdvisorWire({error, data}) {

        if (data) {
            this.advisorBannerId = this.paramBId;
            this.studentBannerId = this.paramSBid;
            this.courseCrn = this.paramCrn;

            const termAdvisor = JSON.parse(JSON.stringify(data));
            this.currentTerm = termAdvisor.Current_Term;
            this.advisorContactName = termAdvisor.Advisor_ContactName;
            this.advisorLNameFName = termAdvisor.Advisor_LNameFName;

            this.formSelections.Advisor_Id = this.advisorBannerId;
        }

        if(error) {
            console.log("termAdvisorWire error!");
        }
    }

    @wire(advisorCoursesList, {advisorBannerId: "$advisorBannerId", courseCrn: "$courseCrn"})
    coursesListWire({error, data}) {

        if(data) {
            this.coursesList = JSON.parse(JSON.stringify(data));

            if(this.coursesList.length === 1) {
                this.formSelections.Course_Selection = this.coursesList[0].value;
            } else {
                this.coursesList.unshift({value: "", label: "Select Course"});
                this.formSelections.Course_Selection = "";
            }
        }

        if(error) {
            console.log("coursesListWire error!");
        }
    }

    @wire(studentCourseList, {studentBannerId: "$studentBannerId", courseId: "$courseSelection"})
    studentCourseListWire({error, data}) {

        if(data) {
            this.studentsList = JSON.parse(JSON.stringify(data));

            if(this.studentsList.length === 1) {
                this.formSelections.Student_Selection = this.studentsList[0].value;
            } else {
                this.studentsList.unshift({value: "", label: "Select Student"});
                this.formSelections.Student_Selection = "";
            }
        }

        if(error) {
            console.log("studentCourseListWire error!");
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_CARES_REASONS })
    pickListTommieCares({ error, data }) {

        if (data) {
            this.tommieCaresPicklist = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("tommieCaresPicklist Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_HIGH_5_REASONS })
    pickListTommieHigh5({ error, data }) {

        if (data) {
            this.tommieHigh5Picklist = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("tommieHigh5Picklist Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: ACADEMIC_PERFORMANCE_REASONS })
    pickListAcademicPerformance({ error, data }) {

        if (data) {
            this.academicPerformancePicklist = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("academicPerformancePicklist Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: ATTENDANCE_CONCERNS_REASONS })
    pickListAttendanceConcerns({ error, data }) {

        if (data) {
            this.attendanceConcernsPicklist = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("attendanceConcernsPicklist Error: " + error);
        }
    }

    singleSelect(event) {
        switch (event.currentTarget.dataset.selecttype) {
            case "courseSelect":
                this.formSelections.Course_Selection = event.detail.value;
                this.formSelections.Student_Selection = '';
                refreshApex(this.studentsList);
                break;
            case "studentSelect":
                this.formSelections.Student_Selection = event.detail.value;
                break;
            case "passCourseSelect":
                this.formSelections.Pass_Course_Selection = event.detail.value;
                break;
        }
    }

    reasonsCheckbox(event) {
        switch (event.currentTarget.dataset.checkboxtype) {
            case "cares":
                this.formSelections.TommieCares_Reasons = this.checkBoxSelect(event, this.tommieCaresSelection);

                if(event.target.value === "Tommie High 5") {
                    if(!event.target.checked) {
                        const checkBoxes = this.querySelectorAll("[data-checkboxtype='high5']");
                        if(checkBoxes) {
                            checkBoxes.forEach(checkBox => {
                                checkBox.checked = false;
                            })
                        }
                        this.tommieHigh5Selection.length = 0;
                        this.formSelections.High5_Reasons = "";
                        this.formSelections.High5_Details = "";
                    }
                    this.high5Check = event.target.checked;
                }

                if(event.target.value === "Behavior concerns") {
                    this.behaviorCheck = event.target.checked;
                }

                if(event.target.value === "Financial concerns") {
                    this.financialConcernsCheck = event.target.checked;
                }

                if(event.target.value === "Mental health concerns") {
                    this.mentalHealthCheck = event.target.checked;
                }

                if(event.target.value === "Relationship violence/stalking") {
                    this.relationshipCheck = event.target.checked;
                }

                if(event.target.value === "Sense of belonging") {
                    this.belongingCheck = event.target.checked;
                }

                break;
            case "high5":
                this.formSelections.High5_Reasons = this.checkBoxSelect(event, this.tommieHigh5Selection);
                break;
            case "academic":
                this.formSelections.Academic_Reasons = this.checkBoxSelect(event, this.academicPerformanceSelection);
                break;
            case "attendance":
                this.formSelections.Attendance_Reasons = this.checkBoxSelect(event, this.attendanceConcernsSelection);
                break;
        }
    }

    checkBoxSelect (evt, selections) {

        if(evt.target.checked) {
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
        switch(event.currentTarget.dataset.texttype) {
            case "high5Details":
                this.formSelections.High5_Details = event.detail.value.trim();
                break;
            case "otherDetails":
                this.formSelections.Other_Details = event.detail.value.trim();
                break;
            case "personalMessage":
                this.formSelections.Personal_Message = event.detail.value.trim();
                break;
        }
    }

    showFormsSelection() {
        console.log("This is formSelections: "+JSON.stringify(this.formSelections));
    }

}