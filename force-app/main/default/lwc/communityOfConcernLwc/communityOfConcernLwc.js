/**
 * Created by nguy0092 on 7/18/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import {gql, graphql} from "lightning/uiGraphQLApi";
import {getPicklistValues} from "lightning/uiObjectInfoApi";
import COMMUNITY_CONCERN_REPORTER_TYPE from "@salesforce/schema/Case.Community_Concern_Reporter_Type__c";
import COMMUNITY_CONCERN_WHO_TYPE from "@salesforce/schema/Case.Community_Concern_Who_Type__c";
import COMMUNITY_CONCERN from "@salesforce/schema/Case.Community_Concern__c";

export default class CommunityOfConcernLwc extends LightningElement {

    @api paramsfId = "";
    @api paramBId = "";
    // @api paramSBid = "";
    // @api paramCrn = "";
    @api paramUrl = "";
    // testUrl = "https://uofstthomasmn--edastaging.sandbox.my.salesforce-sites.com/CommunityOfConcern?bid=101218824&sfid=003f200002qXsc4AAC&sbid=&crn=";
    searchParamsUrl;
    paramsString;
    iAmValue = "";
    concernedWhatValue = "";
    concernedWhoValue = "";
    @track iAmOptions = [];
    @track concernedWhoOptions = [];
    @track concernedWhoPicklist = [];
    @track studentInClass = {};

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: COMMUNITY_CONCERN_REPORTER_TYPE })
    pickListReporterType({ error, data }) {
        if (data) {
            this.iAmOptions = JSON.parse(JSON.stringify(data.values));
            this.iAmOptions.push( {label: "Anonymous", value: "Anon"} );
        } else if (error) {
            console.log("pickListReporterType Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: COMMUNITY_CONCERN_WHO_TYPE })
    pickListWhoTypes({ error, data }) {
        if (data) {
            this.concernedWhoOptions = JSON.parse(JSON.stringify(data.values));
        } else if (error) {
            console.log("pickListWhoTypes Error: " + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: COMMUNITY_CONCERN })
    pickListConcern({ error, data }) {
        if (data) {
            this.concernedWhoPicklist = JSON.parse(JSON.stringify(data.values));
            const index = this.concernedWhoPicklist.findIndex((obj) => obj.label === "I would like to report a concern about a student in one of my classes");
            if (index !== -1) {
                this.studentInClass = this.concernedWhoPicklist[index];
            }
        } else if (error) {
            console.log("pickListConcern Error: " + error);
        }
    }

    get concernedWhatOptions() {
        if (!!this.concernedWhoPicklist && !!this.studentInClass) {
            const index = this.concernedWhoPicklist.findIndex((obj) => obj.label === this.studentInClass.label);
            if (this.iAmValue === "Faculty" && this.reporterInfo.StThomasConnection?.includes("Faculty") && this.concernedWhoValue === "Student") {
                if (index === -1) {
                    this.concernedWhoPicklist = [this.studentInClass, ...this.concernedWhoPicklist];
                }
            } else {
                if (index !== -1) {
                    let picklistModified = this.concernedWhoPicklist.toSpliced(index, 1);
                    this.concernedWhoPicklist = [...picklistModified];
                }
            }
        }
        return this.concernedWhoPicklist;
    }

    get iAmAnonymousCheck() {
        return this.iAmValue === "Anon";
    }
    get showReporterInfo() {
        const matchValue = /\b(faculty)\b|\b(staff)\b|\b(student)\b|\b(other)\b/ig;
        return !!this.iAmValue.match(matchValue);
    }
    get showConcernedWhoSelect() {
        return !!(!!this.iAmValue && ((!!this.reporterInfo.FirstName && !!this.reporterInfo.LastName && !!this.reporterInfo.Email) || this.iAmValue === "Anon"));
    }
    get showConcernedWhoInfo() {
        return this.showConcernedWhoSelect && !!this.concernedWhoValue;
    }
    get showConcernedWhatSelect() {
        return this.showConcernedWhoInfo && !!this.concernedWhoInfo.FirstName && !!this.concernedWhoInfo.LastName && !!this.concernedWhoInfo.Email;
    }
    get showWhatTommieAlerts() {
        return this.showConcernedWhatSelect && this.concernedWhatValue === "I would like to report a concern about a student in one of my classes" && this.iAmValue === "Faculty" && this.concernedWhoValue === "Student";
    }
    get showWhatWellBeing() {
        let requiredSelected = this.showConcernedWhatSelect && this.concernedWhatValue === "I would like to report a behavior or well-being concern";
        return {
            student: requiredSelected && this.concernedWhoValue === "Student",
            nonStudent: requiredSelected && this.concernedWhoValue !== "Student",
        }
    }
    get showWhatDiscrimination() {
        let requiredSelected = this.showConcernedWhatSelect && this.concernedWhatValue === "I want to report an incident of possible discrimination, bias, or harassment";
        return {
            text: requiredSelected,
            anon: requiredSelected && this.iAmValue === "Anon",
            facStaff: requiredSelected && (this.iAmValue === "Faculty" || this.iAmValue === "Staff"),
            student: requiredSelected && this.iAmValue === "Student",
            other: requiredSelected && this.iAmValue === "Other"
        }
    }
    get showWhatMisconduct() {
        let requiredSelected = this.showConcernedWhatSelect && this.concernedWhatValue === "I would like to report a concern related to possible sexual misconduct (including Title IX)";
        return {
            text: requiredSelected,
            anon: requiredSelected && this.iAmValue === "Anon",
            facStaff: requiredSelected && (this.iAmValue === "Faculty" || this.iAmValue === "Staff"),
            student: requiredSelected && this.iAmValue === "Student",
            other: requiredSelected && this.iAmValue === "Other"
        }
    }
    get showWhatOther() {
        return this.showConcernedWhatSelect && this.concernedWhatValue === "I would like to submit an information report that does not fit the criteria of any of the above reports";
    }
    get submitDisable() {
        return !!this.concernedWhatAdditionalInfo;
    }
    @track reporterInfo = {
        Id: "",
        FirstName: "",
        LastName: "",
        StThomasConnection: "",
        Email: "",
        Phone: "",
    };
    @track concernedWhoInfo = {
        FirstName: "",
        LastName: "",
        Email: "",
        Phone: "",
    }
    concernedWhatAdditionalInfo = "";
    caseRecordTypeId;

    connectedCallback() {
        this.searchParamsUrl = new URL(this.paramUrl);
        this.paramsString = new URLSearchParams(this.searchParamsUrl.searchParams);

        for (let keyValue of this.paramsString.entries()) {
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

    @wire(graphql, {
        query: gql`
          query ReporterContact ($salesforceId: ID, $bannerId: String) {
            uiapi {
              query 
              {
                Contact ( where: { 
                                  or: [
                                        {
                                          Id: { eq: $salesforceId } 
                                        },
                                        { and: [ 
                                                  { University_Banner_ID__c: { eq: $bannerId } } ,
                                                  { University_Banner_ID__c: { ne: "" } }
                                               ]
                                        }
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
                      University_Banner_ID__c {value}
                    }
                  }
                }
              }
            }
          }
        `,
        variables: "$variables",
    })
    graphqlContactResult({data, errors}) {
        console.log("paramsUrl before 2: "+this.paramUrl);
        if (data) {
            const results = data.uiapi.query.Contact.edges.map((edge) => edge.node);
            if (results.length > 0) {
                this.reporterInfo = {
                    Id: results[0].Id,
                    FirstName: results[0].FirstName.value,
                    LastName: results[0].LastName.value,
                    StThomasConnection: results[0].St_Thomas_Connection__c.value,
                    Email: results[0].hed__UniversityEmail__c.value,
                    BannerId: results[0].University_Banner_ID__c.value,
                };

                this.searchParamsUrl.searchParams.set("bid", this.reporterInfo.BannerId);
                this.searchParamsUrl.searchParams.set("sfid", this.reporterInfo.Id);
                this.paramUrl = this.searchParamsUrl.toString();
            }

            console.log("reporterContactInfo 3: "+JSON.stringify(this.reporterInfo));
            console.log("paramsUrl after 3: "+this.paramUrl);
        }
        this.errors = errors;
    }

    get variables() {
        return {
            salesforceId: this.paramsfId,
            bannerId: this.paramBId,
        }
    }

    @wire(graphql, {
        query: gql`
          query CaseRecordTypeId {
            uiapi {
              query 
              {
                RecordType ( where: { 
                                      SobjectType: { eq: "Case" }
                                      DeveloperName: { eq: "Community_Concern" }
                                    },
                          upperBound: 1
                        ) 
                {
                  edges {
                    node {
                      Id                   
                      Name {value}
                    }
                  }
                }
              }
            }
          }
        `,
    })
    graphqlRecordTypeResult({data, errors}) {
        if (data) {
            const results = data.uiapi.query.RecordType.edges.map((edge) => edge.node);
            if (results.length > 0) {
                this.caseRecordTypeId = {
                    Id: results[0].Id,
                    Name: results[0].Name.value,
                };
            }
            console.log("Case RecordType Id: "+JSON.stringify(this.caseRecordTypeId));
        }
        this.errors = errors;
    }

    singleSelectHandler(event) {
        this.concernedWhatValue = "";
        this.concernedWhatAdditionalInfo = "";
        switch (event.currentTarget.dataset.selecttype) {
            case "iamselect":
                this.iAmValue = event.detail.value;
                break;
            case "concernedwhoselect":
                this.concernedWhoValue = event.detail.value;
                break;
            case "concernedwhatselect":
                this.concernedWhatValue = event.detail.value;
                break;
        }
    }

    inputTextHandler(event) {
        // console.log("Am I being called and validity 5: "+event.target.checkValidity());
        switch (event.currentTarget.dataset.inputgroup) {
            case "reporterinfo":
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.reporterInfo.FirstName = event.detail.value.trim();
                        break;
                    case "lastname":
                        this.reporterInfo.LastName = event.detail.value.trim();
                        break;
                    case "email":
                        this.reporterInfo.Email = event.target.checkValidity() ? event.detail.value.trim() : "";
                        break;
                    case "phone":
                        this.reporterInfo.Phone = event.detail.value.trim();
                        break;
                }
                break;
            case "concernedwhoinfo":
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.concernedWhoInfo.FirstName = event.detail.value.trim();
                        break;
                    case "lastname":
                        this.concernedWhoInfo.LastName = event.detail.value.trim();
                        break;
                    case "email":
                        this.concernedWhoInfo.Email = event.target.checkValidity() ? event.detail.value.trim() : "";
                        break;
                    case "phone":
                        this.concernedWhoInfo.Phone = event.detail.value.trim();
                        break;
                }
                break;
            case "concernedwhatinfo":
                this.concernedWhatAdditionalInfo = event.detail.value.trim();
                break;
        }
    }

}