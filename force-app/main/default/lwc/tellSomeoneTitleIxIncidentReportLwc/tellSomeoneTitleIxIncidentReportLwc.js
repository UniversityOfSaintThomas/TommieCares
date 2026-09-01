/**
 * Created by nguy0092 on 8/19/2026.
 */

import {api, LightningElement, track, wire} from 'lwc';
import titleIxReportingFormOptions from "@salesforce/apex/TellSomeoneLwcController.getTitleIxReportingOptions";
// import saveSupportingDocuments from "@salesforce/apex/TellSomeoneLwcController.saveSupportingDocuments";
import submitTitleIxReportForm from "@salesforce/apex/TellSomeoneLwcController.submitTitleIxReportForm";
// import updateSupportingDocument from "@salesforce/apex/TellSomeoneLwcController.updateSupportingDocument";
// import deleteSupportingDocument from "@salesforce/apex/TellSomeoneLwcController.deleteSupportingDocument";
import {emailValidation, attachDocumentsUpload, attachedDocumentsSave, finalizeSupportingDocument} from "c/tellSomeoneUtilJs";

export default class TellSomeoneTitleIxIncidentReportLwc extends LightningElement {
    //From parent component
    @api tellSomeoneReportType = "";
    @api tellSomeoneReporterFirstName = "";
    @api tellSomeoneReporterLastName = "";
    @api tellSomeoneReporterEmail = "";
    @api tellSomeoneConcernWhoValue = "";
    @api tellSomeoneParamsUrl = "";
    @api tommieAlertsStudentName = "";
    @api tommieAlertsHideCss = "";

