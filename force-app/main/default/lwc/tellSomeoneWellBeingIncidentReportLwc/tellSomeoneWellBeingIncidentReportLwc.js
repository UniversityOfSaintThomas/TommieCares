/**
 * Created by nguy0092 on 8/19/2026.
 */

import {api, LightningElement, track, wire} from 'lwc';
import wellBeingReportingFormOptions from "@salesforce/apex/TellSomeoneLwcController.getWellBeingOptions";
import saveSupportingDocuments from "@salesforce/apex/CommunityOfConcernLwcController.saveSupportingDocuments";
import updateSupportingDocument from "@salesforce/apex/CommunityOfConcernLwcController.updateSupportingDocument";
import submitForm from "@salesforce/apexContinuation/CommunityOfConcernLwcController.submitForm";
import {emailValidation, attachDocumentsUpload} from "c/tellSomeoneUtilJs";

export default class TellSomeoneWellBeingIncidentReportLwc extends LightningElement {
    @api tellSomeoneReportType = "Faculty";
    @api tellSomeoneReporterFirstName = "Test";
    @api tellSomeoneReporterLastName = "Tester";
    @api tellSomeoneReporterEmail = "test@test.com";
    @api tellSomeoneConcernWhoValue = "Student";
    @api tellSomeoneParamsUrl = "";
    @api tommieAlertsStudentName = "Tommie Alerts";
    @api tommieAlertsStudentEmail = "tommie@alerts.com";

    @api get formToTommieAlerts() {
        return this.wellBeingIncidentFormValues;
    }
    @api get documentsToTommieAlerts() {
        return this.attachDocuments;
    }

    @track reporterTypeOptions = [];
    @track whoAreYouConcernedAboutOptions = [];

    reporterType; //Using variable to hold value for form because can't pass to API reporterType
    @track wellBeingIncidentFormValues = {
        reporterType: "",
        reporter_type_custom: "", //Using because can't pass to API reporterType
        reporterName: "",
        reporterEmail: "",
        reporterPhone: "",
        who_are_you_concerned_about: "", //This is a custom field
        otherStudent: "",
        individuals_email_address: "", //This is a custom field
        individuals_phone_number: "", //This is a custom field
        incidentDate: "",
        description: "",
        // incidentType: "14", //required
        // additionalLocation: "1", //required
        // emsCalled: false, //required
        // residentialHallStaffCalled: false, //required
        // policeCalled: false, //required
        // alcohol: false, //required
        salesforce_support_documents: "" //For Supporting Documents record ID
    }

    get showFormAll() {
        return !!this.wellBeingIncidentFormValues.reporter_type_custom;
    }

    get isAnonymous() {
        return this.tellSomeoneReportType === "Anonymous";
    }

    get isNotAnonymous() {
        return !this.isAnonymous;
    }

    get submitDisable() {
        return !(!!this.wellBeingIncidentFormValues.reporter_type_custom && this.validDate && !!this.wellBeingIncidentFormValues.description && !!this.wellBeingIncidentFormValues.otherStudent &&
            (this.isAnonymous || (!!this.wellBeingIncidentFormValues.reporterName && !!this.wellBeingIncidentFormValues.reporterPhone && this.validEmail && !!this.wellBeingIncidentFormValues.reporterEmail)));
    }

    rendered = false;
    renderedCallback() {
        if(!this.rendered) {
            this.wellBeingIncidentFormValues.reporterName = this.tellSomeoneReporterFirstName ? this.tellSomeoneReporterFirstName + " " + this.tellSomeoneReporterLastName : "";
            if (this.tellSomeoneReporterEmail) {
                let emailValidationResults = emailValidation(this.tellSomeoneReporterEmail);
                this.wellBeingIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
            }

            this.wellBeingIncidentFormValues.otherStudent = this.tommieAlertsStudentName;
            if (this.tommieAlertsStudentEmail) {
                let emailValidationResults = emailValidation(this.tommieAlertsStudentEmail);
                this.wellBeingIncidentFormValues.individuals_email_address = emailValidationResults.emailAddress;
            }

            this.rendered = !this.rendered;
        }
    }

