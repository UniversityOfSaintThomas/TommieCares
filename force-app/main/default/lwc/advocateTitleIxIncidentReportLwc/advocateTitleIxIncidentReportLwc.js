/**
 * Created by nguy0092 on 8/12/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import titleIxReportingFormOptions from "@salesforce/apexContinuation/CommunityOfConcernLwcController.titleIxReportingFormOptions1";
import saveSupportingDocuments from "@salesforce/apex/CommunityOfConcernLwcController.saveSupportingDocuments";
import updateSupportingDocument from "@salesforce/apex/CommunityOfConcernLwcController.updateSupportingDocument";
import submitForm from "@salesforce/apexContinuation/CommunityOfConcernLwcController.submitForm";
import {emailValidation, attachDocumentsUpload} from "c/communityOfConcernUtilJs";

export default class AdvocateTitleIxIncidentReportLwc extends LightningElement {
    @api communityOfConcernReportType = "";
    @api communityOfConcernReporterFirstName = "";
    @api communityOfConcernReporterLastName = "";
    @api communityOfConcernReporterEmail = "";
    @api communityOfConcernParamsUrl = "";

    @track reporterTypeOptions = [];
    @track statusWhoCausedHarmOptions = []
    @track notificationOptions = [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
    ]
    @track anonymousReportingOptions = [
        {label: "Yes", value: "true"}
    ]

    reporterType; //Using variable to hold value for form because can't pass to API reporterType
    @track titleIxIncidentFormValues = {
        // reporterType: "", //I am a
        reporter_type_custom: "", //Using because can't pass to API reporterType
        i_understand_the_statement_about_anonymous_r: false, //Anonymous Reporting
        status_of_individual_who_caused_harm: [], //Status of Individual Who Caused Harm
        reporterName: "", //Reporter's Name
        reporterEmail: "", //Reporter's EmailRequired
        reporterPhone: "", //Reporter's Phone
        description: "", //Incident / Concerning Behavior Description REQUIRED
        person_who_was_harmed_complainants: "", //Name of the person who caused harm
        additionalLocation: "", //Location of Incident
        date_of_incidents: "", //Date of Incident(s)Required
        person_who_did_harm_respondents: "", //Name of the person who caused harm
        otherWitness: "", //Witness(es)
        notification: null, //Notification Boolean
        reporter_followup: "", //Reporter Follow-up REQUIRED
        hostileEnvironment: false, //REQUIRED
        quidProQuo: false, //REQUIRED
        sexDiscrimination: true, //REQUIRED
        sexDiscriminationType: "1", //REQUIRED -Using first value as default
        sexualViolence: false, //REQUIRED
        maritalStatus: false, //REQUIRED
        retaliation: false, //REQUIRED
        salesforce_support_documents: "" //temporarily using this field for Supporting Documents record ID
    }

    notificationSelect = ""
    iUnderstandTheStatementAboutAnonymousSelect = []

    get showFormAll() {
        // return !!this.titleIxIncidentFormValues.reporterType;
        return !!this.titleIxIncidentFormValues.reporter_type_custom;
    }

    get isAnonymous() {
        return this.communityOfConcernReportType === "Anonymous";
    }

    get isNotAnonymous() {
        return !this.isAnonymous;
    }

    get submitDisable() {
        return !(!!this.titleIxIncidentFormValues.reporter_type_custom && !!this.titleIxIncidentFormValues.description &&
            this.titleIxIncidentFormValues.status_of_individual_who_caused_harm.length > 0 && !!this.titleIxIncidentFormValues.date_of_incidents &&
            this.titleIxIncidentFormValues.notification != null && this.titleIxIncidentFormValues.reporter_followup &&
            (this.titleIxIncidentFormValues.i_understand_the_statement_about_anonymous_r || (this.validEmail && !!this.titleIxIncidentFormValues.reporterEmail)));
    }

    rendered = false;
    renderedCallback() {
        if(!this.rendered) {
            this.titleIxIncidentFormValues.reporterName = !!this.communityOfConcernReporterFirstName ? this.communityOfConcernReporterFirstName + " " + this.communityOfConcernReporterLastName : "";
            if (this.communityOfConcernReporterEmail) {
                let emailValidationResults = emailValidation(this.communityOfConcernReporterEmail);
                this.titleIxIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
            }
            this.rendered = !this.rendered;
        }
    }

    @wire(titleIxReportingFormOptions, {})
    titleIxReportingFormOptions1Wire({error, data}) {
        let recordOptions = [];
        let reporterTypeOptions = [];
        let statusWhoCausedHarmOptions = [];
        if (data) {
            data.forEach((o) => {
                recordOptions.push(JSON.parse(o));
            })

            if (recordOptions[0]) {
                recordOptions[0].forEach((options) => {
                    reporterTypeOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.reporterTypeOptions = reporterTypeOptions;
                // if (this.reporterTypeOptions.length > 0 && this.communityOfConcernReportType && !this.titleIxIncidentFormValues.reporterType) {
                if (this.reporterTypeOptions.length > 0 && this.communityOfConcernReportType && !this.titleIxIncidentFormValues.reporter_type_custom) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.communityOfConcernReportType.toLowerCase())) {
                            // this.titleIxIncidentFormValues.reporterType = this.reporterTypeOptions[i].value;
                            this.reporterType = this.reporterTypeOptions[i].value; //Using because can't pass to API reporterType
                            this.titleIxIncidentFormValues.reporter_type_custom = this.reporterTypeOptions[i].label; //Using because can't pass to API reporterType
                            break;
                        } else {
                            let otherType = reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                // this.titleIxIncidentFormValues.reporterType = otherType.value;
                                this.reporterType = otherType.value; //Using because can't pass to API reporterType
                                this.titleIxIncidentFormValues.reporter_type_custom = otherType.label; //Using because can't pass to API reporterType
                            }
                        }
                    }
                }
            }

            if (recordOptions[1]) {
                recordOptions[1].forEach((options) => {
                    statusWhoCausedHarmOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.statusWhoCausedHarmOptions = statusWhoCausedHarmOptions;
            }

        }

        if (error) {
            console.log("titleIxReportingFormOptions1Wire error: "+JSON.stringify(error));
        }
    }

    selectValueHandler(event) {
        let eventValue = event.detail.value;
        switch (event.currentTarget.dataset.selecttype) {
            case "reportertype":
                // this.titleIxIncidentFormValues.reporterType = eventValue;
                this.reporterType = eventValue;
                let reporterTypeLabel = this.reporterTypeOptions.find((typeOption) => typeOption.value === eventValue);
                this.titleIxIncidentFormValues.reporter_type_custom = reporterTypeLabel.label; //Using because can't pass to API reporterType
                break;
            case "anonymousreporting":
                this.iUnderstandTheStatementAboutAnonymousSelect = eventValue;
                this.titleIxIncidentFormValues.i_understand_the_statement_about_anonymous_r = eventValue.includes("true");
                break;
            case "statuswhocausedharm":
                this.titleIxIncidentFormValues.status_of_individual_who_caused_harm = eventValue;
                break;
            case "notification":
                this.notificationSelect = eventValue;
                this.titleIxIncidentFormValues.notification = eventValue === "true";
                break;
        }
        console.log("titleIxIncidentFormValues: "+JSON.stringify(this.titleIxIncidentFormValues));
    }

    inputValueHandler(event) {
        let eventValue = event.detail.value;
        switch (event.currentTarget.dataset.inputtype) {
            case "name":
                this.titleIxIncidentFormValues.reporterName = eventValue;
                break;
            case "email":
                this.titleIxIncidentFormValues.reporterEmail = eventValue;
                break;
            case "phone":
                this.titleIxIncidentFormValues.reporterPhone = eventValue;
                break;
            case "description":
                this.titleIxIncidentFormValues.description = eventValue;
                break;
            case "whoharmed":
                this.titleIxIncidentFormValues.person_who_was_harmed_complainants = eventValue;
                break;
            case "location":
                this.titleIxIncidentFormValues.additionalLocation = eventValue;
                break;
            case "dates":
                this.titleIxIncidentFormValues.date_of_incidents = eventValue;
                break;
            case "whocausedharm":
                this.titleIxIncidentFormValues.person_who_did_harm_respondents = eventValue;
                break;
            case "witnesses":
                this.titleIxIncidentFormValues.otherWitness = eventValue;
                break;
            case "followup":
                this.titleIxIncidentFormValues.reporter_followup = eventValue;
                break;
        }
        console.log("titleIxIncidentFormValues: "+JSON.stringify(this.titleIxIncidentFormValues));
    }

    validEmail = true;
    validEmailWarning = false;
    emailValidationBlur(event) {
        const emailField = event.currentTarget;
        const emailAddress = event.target.value;
        let emailValidationResults = emailValidation(emailAddress);

        this.titleIxIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
        this.validEmail = emailValidationResults.validEmail;
        this.validEmailWarning = emailValidationResults.validEmailWarning;

        if (this.validEmailWarning) {
            emailField.classList.add("slds-has-error");
        } else {
            emailField.classList.remove("slds-has-error");
        }
    }

    get showAttachDocumentName() {
        return this.attachDocuments.length !== 0;
    }

    get showAttachDocumentExcludeName() {
        return this.attachDocumentsExclude.length !== 0;
    }
    acceptedExtensionTypes = [".csv", ".doc", ".docx", ".jpg", ".jpeg", ".pdf", ".png", ".txt", ".xls", ".xlsx"];
    acceptedMimeTypes = ["text/csv", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg", "application/pdf", "image/png", "text/plain", "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]

    @track attachDocuments = [];
    @track attachDocumentsExclude = [];
    fileIndex = 0;

    async attachDocumentsHandler(event) {
        const uploadedFiles = event.target.files;
        let attachDocumentsUploadResults = await attachDocumentsUpload(uploadedFiles, this.acceptedExtensionTypes, this.acceptedMimeTypes, this.fileIndex);
        attachDocumentsUploadResults.attachDocuments.forEach((document) => {
            this.attachDocuments.push(document);
        })
        this.attachDocumentsExclude = attachDocumentsUploadResults.attachDocumentsExclude;
        this.fileIndex = attachDocumentsUploadResults.fileIndex;
    }

    attachDocumentsDelete(event) {
        let removeFileId = event.currentTarget.dataset.fileid;
        this.attachDocuments = this.attachDocuments.filter(obj => obj.fileId.toString() !== removeFileId.toString());
        console.log("After remove file length: "+this.attachDocuments.length);
        if (this.attachDocuments.length === 0) {
            this.attachDocumentsExclude = [];
        }
    }

    submittedUrl() {
        this.searchParamsUrl = new URL(this.communityOfConcernParamsUrl);
        this.searchParamsUrl.searchParams.set("submitted", "true");
        return this.searchParamsUrl;
    }

    saveDocumentsFail = false;
    submitTitleIxIncidentFormFail = false;
    attachDocumentResponse = {
        Status: "",
        SupportingDocumentUrl: "",
        SupportingDocumentId: ""
    }
    formReportNumber = "";

    async submitFormHandler(event) {
        const eventField = event.currentTarget;
        this.saveDocumentsFail = false;
        this.submitTitleIxIncidentFormFail = false;

        const showSpinnerEvent = new CustomEvent('showspinner');
        this.dispatchEvent(showSpinnerEvent);
        window.scrollTo(0,0);

        if (this.attachDocuments.length > 0) {
            const supportingDocumentName = 'Advocate Title IX Incident';
            try {
                await saveSupportingDocuments({attachedDocumentsList: this.attachDocuments, supportingDocumentName: supportingDocumentName}).then((result) => {

                    if (result.Status === 'success') {
                        this.attachDocumentResponse = {
                            Status: result.Status,
                            SupportingDocumentUrl: result.Url,
                            SupportingDocumentId: result.SupportingDocumentId
                        }
                        console.log("Attach Document object: "+JSON.stringify(this.attachDocumentResponse));

                        this.titleIxIncidentFormValues.salesforce_support_documents = this.attachDocumentResponse.SupportingDocumentUrl;
                    } else if (result.Status === 'error') {
                        this.saveDocumentsFail = true;
                    }
                })
            } catch (e) {
                console.log("Save documents error: " + JSON.stringify(e));
                this.saveDocumentsFail = true;
            }
        }

        if (!this.saveDocumentsFail) {
            try {
                let formValues = JSON.stringify(this.titleIxIncidentFormValues);
                let formType = 'titleix';
                await submitForm({formValues: formValues, formType: formType}).then((result) => {
                    console.log('This all result: '+JSON.stringify(result));

                    if (result[0] !== 201) {
                        this.submitTitleIxIncidentFormFail = true;
                        console.log('This result ERROR getStatusCode: '+result[0]);
                    }

                    this.formReportNumber = result[1].reportNumber;
                    console.log('Report Number: '+this.formReportNumber);
                });
            } catch (error) {
                this.submitTitleIxIncidentFormFail = true;
            }
        }

        if (!this.saveDocumentsFail && !this.submitTitleIxIncidentFormFail && this.attachDocumentResponse.SupportingDocumentUrl) {
            try {
                await updateSupportingDocument( {supportingDocumentId: this.attachDocumentResponse.SupportingDocumentId, advocateReportNumber: this.formReportNumber} ).then((result) => {
                console.log("Update Status: "+result);
                });
            } catch (e) {
                console.log("updateSupportingDocument error: " + JSON.stringify(e));
            }
        }

        const hideSpinnerEvent = new CustomEvent('hidespinner');
        if (this.saveDocumentsFail || this.submitTitleIxIncidentFormFail) {
            this.dispatchEvent(hideSpinnerEvent);
            eventField.scrollIntoView({
                behavior: 'smooth',
            });
        } else {
            this.dispatchEvent(hideSpinnerEvent);
            console.log("Update submittedUrl: "+this.submittedUrl());
            location.replace(this.submittedUrl());
        }
    }

}