    @api get formToTommieAlerts() {
        return this.titleIxIncidentFormValues;
    }
    @api get documentsToTommieAlerts() {
        return this.attachDocuments;
    }

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
        person_who_was_harmed_complainants: "", //Name of the person who was harmed
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
        salesforce_support_documents: "" //For Supporting Documents record ID
    }

    notificationSelect = ""
    iUnderstandTheStatementAboutAnonymousSelect = []

    get reporterElementsCss() {
        return "slds-grid slds-grid_vertical " + this.tommieAlertsHideCss;
    }

    get submitSectionElementCss() {
        return this.tommieAlertsHideCss;
    }

    get showFormAll() {
        return !!this.titleIxIncidentFormValues.reporter_type_custom;
    }

    get isAnonymous() {
        return this.tellSomeoneReportType === "Anonymous";
    }

    get isNotAnonymous() {
        return !this.isAnonymous;
    }

    get statusWhoCausedHarmValue() {
        return this.titleIxIncidentFormValues.status_of_individual_who_caused_harm[0] || "";
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
            this.titleIxIncidentFormValues.reporterName = this.tellSomeoneReporterFirstName ? this.tellSomeoneReporterFirstName + " " + this.tellSomeoneReporterLastName : "";
            if (this.tellSomeoneReporterEmail) {
                let emailValidationResults = emailValidation(this.tellSomeoneReporterEmail);
                this.titleIxIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
            }
            this.titleIxIncidentFormValues.person_who_was_harmed_complainants = this.tommieAlertsStudentName;

            this.rendered = !this.rendered;
        }
    }

    @wire(titleIxReportingFormOptions, {})
    titleIxReportingFormOptionsWire({error, data}) {
        let _reporterTypeOptions = [];
        let _statusWhoCausedHarmOptions = [];
        if (data) {
            if(data.reporterType) {
                let _reporterTypeData = JSON.parse(data.reporterType);
                _reporterTypeData.forEach((object) => {
                    _reporterTypeOptions.push({
                        label: object.value,
                        value: object.id.toString(),
                    })
                })
                this.reporterTypeOptions = _reporterTypeOptions;
                if (this.reporterTypeOptions.length > 0 && this.tellSomeoneReportType && !this.titleIxIncidentFormValues.reporter_type_custom) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.tellSomeoneReportType.toLowerCase())) {
                            this.reporterType = this.reporterTypeOptions[i].value;
                            this.titleIxIncidentFormValues.reporter_type_custom = this.reporterTypeOptions[i].label;
                            break;
                        } else {
                            let otherType = _reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                this.reporterType = otherType.value;
                                this.titleIxIncidentFormValues.reporter_type_custom = otherType.label;
                            }
                        }
                    }
                }
            }

            if (data.statusOfIndividualWhoCausedHarm) {
                let _statusWhoCausedHarmData = JSON.parse(data.statusOfIndividualWhoCausedHarm);
                _statusWhoCausedHarmData.forEach((options) => {
                    _statusWhoCausedHarmOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.statusWhoCausedHarmOptions = _statusWhoCausedHarmOptions;
            }
        }

        if (error) {
            console.log("titleIxReportingFormOptions1Wire error: "+JSON.stringify(error));
        }
    }

    selectValueHandler(event) {
        let eventValue = event.detail.value;
        let eventValueHtml = event.target.value;
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.selecttype) {
            case "reportertype":
                this.reporterType = eventValue;
                // eslint-disable-next-line no-case-declarations
                let reporterTypeLabel = this.reporterTypeOptions.find((typeOption) => typeOption.value === eventValue);
                this.titleIxIncidentFormValues.reporter_type_custom = reporterTypeLabel.label;
                break;
            case "anonymousreporting":
                this.iUnderstandTheStatementAboutAnonymousSelect = eventValueHtml;
                this.titleIxIncidentFormValues.i_understand_the_statement_about_anonymous_r = eventValueHtml.includes("true");
                console.log("i_understand_the_statement_about_anonymous_r eventValue: "+eventValue);
                console.log("i_understand_the_statement_about_anonymous_r eventValueHtml: "+eventValueHtml);
                break;
            case "statuswhocausedharm":
                // this.titleIxIncidentFormValues.status_of_individual_who_caused_harm = eventValue;
                this.titleIxIncidentFormValues.status_of_individual_who_caused_harm = eventValue ? [eventValue] : [];
                console.log("status_of_individual_who_caused_harm eventValue: "+eventValue);
                console.log("status_of_individual_who_caused_harm eventValueHtml: "+eventValueHtml);
                break;
            case "notification":
                this.notificationSelect = eventValue;
                this.titleIxIncidentFormValues.notification = eventValue === "true";
                console.log("notification eventValue: "+eventValue);
                console.log("notification eventValueHtml: "+eventValueHtml);
                break;
        }
        this.submitDisableToTommieAlerts();
    }

    inputValueHandler(event) {
        let eventValue = event.detail.value;
        // eslint-disable-next-line default-case
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
        this.submitDisableToTommieAlerts();
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
    acceptedExtensionTypes = ".csv, .doc, .docx, .jpg, .jpeg, .pdf, .png, .txt, .xls, .xlsx";
    acceptedMimeTypes = ["text/csv", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg", "application/pdf", "image/png", "text/plain", "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    @track attachDocuments = [];
    @track attachDocumentsExclude = [];
    fileIndex = 0;
    maxFileSize = 3;
    maxFileCount = 5;

    async attachDocumentsHandler(event) {
        const uploadedFiles = event.target.files;
        const attachDocumentsUploadResults = await attachDocumentsUpload(uploadedFiles, this.acceptedExtensionTypes, this.acceptedMimeTypes,
            this.fileIndex, this.attachDocuments, this.maxFileSize, this.maxFileCount);
        attachDocumentsUploadResults.attachDocuments.forEach((document) => {
            this.attachDocuments.push(document);
        })
        this.attachDocumentsExclude = attachDocumentsUploadResults.attachDocumentsExclude;
        this.fileIndex = attachDocumentsUploadResults.fileIndex;
    }

    attachDocumentsDelete(event) {
        let removeFileId = event.currentTarget.dataset.fileid;
        this.attachDocuments = this.attachDocuments.filter(obj => obj.fileId.toString() !== removeFileId.toString());
        // console.log("After remove file length: "+this.attachDocuments.length);
        if (this.attachDocuments.length === 0) {
            this.attachDocumentsExclude = [];
        }
    }

    showSpinner = false;
    handleShowSpinner() {
        this.showSpinner = true;
    }

    handleHideSpinner() {
        this.showSpinner = false;
    }

    get submittedUrl() {
        this.searchParamsUrl = new URL(this.tellSomeoneParamsUrl);
        this.searchParamsUrl.searchParams.set("submitted", "true");
        if (this.submitTitleIxIncidentFormFail) {
            this.searchParamsUrl.searchParams.set("submitvalid", "false");
        }
        if (this.saveDocumentsFail) {
            this.searchParamsUrl.searchParams.set("nodocument", "true");
        }
        return this.searchParamsUrl;
    }

    submitLimit = 0;
    saveDocumentsFail = false;
    submitTitleIxIncidentFormFail = false;
    async submitFormHandler(event) {
        const eventField = event.currentTarget;
        this.saveDocumentsFail = false;
        this.submitTitleIxIncidentFormFail = false;
        let attachDocumentResponse = {
            Status: "",
            SupportingDocumentUrl: "",
            SupportingDocumentId: ""
        }
        let formReportNumber = "";

        this.handleShowSpinner();

        if (this.attachDocuments.length > 0) {
            this.saveDocumentsFail = await attachedDocumentsSave(this.attachDocuments, 'Advocate Title IX Incident', attachDocumentResponse);
            this.titleIxIncidentFormValues.salesforce_support_documents = attachDocumentResponse.SupportingDocumentUrl;
            console.log('attachDocumentResponse: ', JSON.stringify(attachDocumentResponse));
            console.log('this.titleIxIncidentFormValues: ', JSON.stringify(this.titleIxIncidentFormValues));
        }

        if (!this.saveDocumentsFail) {
            try {
                let formValues = JSON.stringify(this.titleIxIncidentFormValues);
                console.log('formValues: ', formValues);
                formReportNumber = await submitTitleIxReportForm({formValues: formValues});
                this.submitTitleIxIncidentFormFail = !formReportNumber;
                console.log('formReportNumber: ', formReportNumber);
            } catch (error) {
                this.submitTitleIxIncidentFormFail = true;
                console.error('Error submitting titleIx form:', error);
            }
        }

        /*START TEST INPUTS*/
        // this.submitTitleIxIncidentFormFail = true;
        // this.submitLimit++;
        // formReportNumber = "TEST-123456";
        // this.saveDocumentsFail = false;
        /*END TEST INPUTS*/

        await finalizeSupportingDocument(this.saveDocumentsFail, this.submitTitleIxIncidentFormFail, attachDocumentResponse, formReportNumber);

        if (this.submitTitleIxIncidentFormFail && this.submitLimit < 2) {
            this.handleHideSpinner();
            this.submitLimit++;
            // eventField.scrollIntoView({
            //     behavior: 'smooth',
            // });
        } else {
            this.handleHideSpinner();
            // eslint-disable-next-line no-restricted-globals
            location.replace(this.submittedUrl);
        }

        /*START TEST INPUTS*/
        this.handleHideSpinner();
        /*END TEST INPUTS*/
    }

    submitDisableToTommieAlerts() {
        console.log("this.submitDisable: "+this.submitDisable);
        const customEvent = new CustomEvent("submitdisabletitleix", {
            detail: { value: this.submitDisable }
        });
        this.dispatchEvent(customEvent);
    }

}