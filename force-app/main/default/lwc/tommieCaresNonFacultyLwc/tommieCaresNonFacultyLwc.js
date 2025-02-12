/**
 * Created by nguy0092 on 2/7/2025.
 */

import {LightningElement, api, wire, track} from 'lwc';
import studentCourseList from "@salesforce/apex/tommieCaresNonFacultyLwcController.studentCourseList";

export default class TommieCaresNonFacultyLwc extends LightningElement {

    studentContactId;
    courseListInfo;

    filter = {
        criteria: [
            {
                fieldPath: 'St_Thomas_Connection__c',
                operator: 'includes',
                value: 'Student',
            },
            {
                fieldPath: 'St_Thomas_Connection__c',
                operator: 'includes',
                value: 'Staff',
            },
        ],
        filterLogic: '1 OR 2',
    };

    matchingInfo = {
        primaryField: { fieldPath: 'Name' },
        additionalFields: [{ fieldPath: 'University_Banner_ID__c' }],
    };

    displayInfo = {
        // primaryField: 'Name',
        additionalFields: ['University_Banner_ID__c'],
    };

    @wire (studentCourseList, {studentContactId: "$studentContactId"})
    coursesListWire({error, data}) {
        if (data) {
            this.courseListInfo = JSON.parse(JSON.stringify(data));
        }

        if (error) {
            console.log("coursesListWire error!");
        }
    }

    showId(event) {

        this.studentContactId = event.detail.recordId;
        console.log("What is ID: "+event.detail.recordId);
    }
}