/**
 * Created by nguy0092 on 7/18/2025.
 */

import {api, LightningElement, track} from 'lwc';

export default class CommunityOfConcernLwc extends LightningElement {

    @api paramBId = "";
    @api paramSBid = "";
    @api paramCrn = "";
    @api paramUrl = "";
    // testUrl = "https://uofstthomasmn--edastaging.sandbox.my.salesforce-sites.com/TommieCaresLwc?bid=101218824&sbid=&crn=";

    get tommieAlertsShow() {
        if (this.concernedValue !== "") {
            return this.concernedValue === "true";
        } else {
            return false;
        }
    }

    concernedValue = "";

    get concernedOptions () {
        return [
            // {label: "", value: ""},
            {label: "I would like to report a concern about a student in one of my classes", value: "true"},
            {label: "I want to report an incident of possible discrimination, bias, or harassment", value: "false"},
            {label: "I would like to report a concern related to possible sexual misconduct (including Title IX)", value: "true"},
            {label: "I would like to submit an information report that does not fit the criteria of any of the above reports", value: "false"},
        ]
    }

    singleSelect(event) {
        this.concernedValue = event.detail.value;

    }
}