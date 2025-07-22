/**
 * Created by nguy0092 on 7/18/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import {gql, graphql} from "lightning/uiGraphQLApi";

export default class CommunityOfConcernLwc extends LightningElement {

    @api paramsfId = "";
    @api paramBId = "";
    // @api paramSBid = "";
    // @api paramCrn = "";
    @api paramUrl = "";
    // testUrl = "https://uofstthomasmn--edastaging.sandbox.my.salesforce-sites.com/CommunityOfConcern?bid=101218824&sbid=&crn=";

    iAmValue = "";
    concernedWhatValue = "";
    concernedWhoValue;

    connectedCallback() {
        let searchParamsUrl = new URL(this.paramUrl);
        let paramsString = new URLSearchParams(searchParamsUrl.searchParams);

        for (let keyValue of paramsString.entries()) {
            switch (keyValue[0]) {
                case "sfid":
                    if (!this.paramsfId) {
                        this.paramsfId = keyValue[1];
                    }
                    break;
                case "bid":
                    if (!this.paramBId) {
                        this.paramBId = keyValue[1];
                    }
                    break;
                // case "crn":
                //     if (!this.paramCrn) {
                //         this.paramCrn = keyValue[1];
                //     }
                //     break;
                case "submitted":
                    if (keyValue[1] === "true") {
                        this.caseSubmittedCheck = true;
                    }
            }
        }
    }

    get iAmOptions() {
        return [
            // {label: "", value: ""},
            {label: "Faculty", value: "faculty"},
            {label: "Staff", value: "staff"},
            {label: "Other", value: "other"},
            {label: "Anonymous", value: "anon"},
        ]
    }
    get concernedWhoOptions() {
        return [
            // {label: "", value: ""},
            {label: "Student", value: "student"},
            {label: "Faculty", value: "faculty"},
            {label: "Staff", value: "staff"},
            {label: "Other", value: "other"},
        ]
    }
    get concernedWhatOptions() {
        return [
            // {label: "", value: ""},
            {label: "I would like to report a concern about a student in one of my classes", value: "true"},
            {label: "I want to report an incident of possible discrimination, bias, or harassment", value: "false"},
            {label: "I would like to report a concern related to possible sexual misconduct (including Title IX)", value: "false"},
            {label: "I would like to submit an information report that does not fit the criteria of any of the above reports", value: "false"},
        ]
    }

    get iAmAnonymousCheck() {
        return this.iAmValue === "anon";
    }
    get showReporterInfo() {
        const matchValue = /\b(faculty)\b|\b(staff)\b|\b(other)\b/ig;
        return !!this.iAmValue.match(matchValue);
    }
    get showConcernedWhoSelect() {
        return !!((this.reporterInfo.FirstName && !!this.reporterInfo.LastName && !!this.reporterInfo.Email) || this.iAmValue === "anon");
    }
    get showConcernedWhoInfo() {
        return !!this.concernedWhoValue;
    }
    get showConcernedWhatSelect() {
        return !!this.concernedWhoInfo.FirstName && !!this.concernedWhoInfo.LastName && !!this.concernedWhoInfo.Email;
    }
    get showTommieAlerts() {
        if (this.concernedWhatValue !== "") {
            return this.concernedWhatValue === "true";
        } else {
            return false;
        }
    }

    @track concernedWhoInfo = {
        FirstName: "",
        LastName: "",
        Email: "",
        Phone: "",
    }

    singleSelect(event) {

        switch (event.currentTarget.dataset.selecttype) {
            case "iAmSelect":
                this.iAmValue = event.detail.value;
                break;
            case "concernedWhatSelect":
                this.concernedWhatValue = event.detail.value;
                break;
        }
    }

    inputInfo(event) {
        this.reporterInfo.Email = event.detail.value;
    }

    @track reporterInfo = {
            Id: "",
            FirstName: "",
            LastName: "",
            StThomasConnection: "",
            Email: "",
            Phone: "",
        };

    @wire(graphql, {
        query: gql`
          query ReporterContact ($salesforceId: ID, $bannerId: String) {
            uiapi {
              query 
              {
                Contact ( where: { 
                            or: [ 
                                { Id: { eq: $salesforceId } }
                                { University_Banner_ID__c: { eq: $bannerId } }
                                ]
                          },
                          upperBound: 1
                        ) 
                {
                  edges {
                    node {
                      Id                   
                      FirstName {value}
                      LastName {value}
                      St_Thomas_Connection__c {value}
                      hed__UniversityEmail__c {value}
                    }
                  }
                }
              }
            }
          }
        `,
        variables: "$variables",
    })
    graphqlQueryResult({data, errors}) {
        if (data) {
            const results = data.uiapi.query.Contact.edges.map((edge) => edge.node);
            this.reporterInfo = {
                    Id: results[0].Id.value,
                    FirstName: results[0].FirstName.value,
                    LastName: results[0].LastName.value,
                    StThomasConnection: results[0].St_Thomas_Connection__c.value,
                    UniversityEmail: results[0].hed__UniversityEmail__c.value,
                };

            console.log("reporterContactInfo: "+JSON.stringify(this.reporterInfo));
        }
        this.errors = errors;
    }

    get variables() {
        return {
            salesforceId: this.paramsfId,
            bannerId: this.paramBId,
        }
    }
}