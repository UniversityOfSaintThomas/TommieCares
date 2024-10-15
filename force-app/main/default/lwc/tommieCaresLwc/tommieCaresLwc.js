/**
 * Created by nguy0092 on 10/8/2024.
 */

import {LightningElement, wire} from 'lwc';
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";

import PRIMARY_REASONS from "@salesforce/schema/Case.Tommie_Alert_Primary_Reason__c";
import PERFORMANCE_REASONS from "@salesforce/schema/Case.Academic_Performance_Reason_s__c";
import ATTENDANCE_CONCERNS from "@salesforce/schema/Case.Attendance_Concerns_Reason_s__c";
import HIGH_5_REASONS from "@salesforce/schema/Case.Tommie_High_5__c";

export default class TommieAlertsLwc extends LightningElement {

    performanceReasonsPicklist;

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: PRIMARY_REASONS })
    pickListCompanyIndustry({ error, data }) {
        if (data) {
            this.performanceReasonsPicklist = JSON.parse(JSON.stringify(data.values));
            this.performanceReasonsPicklist.sort((a, b) => a.label.localeCompare(b.label));
            // this.companyIndustryPickList.unshift({ attributes: null, label: "<All Industries>", validFor: [], value: "" });
        } else if (error) {
            console.log("performanceReasonsPicklist Error: " + error);
        }
    }

}