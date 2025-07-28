/**
 * Created by nguy0092 on 7/18/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import {gql, graphql} from "lightning/uiGraphQLApi";
import {getPicklistValues} from "lightning/uiObjectInfoApi";
import {createRecord, generateRecordInputForCreate} from "lightning/uiRecordApi";
import COMMUNITY_CONCERN_REPORTER_TYPE from "@salesforce/schema/Case.Community_Concern_Reporter_Type__c";
import COMMUNITY_CONCERN_WHO_TYPE from "@salesforce/schema/Case.Community_Concern_Who_Type__c";
import COMMUNITY_CONCERN_WHAT from "@salesforce/schema/Case.Community_Concern__c";
import saveCase from "@salesforce/apex/CommunityOfConcernLwcController.saveCase";
import CASE_OBJECT from "@salesforce/schema/Case";
import CASE_STATUS from "@salesforce/schema/Case.Status";
import RECORD_TYPE from "@salesforce/schema/Case.RecordTypeId";
import ORIGIN from "@salesforce/schema/Case.Origin";
import SUBJECT from "@salesforce/schema/Case.Subject";
import CASE_REPORTER from "@salesforce/schema/Case.Case_Reporter__c";
import SUPPLIED_NAME from "@salesforce/schema/Case.SuppliedName";
import SUPPLIED_EMAIL from "@salesforce/schema/Case.SuppliedEmail";
import SUPPLIED_PHONE from "@salesforce/schema/Case.SuppliedPhone";
import FIRST_NAME from "@salesforce/schema/Case.First_Name__c";
import LAST_NAME from "@salesforce/schema/Case.Last_Name__c";
import ST_THOMAS_EMAIL from "@salesforce/schema/Case.St_Thomas_Email__c";
import PHONE from "@salesforce/schema/Case.Phone__c";
import {updateRecord} from "lightning/uiRecordApi";
import {ShowToastEvent} from "lightning/platformShowToastEvent";

export default class CommunityOfConcernLwc extends LightningElement {

    @api paramsfId = "";
    @api paramBId = "";
    // @api paramSBid = "";
    // @api paramCrn = "";
    @api paramUrl = "";
    // testUrl = "https://uofstthomasmn--edastaging.sandbox.my.salesforce-sites.com/CommunityOfConcern?bid=101218824&sfid=003f200002qXsc4AAC&sbid=&crn=";
    searchParamsUrl;
    paramsString;
    caseSubmittedCheck = false;
    // iAmValue = "";
    // concernedWhoValue = "";
    // concernedWhatValue = "";
    @track iAmOptions = [];
    @track concernedWhoOptions = [];
    whatPicklist = [];
    whatNoStudentPicklist = [];

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

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: COMMUNITY_CONCERN_WHAT })
    pickListConcern({ error, data }) {
        if (data) {
            this.whatPicklist = JSON.parse(JSON.stringify(data.values));
            this.whatNoStudentPicklist = JSON.parse(JSON.stringify(data.values));
            const index = this.whatNoStudentPicklist.findIndex((obj) => obj.label === "I would like to report a concern about a student in one of my classes");
            if (index !== -1) {
                this.whatNoStudentPicklist.splice(index, 1);
            }
        } else if (error) {
            console.log("pickListConcern Error: " + error);
        }
    }

    get concernedWhatOptions() {
        if (this.communityOfConcernCase.IAmValue === "Faculty" && this.communityOfConcernCase.IAmStThomasConnection?.includes("Faculty") && this.communityOfConcernCase.ConcernedWhoValue === "Student") {
            return this.whatPicklist;
        } else {
            return this.whatNoStudentPicklist;
        }
    }

    get iAmAnonymousCheck() {
        return this.communityOfConcernCase.IAmValue === "Anon";
    }
    get showIAmInfo() {
        const matchValue = /\b(faculty)\b|\b(staff)\b|\b(student)\b|\b(other)\b/ig;
        if (!!this.communityOfConcernCase.IAmValue) {
            return !!this.communityOfConcernCase?.IAmValue.match(matchValue);
        } else {
            return false;
        }
    }
    get showConcernedWhoSelect() {
        return !!(!!this.communityOfConcernCase.IAmValue && ((!!this.communityOfConcernCase.IAmFirstName && !!this.communityOfConcernCase.IAmLastName && !!this.communityOfConcernCase.IAmEmail) || this.communityOfConcernCase.IAmValue === "Anon"));
    }
    get showConcernedWhoInfo() {
        return this.showConcernedWhoSelect && !!this.communityOfConcernCase.ConcernedWhoValue;
    }
    get showConcernedWhatSelect() {
        return this.showConcernedWhoInfo && !!this.communityOfConcernCase.ConcernedWhoFirstName && !!this.communityOfConcernCase.ConcernedWhoLastName && !!this.communityOfConcernCase.ConcernedWhoEmail;
    }
    get showWhatTommieAlerts() {
        return this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a concern about a student in one of my classes" && this.communityOfConcernCase.IAmValue === "Faculty" && this.communityOfConcernCase.ConcernedWhoValue === "Student";
    }
    get showWhatWellBeing() {
        let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a behavior or well-being concern";
        return {
            student: requiredSelected && this.communityOfConcernCase.ConcernedWhoValue === "Student",
            nonStudent: requiredSelected && this.communityOfConcernCase.ConcernedWhoValue !== "Student",
        }
    }
    get showWhatDiscrimination() {
        let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I want to report an incident of possible discrimination, bias, or harassment";
        return {
            text: requiredSelected,
            anon: requiredSelected && this.communityOfConcernCase.IAmValue === "Anon",
            facStaff: requiredSelected && (this.communityOfConcernCase.IAmValue === "Faculty" || this.communityOfConcernCase.IAmValue === "Staff"),
            student: requiredSelected && this.communityOfConcernCase.IAmValue === "Student",
            other: requiredSelected && this.communityOfConcernCase.IAmValue === "Other"
        }
    }
    get showWhatMisconduct() {
        let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to report a concern related to possible sexual misconduct (including Title IX)";
        return {
            text: requiredSelected,
            anon: requiredSelected && this.communityOfConcernCase.IAmValue === "Anon",
            facStaff: requiredSelected && (this.communityOfConcernCase.IAmValue === "Faculty" || this.communityOfConcernCase.IAmValue === "Staff"),
            student: requiredSelected && this.communityOfConcernCase.IAmValue === "Student",
            other: requiredSelected && this.communityOfConcernCase.IAmValue === "Other"
        }
    }
    get showWhatOther() {
        let requiredSelected = this.showConcernedWhatSelect && this.communityOfConcernCase.ConcernedWhatValue === "I would like to submit an information report that does not fit the criteria of any of the above reports";
        return {
            show: requiredSelected,
            text: this.communityOfConcernCase.ConcernedWhoValue !== "Student"
        }
    }
    get submitDisable() {
        return !!!this.communityOfConcernCase.ConcernedWhatAdditionalInfo;
    }
    // @track reporterInfo = {
    //     contactId: "",
    //     FirstName: "",
    //     LastName: "",
    //     StThomasConnection: "",
    //     Email: "",
    //     Phone: "",
    //     BannerId: "",
    // };
    // @track concernedWhoInfo = {
    //     FirstName: "",
    //     LastName: "",
    //     Email: "",
    //     Phone: "",
    // }
    // concernedWhatAdditionalInfo = "";
    // caseRecordTypeId;
    submitCaseSpinner = false;

    @track communityOfConcernCase = {
        IAmValue: "",
        IAmContactId: "",
        IAmFirstName: "",
        IAmLastName: "",
        IAmStThomasConnection: "",
        IAmEmail: "",
        IAmPhone: "",
        IAmBannerId: "",
        ConcernedWhoValue: "",
        ConcernedWhoFirstName: "",
        ConcernedWhoLastName: "",
        ConcernedWhoEmail: "",
        ConcernedWhoPhone: "",
        ConcernedWhatValue: "",
        ConcernedWhatAdditionalInfo: "",
    }

    connectedCallback() {
        console.log("Version 7");

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
        // console.log("paramsUrl before 2: "+this.paramUrl);
        if (data) {
            const results = data.uiapi.query.Contact.edges.map((edge) => edge.node);
            if (results.length > 0) {
                this.communityOfConcernCase = {
                    IAmContactId: results[0].Id,
                    IAmFirstName: results[0].FirstName.value,
                    IAmLastName: results[0].LastName.value,
                    IAmStThomasConnection: results[0].St_Thomas_Connection__c.value,
                    IAmEmail: results[0].hed__UniversityEmail__c.value,
                    IAmBannerId: results[0].University_Banner_ID__c.value,
                };
                // this.reporterInfo = {
                //     contactId: results[0].Id,
                //     FirstName: results[0].FirstName.value,
                //     LastName: results[0].LastName.value,
                //     StThomasConnection: results[0].St_Thomas_Connection__c.value,
                //     Email: results[0].hed__UniversityEmail__c.value,
                //     BannerId: results[0].University_Banner_ID__c.value,
                // };

                this.searchParamsUrl.searchParams.set("bid", this.communityOfConcernCase.IAmBannerId);
                this.searchParamsUrl.searchParams.set("sfid", this.communityOfConcernCase.IAmContactId);
                this.paramUrl = this.searchParamsUrl.toString();
                console.log("paramUrl: "+this.paramUrl)
            }

            // console.log("reporterContactInfo 3: "+JSON.stringify(this.reporterInfo));
            // console.log("paramsUrl after 3: "+this.paramUrl);
        }
        this.errors = errors;
    }

    get variables() {
        return {
            salesforceId: this.paramsfId,
            bannerId: this.paramBId,
        }
    }

    // @wire(graphql, {
    //     query: gql`
    //       query CaseRecordTypeId {
    //         uiapi {
    //           query
    //           {
    //             RecordType ( where: {
    //                                   SobjectType: { eq: "Case" }
    //                                   DeveloperName: { eq: "Community_Concern" }
    //                                 },
    //                       upperBound: 1
    //                     )
    //             {
    //               edges {
    //                 node {
    //                   Id
    //                   Name {value}
    //                 }
    //               }
    //             }
    //           }
    //         }
    //       }
    //     `,
    // })
    // graphqlRecordTypeResult({data, errors}) {
    //     if (data) {
    //         const results = data.uiapi.query.RecordType.edges.map((edge) => edge.node);
    //         if (results.length > 0) {
    //             this.caseRecordTypeId = {
    //                 contactId: results[0].contactId,
    //                 Name: results[0].Name.value,
    //             };
    //         }
    //     }
    //     this.errors = errors;
    // }

    singleSelectHandler(event) {
        this.communityOfConcernCase.ConcernedWhatValue = "";
        this.communityOfConcernCase.ConcernedWhatAdditionalInfo = "";
        switch (event.currentTarget.dataset.selecttype) {
            case "iamselect":
                this.communityOfConcernCase.IAmValue = event.detail.value;
                break;
            case "concernedwhoselect":
                this.communityOfConcernCase.ConcernedWhoValue = event.detail.value;
                break;
            case "concernedwhatselect":
                this.communityOfConcernCase.ConcernedWhatValue = event.detail.value;
                break;
        }
    }

    inputTextHandler(event) {
        switch (event.currentTarget.dataset.inputgroup) {
            case "iaminfo":
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.communityOfConcernCase.IAmFirstName = event.detail.value.trim();
                        break;
                    case "lastname":
                        this.communityOfConcernCase.IAmLastName = event.detail.value.trim();
                        break;
                    case "email":
                        this.communityOfConcernCase.IAmEmail = event.target.checkValidity() ? event.detail.value.trim() : "";
                        break;
                    case "phone":
                        this.communityOfConcernCase.IAmPhone = event.detail.value.trim();
                        break;
                }
                break;
            case "concernedwhoinfo":
                switch (event.currentTarget.dataset.inputtype) {
                    case "firstname":
                        this.communityOfConcernCase.ConcernedWhoFirstName = event.detail.value.trim();
                        break;
                    case "lastname":
                        this.communityOfConcernCase.ConcernedWhoLastName = event.detail.value.trim();
                        break;
                    case "email":
                        this.communityOfConcernCase.ConcernedWhoEmail = event.target.checkValidity() ? event.detail.value.trim() : "";
                        break;
                    case "phone":
                        this.communityOfConcernCase.ConcernedWhoPhone = event.detail.value.trim();
                        break;
                }
                break;
            case "concernedwhatadditionalinfo":
                this.communityOfConcernCase.ConcernedWhatAdditionalInfo = event.detail.value.trim();
                break;
        }
    }

    submittedUrl() {
        // this.searchParamsUrl.searchParams.set("bid", this.paramBId);
        // this.searchParamsUrl.searchParams.set("sbid", "");
        // this.searchParamsUrl.searchParams.set("crn", "");
        this.searchParamsUrl.searchParams.set("submitted", "true");

        return this.searchParamsUrl;
    }

    async submitCase() {
        // const fields = {};
        // fields[RECORD_TYPE.fieldApiName] = this.caseRecordTypeId.Id;
        // fields[ORIGIN.fieldApiName] = 'Web';
        // fields[SUBJECT.fieldApiName] = 'Tommie Cares';
        // fields[CASE_STATUS.fieldApiName] = 'New';
        // fields[COMMUNITY_CONCERN_WHO_TYPE.fieldApiName] = this.concernedWhoValue;
        // if (!!this.reporterInfo.Id) {
        //     fields[CASE_REPORTER.fieldApiName] = this.reporterInfo.Id;
        // }
        // fields[COMMUNITY_CONCERN_REPORTER_TYPE.fieldApiName] = this.iAmValue;
        // fields[SUPPLIED_NAME.fieldApiName] = this.reporterInfo.FirstName + ' ' + this.reporterInfo.LastName;
        // fields[SUPPLIED_EMAIL.fieldApiName] = this.reporterInfo.Email;
        // fields[SUPPLIED_PHONE.fieldApiName] = this.reporterInfo.Phone;
        // fields[COMMUNITY_CONCERN_WHAT.fieldApiName] = this.concernedWhatValue;
        // fields[FIRST_NAME.fieldApiName] = this.concernedWhoInfo.FirstName;
        // fields[LAST_NAME.fieldApiName] = this.concernedWhoInfo.LastName;
        // fields[ST_THOMAS_EMAIL.fieldApiName] = this.concernedWhoInfo.Email;
        // fields[PHONE.fieldApiName] = this.concernedWhoInfo.Phone;

        // const recordInput = {apiName: CASE_OBJECT.objectApiName, fields};
        // console.log("What is createRecord 6: " + JSON.stringify(fields));

        console.log("We good 3");
        // this.communityOfConcernCase.IAmValue = this.iAmValue;
        // this.communityOfConcernCase.IAmContactId = this.reporterInfo.contactId;
        // this.communityOfConcernCase.IAmFirstName = this.reporterInfo.FirstName;
        // this.communityOfConcernCase.IAmLastName = this.reporterInfo.LastName;
        // this.communityOfConcernCase.IAmStThomasConnection = this.reporterInfo.Email;
        // this.communityOfConcernCase.IAmEmail = this.reporterInfo.Email;
        // this.communityOfConcernCase.IAmPhone = this.reporterInfo.Phone;
        // this.communityOfConcernCase.IAmBannerId: "",
        // this.communityOfConcernCase.ConcernedWhoValue = this.concernedWhoValue;
        // this.communityOfConcernCase.ConcernedWhoFirstName = this.concernedWhoInfo.FirstName;
        // this.communityOfConcernCase.ConcernedWhoLastName = this.concernedWhoInfo.LastName;
        // this.communityOfConcernCase.ConcernedWhoEmail = this.concernedWhoInfo.Email;
        // this.communityOfConcernCase.ConcernedWhoPhone = this.concernedWhoInfo.Phone;
        // this.communityOfConcernCase.ConcernedWhatValue = this.concernedWhatValue;

        console.log("communityOfConcernCase: " + JSON.stringify(this.communityOfConcernCase));
        // try {
            // const caseRecord = await createRecord(recordInput);
            // console.log("We good: "+JSON.stringify(caseRecord));

        try {
            window.scrollTo(0, 0);
            this.submitCaseSpinner = true;
            await saveCase({formSelections: this.communityOfConcernCase});
            this.submitCaseSpinner = false;
            location.replace(this.submittedUrl());
        } catch (e) {
            console.log("Submission Error: " + JSON.stringify(e));
            this.submitCaseSpinner = false;
        }

            // await createRecord(recordInput).then((record) => {
            //     this.submitCaseSpinner = false;
            //     // location.replace(this.submittedUrl());
            //     // this.dispatchEvent(
            //     //     new ShowToastEvent({
            //     //         title: "Success",
            //     //         message: "Tell Someone form submitted",
            //     //         variant: "success",
            //     //     }),
            //     // );
            // }) .catch((error) => {
            //         console.log("createRecord error: " + JSON.stringify(error));
            //         this.submitCaseSpinner = false;
            //     });
                //     this.dispatchEvent(
                //         new ShowToastEvent({
                //             title: "Error",
                //             message: error.body.message,
                //             variant: "error",
                //         }),
                //     );
                // });

        // } catch (e) {
        //     console.log("createRecord error: " + JSON.stringify(e));
        //     this.submitCaseSpinner = false;
        // }
    }

}