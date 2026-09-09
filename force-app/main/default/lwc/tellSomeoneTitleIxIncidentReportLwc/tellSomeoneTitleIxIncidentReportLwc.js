/**
 * Created: 09/02/2026:
 * This LWC is a child component in tellSomeoneLwc, tommieAlertsLwc, tommieAlertsAdvisingStudentSupportLwc.
 */

import {api, LightningElement, track, wire} from 'lwc';
import titleIxReportingFormOptions from "@salesforce/apex/TellSomeoneLwcController.getTitleIxReportingOptions";
import submitTitleIxReportForm from "@salesforce/apex/TellSomeoneLwcController.submitTitleIxReportForm";
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
    @api tommieAlertsForm = false;

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

    get tommieAlertsDisable() {
        return this.tommieAlertsForm;
    }

    get tommieAlertsHide() {
        return !this.tommieAlertsDisable;
    }

    get tommieAlertsDisableReporterEmail() {
        return this.tommieAlertsDisable && !this.reporterInfoRevealed;
    }

    get showReporterInfo() {
        return !this.tommieAlertsForm || this.reporterInfoRevealed;
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
            (this.titleIxIncidentFormValues.i_understand_the_statement_about_anonymous_r || (this.validEmail && !!this.titleIxIncidentFormValues.reporterEmail && this.titleIxIncidentFormValues.reporterName)));
    }

    rendered = false;
    reporterEmailValidated = false;
    renderedCallback() {
        if(!this.rendered) {
            this.titleIxIncidentFormValues.reporterName = this.tellSomeoneReporterFirstName ? this.tellSomeoneReporterFirstName + " " + this.tellSomeoneReporterLastName : "";
            this.titleIxIncidentFormValues.person_who_was_harmed_complainants = this.tommieAlertsStudentName;
            this.rendered = true;
        }

        if (!this.reporterEmailValidated && this.tellSomeoneReporterEmail && this.showFormAll) {
            let reporterEmailField = this.template.querySelector('[data-inputtype="email"]');
            this.validateReporterEmail(this.tellSomeoneReporterEmail, reporterEmailField);
            this.reporterEmailValidated = true;
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

    descriptionLengthCount = 0;
    maxDescriptionCharacterLength = 20000;
    maxStandardCharacterLength = 255;
    inputValueHandler(event) {
        let eventField = event.currentTarget;
        let eventValue = event.detail.value;
        let eventValueTrim = eventValue.trim();
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputtype) {
            case "name":
                this.titleIxIncidentFormValues.reporterName = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "email":
                if (!eventValue) {
                    this.validEmailWarning = false;
                    this.validEmail = true;
                } else {
                    this.validEmail = false;
                }
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "phone":
                this.titleIxIncidentFormValues.reporterPhone = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "description":
                this.titleIxIncidentFormValues.description = eventValueTrim;
                this.descriptionLengthCount = eventValue.length;
                this.maxlengthCheck(eventField, eventValue, this.maxDescriptionCharacterLength);
                break;
            case "whoharmed":
                this.titleIxIncidentFormValues.person_who_was_harmed_complainants = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "location":
                this.titleIxIncidentFormValues.additionalLocation = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "dates":
                this.titleIxIncidentFormValues.date_of_incidents = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "whocausedharm":
                this.titleIxIncidentFormValues.person_who_did_harm_respondents = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "witnesses":
                this.titleIxIncidentFormValues.otherWitness = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "followup":
                this.titleIxIncidentFormValues.reporter_followup = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
        }
        this.submitDisableToTommieAlerts();
        console.log("this.titleIxIncidentFormValues: "+JSON.stringify(this.titleIxIncidentFormValues));
    }

    maxlengthCheck(field, fieldValue, maxLength) {
        if (fieldValue.length === maxLength) {
            // Set the custom error message
            field.setCustomValidity(`Max limit of ${maxLength} characters reached.`);
        } else {
            // Clear the error message if they delete characters and go under the limit
            field.setCustomValidity('');
        }
        field.reportValidity();
    }

    validEmail = true;
    validEmailWarning = false;
    reporterInfoRevealed = false;

    validateReporterEmail(emailAddress, emailField) {
        let emailValidationResults = emailValidation(emailAddress);
        this.titleIxIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
        this.validEmail = emailValidationResults.validEmail;
        this.validEmailWarning = emailValidationResults.validEmailWarning;
        if (this.tommieAlertsForm && this.validEmailWarning) {
            this.reporterInfoRevealed = true; // only latch open when in TommieAlerts form flow
        }
        if (emailField) {
            emailField.classList.toggle("slds-has-error", this.validEmailWarning);
        }
    }

    emailValidationBlur(event) {
        const emailField = event.currentTarget;
        const emailAddress = event.target.value;

        this.validateReporterEmail(emailAddress, emailField);
        this.submitDisableToTommieAlerts();
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
        if (this.attachDocuments.length === 0) {
            this.attachDocumentsExclude = [];
        }
    }

    submittedUrl() {
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

    showSpinner = false;
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

        this.showSpinner = true;

        if (this.attachDocuments.length > 0) {
            try {
                this.saveDocumentsFail = await attachedDocumentsSave(this.attachDocuments, 'Advocate Title IX Incident', attachDocumentResponse);
                this.titleIxIncidentFormValues.salesforce_support_documents = attachDocumentResponse.SupportingDocumentUrl;
                console.log('attachDocumentResponse: ', JSON.stringify(attachDocumentResponse));
                console.log('this.titleIxIncidentFormValues: ', JSON.stringify(this.titleIxIncidentFormValues));
            } catch (error) {
                this.saveDocumentsFail = true;
                console.error('Error saving attached documents:', error);
            }
        }

        try {
            console.log('formValues: ', JSON.stringify(this.titleIxIncidentFormValues));
            formReportNumber = await submitTitleIxReportForm({formValues: this.titleIxIncidentFormValues});
            this.submitTitleIxIncidentFormFail = !formReportNumber;
            console.log('formReportNumber: ', formReportNumber);
        } catch (error) {
            this.submitTitleIxIncidentFormFail = true;
            console.error('Error submitting titleIx form:', error);
        }

        try {
            await finalizeSupportingDocument(this.saveDocumentsFail, this.submitTitleIxIncidentFormFail, attachDocumentResponse, formReportNumber);
            // eslint-disable-next-line no-restricted-globals
            location.replace(this.submittedUrl());
        } catch (error) {
            console.error('Error finalizing supporting document:', error);
        } finally {
            this.showSpinner = false;
        }
    }

    submitDisableToTommieAlerts() {
        console.log("this.submitDisable: "+this.submitDisable);
        const customEvent = new CustomEvent("submitdisabletitleix", {
            detail: { value: this.submitDisable }
        });
        this.dispatchEvent(customEvent);
    }
}