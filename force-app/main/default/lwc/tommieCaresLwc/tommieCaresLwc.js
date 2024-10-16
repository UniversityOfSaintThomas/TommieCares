/**
 * Created by nguy0092 on 10/8/2024.
 */

import {LightningElement, api, wire} from 'lwc';
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

    tommieCaresPicklist= [];
    tommieCaresSelection= [];

    tommieHigh5Picklist=[];
    tommieHigh5Selection=[];

    academicPerformancePicklist=[];
    academicPerformanceSelection = [];

    attendanceConcernsPicklist=[];
    attendanceConcernsSelection=[];

    advisorBannerId;
    studentBannerId;
    courseCrn;

    currentTerm;
    advisorContactName= '';
    advisorLNameFName ='';
    coursesList = [];
    courseSelection;
    studentsList = [];
    studentSelection = '';

    testMap = {
        TommieCares_Reasons: "",
        High5_Reasons: "",
        Academic_Reasons: "",
        Attendance_Reasons: "",
    };

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_CARES_REASONS })
    pickListTommieCares({ error, data }) {
        if (data) {
            this.tommieCaresPicklist = JSON.parse(JSON.stringify(data.values));

            // console.log("tommieCaresPicklist: "+JSON.stringify(data.values));
        } else if (error) {
            console.log("tommieCaresPicklist Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: TOMMIE_HIGH_5_REASONS })
    pickListTommieHigh5({ error, data }) {
        if (data) {
            this.tommieHigh5Picklist = JSON.parse(JSON.stringify(data.values));

            // console.log("tommieHigh5Picklist: "+JSON.stringify(data.values));
        } else if (error) {
            console.log("tommieHigh5Picklist Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: ACADEMIC_PERFORMANCE_REASONS })
    pickListAcademicPerformance({ error, data }) {
        if (data) {
            this.academicPerformancePicklist = JSON.parse(JSON.stringify(data.values));

            // console.log("academicPerformancePicklist: "+JSON.stringify(data.values));
        } else if (error) {
            console.log("academicPerformancePicklist Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: ATTENDANCE_CONCERNS_REASONS })
    pickListAttendanceConcerns({ error, data }) {
        if (data) {
            this.attendanceConcernsPicklist = JSON.parse(JSON.stringify(data.values));

            // console.log("attendanceConcernsPicklist: "+JSON.stringify(data.values));
        } else if (error) {
            console.log("attendanceConcernsPicklist Error: " + error);
        }
    }

    @wire(currentTermAdvisor, {urlBid: "$paramBId"})
    termAdvisorWire({error, data}) {

        if (data) {
            const termAdvisor = JSON.parse(JSON.stringify(data));
            this.currentTerm = termAdvisor.Current_Term;
            this.advisorBannerId = termAdvisor.Advisor_BannerId;
            this.advisorContactName = termAdvisor.Advisor_ContactName;
            this.advisorLNameFName = termAdvisor.Advisor_LNameFName;

            this.studentBannerId = this.paramSBid;
            this.courseCrn = this.paramCrn;
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
                this.courseSelection = this.coursesList[0].value;
            } else {
                this.coursesList.unshift({value: "", label: "Select Course"});
                this.courseSelection = '';
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
                this.studentSelection = this.studentsList[0].value;
            } else {
                this.studentsList.unshift({value: "", label: "Select Student"});
            }
        }

        if(error) {
            console.log("studentCourseListWire error!");
        }
    }

    courseSelect(event) {
        this.courseSelection = event.detail.value;
        this.studentSelection = '';
        refreshApex(this.studentsList);
    }

    studentSelect(event) {
        this.studentSelection = event.detail.value;
    }

    reasonsCheckbox(event) {

        if(event.currentTarget.dataset.picklisttype === "cares") {
            this.testMap.TommieCares_Reasons = this.checkBoxSelect(event, this.tommieCaresSelection);
            // this.testMap.TommieCares_Reasons = this.tommieCaresSubmit;

            console.log("TommieCares String: "+this.tommieCaresSubmit);
        }

        if(event.currentTarget.dataset.picklisttype === "high5") {
            this.testMap.High5_Reasons = this.checkBoxSelect(event, this.tommieHigh5Selection);
            // this.testMap.High5_Reasons = this.tommieHigh5Submit;

            console.log("High5 String: "+this.tommieHigh5Submit);
        }

        if(event.currentTarget.dataset.picklisttype === "academic") {
            this.testMap.Academic_Reasons = this.checkBoxSelect(event, this.academicPerformanceSelection);
            // this.testMap.Academic_Reasons = this.academicPerformanceSubmit;

            console.log("Academic String: "+this.academicPerformanceSubmit);
        }

        if(event.currentTarget.dataset.picklisttype === "attendance") {
            this.testMap.Attendance_Reasons = this.checkBoxSelect(event, this.attendanceConcernsSelection);
            // this.testMap.Attendance_Reasons = this.attendanceConcernsSubmit;

            console.log("Attendance String: "+this.attendanceConcernsSubmit);
        }

        console.log("testMap: "+JSON.stringify(this.testMap));
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

}