    @wire(wellBeingReportingFormOptions, {})
    wellBeingReportingFormOptionsWire({error, data}) {
        let recordOptions = [];
        let _reporterTypeOptions = [];
        let _whoAreYouConcernedAboutOptions = [];
        if (data) {
            data.forEach((o) => {
                recordOptions.push(JSON.parse(o));
            })

            if (recordOptions[0]) {
                recordOptions[0].forEach((options) => {
                    _reporterTypeOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })

                this.reporterTypeOptions = _reporterTypeOptions;
                if (this.reporterTypeOptions.length > 0 && this.tellSomeoneReportType && (!this.wellBeingIncidentFormValues.reporter_type_custom || !this.wellBeingIncidentFormValues.reporterType)) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.tellSomeoneReportType.toLowerCase())) {
                            this.wellBeingIncidentFormValues.reporterType = this.reporterTypeOptions[i].value;
                            this.wellBeingIncidentFormValues.reporter_type_custom = this.reporterTypeOptions[i].label;
                            break;
                        } else {
                            let otherType = _reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                this.wellBeingIncidentFormValues.reporterType = otherType.value;
                                this.wellBeingIncidentFormValues.reporter_type_custom = otherType.label;
                            }
                        }
                    }
                }
            }

            if (recordOptions[1]) {
                recordOptions[1].forEach((options) => {
                    _whoAreYouConcernedAboutOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })

                this.whoAreYouConcernedAboutOptions = _whoAreYouConcernedAboutOptions;
                if (this.whoAreYouConcernedAboutOptions.length > 0 && this.tellSomeoneConcernWhoValue) {
                    for (let i = 0; i < this.whoAreYouConcernedAboutOptions.length; i++) {
                        if (this.whoAreYouConcernedAboutOptions[i].label.toLowerCase().includes(this.tellSomeoneConcernWhoValue.toLowerCase())) {
                            this.wellBeingIncidentFormValues.who_are_you_concerned_about = this.whoAreYouConcernedAboutOptions[i].value;
                            break;
                        }
                    }
                }
            }
        }

        if (error) {
            console.log("wellBeingReportingFormOptionsWire error: "+JSON.stringify(error));
        }
    }

    selectValueHandler(event) {
        let eventValue = event.detail.value;
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.selecttype) {
            case "reportertype":
                this.reporterType = eventValue;
                // eslint-disable-next-line no-case-declarations
                let reporterTypeLabel = this.reporterTypeOptions.find((typeOption) => typeOption.value === eventValue);
                this.wellBeingIncidentFormValues.reporter_type_custom = reporterTypeLabel.label;
                break;
        }
    }

    inputValueHandler(event) {
        let eventField = event.target;
        let eventValue = event.detail.value;
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputtype) {
            case "name":
                this.wellBeingIncidentFormValues.reporterName = eventValue;
                break;
            case "email":
                if (!eventValue) {
                    this.validEmailWarning = false;
                    this.validEmail = true;
                } else {
                    this.validEmail = false;
                }
                break;
            case "phone":
                this.wellBeingIncidentFormValues.reporterPhone = eventValue;
                break;
            case "involvedname":
                this.wellBeingIncidentFormValues.otherStudent = eventValue;
                break;
            case "involvedemail":
                this.wellBeingIncidentFormValues.individuals_email_address = eventValue;
                if (!eventValue) {
                    this.validEmailWarningIndividual = false;
                    this.validEmailIndividual = true;
                } else {
                    this.validEmailIndividual = false;
                }
                break;
            case "involvedphone":
                this.wellBeingIncidentFormValues.individuals_phone_number = eventValue;
                break;
            case "date":
                if (eventValue) {
                    this._incidentDate = eventValue;
                } else {
                    this._incidentDate = "";
                }
                break;
            case "description":
                this.wellBeingIncidentFormValues.description = eventValue;
                break;
        }
    }

    validEmail = true;
    validEmailWarning = false;
    validEmailIndividual = true;
    validEmailWarningIndividual = false;
    emailValidationBlur(event) {
        const emailField = event.currentTarget;
        const emailAddress = event.target.value;
        let emailValidationResults = emailValidation(emailAddress);

        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputtype) {
            case "email":
                this.wellBeingIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
                this.validEmail = emailValidationResults.validEmail;
                this.validEmailWarning = emailValidationResults.validEmailWarning;
                if (this.validEmailWarning) {
                    emailField.classList.add("slds-has-error");
                } else {
                    emailField.classList.remove("slds-has-error");
                }
                break;
            case "involvedemail":
                this.wellBeingIncidentFormValues.individuals_email_address = emailValidationResults.emailAddress;
                this.validEmailIndividual = emailValidationResults.validEmail;
                this.validEmailWarningIndividual = emailValidationResults.validEmailWarning;
                if (this.validEmailWarningIndividual) {
                    emailField.classList.add("slds-has-error");
                } else {
                    emailField.classList.remove("slds-has-error");
                }
                break;
        }
    }

    _incidentDate = "";
    validDate = false;
    validDateWarning = false;
    dateWarningText = "";
    dateValidationBlur(event) {
        const eventField = event.currentTarget;
        let inputDate = this._incidentDate;
        let inputTime = "00:00:00";
        const dateNow = new Date();
        const dateTimeNow = dateNow.getTime();
        this.validDate = false;
        if (!eventField.checkValidity()) {
            this.dateWarningText = "Invalid Date format";
            this.validDateWarning = true;
        } else {
            this.validDateWarning = false;
            const dateInputParse = Date.parse(inputDate + ' ' + inputTime);
            if (dateInputParse > dateTimeNow) {
                this.dateWarningText = "Cannot be future Date";
                this.validDateWarning = true;
                this.validTimeWarning = false;
            } else {
                this.wellBeingIncidentFormValues.incidentDate = inputDate + ' ' + inputTime;
                this.validDate = true;
                this.validDateWarning = false;
            }
        }

        if (this.validDateWarning) {
            eventField.classList.add("slds-has-error");
        } else {
            eventField.classList.remove("slds-has-error");
        }
    }

    get showAttachDocumentName() {
        return this.attachDocuments.length !== 0;
    }

    get showAttachDocumentExcludeName() {
        return this.attachDocumentsExclude.length !== 0;
    }

    acceptedExtensionTypes = ".csv, .doc, .docx, .jpg, .jpeg, .pdf, .png, .txt, .xls, .xlsx"; //[".csv", ".doc", ".docx", ".jpg", ".jpeg", ".pdf", ".png", ".txt", ".xls", ".xlsx"];
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
        let attachDocumentsUploadResults = await attachDocumentsUpload(uploadedFiles, this.acceptedExtensionTypes, this.acceptedMimeTypes,
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

    submittedUrl() {
        this.searchParamsUrl = new URL(this.tellSomeoneParamsUrl);
        this.searchParamsUrl.searchParams.set("submitted", "true");
        return this.searchParamsUrl;
    }

    saveDocumentsFail = false;
    submitWellBeingFormFail = false;
    attachDocumentResponse = {
        Status: "",
        SupportingDocumentUrl: "",
        SupportingDocumentId: ""
    }
    formReportNumber = "";

    async submitFormHandler(event) {
        const eventField = event.currentTarget;
        this.saveDocumentsFail = false;
        this.submitWellBeingFormFail = false;

        this.handleShowSpinner();

        if (this.attachDocuments.length > 0) {
            const supportingDocumentName = 'Advocate Well Being Incident';
            try {
                await saveSupportingDocuments({ attachedDocumentsList: this.attachDocuments, supportingDocumentName: supportingDocumentName}).then((result) => {

                    if (result.Status === 'success') {
                        if (result.Status === 'success') {
                            this.attachDocumentResponse = {
                                Status: result.Status,
                                SupportingDocumentUrl: result.Url,
                                SupportingDocumentId: result.SupportingDocumentId
                            }

                            this.wellBeingIncidentFormValues.salesforce_support_documents = result.Url;
                        } else if (result.Status === 'error') {
                            this.saveDocumentsFail = true;
                        }
                    }
                })
            } catch (e) {
                console.log("Save documents error: " + JSON.stringify(e));
                this.saveDocumentsFail = true;
            }
        }

        if (!this.saveDocumentsFail) {
            try {
                let formValues = JSON.stringify(this.wellBeingIncidentFormValues);
                let formType = 'wellbeing'
                await submitForm({formValues: formValues, formType: formType}).then((result) => {
                    // console.log('This all result: '+JSON.stringify(result));

                    if (result[0] !== 201) {
                        this.submitWellBeingFormFail = true;
                        console.log('This result ERROR getStatusCode: '+result[0]);
                    }

                    this.formReportNumber = result[1].reportNumber;
                    // console.log('Report Number: '+this.formReportNumber);
                });

            } catch (error) {
                this.submitWellBeingFormFail = true;
            }
        }

        if (!this.saveDocumentsFail && !this.submitWellBeingFormFail && this.attachDocumentResponse.SupportingDocumentUrl) {
            try {
                await updateSupportingDocument( {supportingDocumentId: this.attachDocumentResponse.SupportingDocumentId, advocateReportNumber: this.formReportNumber} ).then((result) => {
                    // console.log("Update Status: "+result);
                });
            } catch (e) {
                console.log("updateSupportingDocument error: " + JSON.stringify(e));
            }
        }

        // const hideSpinnerEvent = new CustomEvent('hidespinner');
        if (this.saveDocumentsFail || this.submitWellBeingFormFail) {
            this.handleHideSpinner();
            eventField.scrollIntoView({
                behavior: 'smooth',
            });
        } else {
            this.handleHideSpinner();
            // console.log("Update submittedUrl: "+this.submittedUrl());
            location.replace(this.submittedUrl());
        }

    }

}