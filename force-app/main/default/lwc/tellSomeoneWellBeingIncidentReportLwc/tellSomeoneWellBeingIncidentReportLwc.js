/**
 * Created: 09/02/2026:
 * This LWC is a child component in tellSomeoneLwc, tommieAlertsLwc, tommieAlertsAdvisingStudentSupportLwc.
 */

import {api, LightningElement, track, wire} from 'lwc';
import wellBeingReportingFormOptions from "@salesforce/apex/TellSomeoneLwcController.getWellBeingOptions";
import submitWellBeingReportForm from "@salesforce/apex/TellSomeoneLwcController.submitWellBeingReportForm";
import {emailValidation, attachDocumentsUpload, attachedDocumentsSave, finalizeSupportingDocument} from "c/tellSomeoneUtilJs";

export default class TellSomeoneWellBeingIncidentReportLwc extends LightningElement {
    //From parent component
    @api tellSomeoneReportType = "";
    @api tellSomeoneReporterFirstName = "";
    @api tellSomeoneReporterLastName = "";
    @api tellSomeoneReporterEmail = "";
    @api tellSomeoneConcernWhoValue = "";
    @api tellSomeoneParamsUrl = "";
    @api tommieAlertsReporterPhone = ""; //used for Tommie Alert Submission
    @api tommieAlertsStudentName = "";
    @api tommieAlertsStudentEmail = "";
    @api tommieAlertsForm = false;

    @api get formToTommieAlerts() {
        return this.wellBeingIncidentFormValues;
    }
    @api get documentsToTommieAlerts() {
        return this.attachDocuments;
    }

    @track reporterTypeOptions = [];
    @track whoAreYouConcernedAboutOptions = [];

    // reporterType; //Using variable to hold value for form because can't pass to API reporterType
    reporter_type_custom; //Using variable to hold value for form because can't pass to API reporterType
    @track wellBeingIncidentFormValues = {
        reporter_type: "", //done
        reporterName: "", //done
        reporterEmail: "", //done
        reporterPhone: "", //done
        affiliation_of_the_person_of_concern: "", //This is a custom field
        students_first_name: "",
        students_email_address: "", //This is a custom field
        students_phone_number: "", //This is a custom field
        date_of_concerning_incident: "",
        description: "",
        // salesforce_support_documents: "" //For Supporting Documents record ID REMOVING FOR NOW UNTIL I GET NEW FIELD
    }

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

    get tommieAlertsDisableStudentEmail() {
        return this.tommieAlertsDisable && !this.individualInfoRevealed;
    }

    get showIndividualInfo() {
        return !this.tommieAlertsForm || this.individualInfoRevealed;
    }

    get showFormAll() {
        return !!this.reporter_type_custom;
    }

    get isAnonymous() {
        return this.tellSomeoneReportType === "Anonymous";
    }

    get isNotAnonymous() {
        return !this.isAnonymous;
    }

    get submitDisable() {
        return !(!!this.reporter_type_custom && this.validDate && !!this.wellBeingIncidentFormValues.description && !!this.wellBeingIncidentFormValues.students_first_name &&
            (this.isAnonymous || (!!this.wellBeingIncidentFormValues.reporterName && !!this.wellBeingIncidentFormValues.reporterPhone && this.validEmail && this.validEmailIndividual && !!this.wellBeingIncidentFormValues.reporterEmail)));
    }

    rendered = false;
    reporterEmailValidated = false;
    studentEmailValidated = false;
    renderedCallback() {
        if(!this.rendered) {
            this.wellBeingIncidentFormValues.reporterName = this.tellSomeoneReporterFirstName ? this.tellSomeoneReporterFirstName + " " + this.tellSomeoneReporterLastName : "";
            this.wellBeingIncidentFormValues.reporterPhone = this.tommieAlertsReporterPhone;
            this.wellBeingIncidentFormValues.students_first_name = this.tommieAlertsStudentName;
            this.rendered = true;
        }

        if (!this.reporterEmailValidated && this.tellSomeoneReporterEmail && this.showFormAll) {
            let reporterEmailField = this.template.querySelector('[data-inputtype="email"]');
            this.validateReporterEmail(this.tellSomeoneReporterEmail, reporterEmailField);
            this.reporterEmailValidated = true;
        }

        if (!this.studentEmailValidated && this.tommieAlertsStudentEmail && this.showFormAll) {
            let studentEmailField = this.template.querySelector('[data-inputtype="involvedemail"]');
            this.validateIndividualEmail(this.tommieAlertsStudentEmail, studentEmailField);
            this.studentEmailValidated = true;
        }
    }

    @wire(wellBeingReportingFormOptions, {})
    wellBeingReportingFormOptionsWire({error, data}) {
        let _reporterTypeOptions = [];
        let _whoAreYouConcernedAboutOptions = [];
        if (data) {
            if (data.reporterType) {
                let _reporteTypeData = JSON.parse(data.reporterType);
                _reporteTypeData.forEach((options) => {
                    _reporterTypeOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })

                this.reporterTypeOptions = _reporterTypeOptions;
                if (this.reporterTypeOptions.length > 0 && this.tellSomeoneReportType && (!this.reporter_type_custom || !this.wellBeingIncidentFormValues.reporter_type)) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.tellSomeoneReportType.toLowerCase())) {
                            this.wellBeingIncidentFormValues.reporter_type = this.reporterTypeOptions[i].value;
                            this.reporter_type_custom = this.reporterTypeOptions[i].label;
                            break;
                        } else {
                            let otherType = _reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                this.wellBeingIncidentFormValues.reporter_type = otherType.value;
                                this.reporter_type_custom = otherType.label;
                            }
                        }
                    }
                }
            }

            if (data.affiliationOfThePersonOfConcern) {
                let _affiliationOfThePersonOfConcernData = JSON.parse(data.affiliationOfThePersonOfConcern);
                _affiliationOfThePersonOfConcernData.forEach((options) => {
                    _whoAreYouConcernedAboutOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })

                this.whoAreYouConcernedAboutOptions = _whoAreYouConcernedAboutOptions;
                if (this.whoAreYouConcernedAboutOptions.length > 0 && this.tellSomeoneConcernWhoValue) {
                    for (let i = 0; i < this.whoAreYouConcernedAboutOptions.length; i++) {
                        if (this.whoAreYouConcernedAboutOptions[i].label.toLowerCase().includes(this.tellSomeoneConcernWhoValue.toLowerCase())) {
                            this.wellBeingIncidentFormValues.affiliation_of_the_person_of_concern = this.whoAreYouConcernedAboutOptions[i].value;
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

    // selectValueHandler(event) {
    //     let eventValue = event.detail.value;
    //     // eslint-disable-next-line default-case
    //     switch (event.currentTarget.dataset.selecttype) {
    //         case "reportertype":
    //             this.reporterType = eventValue;
    //             // eslint-disable-next-line no-case-declarations
    //             let reporterTypeLabel = this.reporterTypeOptions.find((typeOption) => typeOption.value === eventValue);
    //             this.reporter_type_custom = reporterTypeLabel.label;
    //             break;
    //     }
    // }

    descriptionLengthCount = 0;
    maxDescriptionCharacterLength = 20000;
    maxStandardCharacterLength = 255;
    inputValueHandler(event) {
        let eventField = event.target;
        let eventValue = event.detail.value;
        let eventValueTrim = eventValue.trim();
        // const MAX_LENGTH = 255;
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputtype) {
            case "name":
                this.wellBeingIncidentFormValues.reporterName = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "email":
                // this.wellBeingIncidentFormValues.reporterEmail = eventValueTrim;
                if (!eventValue) {
                    this.validEmailWarning = false;
                    this.validEmail = true;
                } else {
                    this.validEmail = false;
                }
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "phone":
                this.wellBeingIncidentFormValues.reporterPhone = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "involvedname":
                this.wellBeingIncidentFormValues.students_first_name = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "involvedemail":
                // this.wellBeingIncidentFormValues.students_email_address = eventValueTrim;
                if (!eventValue) {
                    this.validEmailWarningIndividual = false;
                    this.validEmailIndividual = true;
                } else {
                    this.validEmailIndividual = false;
                }
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "involvedphone":
                this.wellBeingIncidentFormValues.students_phone_number = eventValueTrim;
                this.maxlengthCheck(eventField, eventValue, this.maxStandardCharacterLength);
                break;
            case "date":
                if (eventValue) {
                    this._incidentDate = eventValue;
                } else {
                    this._incidentDate = "";
                }
                break;
            case "description":
                this.wellBeingIncidentFormValues.description = eventValueTrim;
                this.descriptionLengthCount = eventValue.length;
                this.maxlengthCheck(eventField, eventValue, this.maxDescriptionCharacterLength);
                break;
        }

        this.submitDisableToTommieAlerts();
        console.log("this.wellBeingIncidentFormValues: "+JSON.stringify(this.wellBeingIncidentFormValues));
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
    validEmailIndividual = true;
    validEmailWarningIndividual = false;
    reporterInfoRevealed = false;
    individualInfoRevealed = false;

    validateReporterEmail(emailAddress, emailField) {
        let emailValidationResults = emailValidation(emailAddress);
        this.wellBeingIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
        this.validEmail = emailValidationResults.validEmail;
        this.validEmailWarning = emailValidationResults.validEmailWarning;
        if (this.tommieAlertsForm && this.validEmailWarning) {
            this.reporterInfoRevealed = true; // only latch open when in TommieAlerts form flow
        }
        if (emailField) {
            emailField.classList.toggle("slds-has-error", this.validEmailWarning);
        }
    }

    validateIndividualEmail(emailAddress, emailField) {
        if (!emailAddress) return;
        let emailValidationResults = emailValidation(emailAddress);
        this.wellBeingIncidentFormValues.students_email_address = emailValidationResults.emailAddress;
        this.validEmailIndividual = emailValidationResults.validEmail;
        this.validEmailWarningIndividual = emailValidationResults.validEmailWarning;
        if (this.tommieAlertsForm && this.validEmailWarningIndividual) {
            this.individualInfoRevealed = true; // only latch open when in TommieAlerts form flow
        }
        if (emailField) {
            emailField.classList.toggle("slds-has-error", this.validEmailWarningIndividual);
        }
    }

    emailValidationBlur(event) {
        const emailField = event.currentTarget;
        const emailAddress = event.target.value;

        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputtype) {
            case "email":
                this.validateReporterEmail(emailAddress, emailField);
                break;
            case "involvedemail":
                if (emailAddress) {
                    this.validateIndividualEmail(emailAddress, emailField);
                }
                break;
        }
        this.submitDisableToTommieAlerts();
    }

    // validEmail = true;
    // validEmailWarning = false;
    // validEmailIndividual = true;
    // validEmailWarningIndividual = false;
    // emailValidationBlur(event) {
    //     const emailField = event.currentTarget;
    //     const emailAddress = event.target.value;
    //     let emailValidationResults = emailValidation(emailAddress);
    //
    //     // eslint-disable-next-line default-case
    //     switch (event.currentTarget.dataset.inputtype) {
    //         case "email":
    //             this.wellBeingIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
    //             this.validEmail = emailValidationResults.validEmail;
    //             this.validEmailWarning = emailValidationResults.validEmailWarning;
    //             if (this.validEmailWarning) {
    //                 emailField.classList.add("slds-has-error");
    //             } else {
    //                 emailField.classList.remove("slds-has-error");
    //             }
    //             break;
    //         case "involvedemail":
    //             if (emailAddress) {
    //                 this.wellBeingIncidentFormValues.students_email_address = emailValidationResults.emailAddress;
    //                 this.validEmailIndividual = emailValidationResults.validEmail;
    //                 this.validEmailWarningIndividual = emailValidationResults.validEmailWarning;
    //                 if (this.validEmailWarningIndividual) {
    //                     emailField.classList.add("slds-has-error");
    //                 } else {
    //                     emailField.classList.remove("slds-has-error");
    //                 }
    //             }
    //             break;
    //     }
    //     this.submitDisableToTommieAlerts();
    // }

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
                this.wellBeingIncidentFormValues.date_of_concerning_incident = inputDate;
                this.validDate = true;
                this.validDateWarning = false;
            }
        }

        if (this.validDateWarning) {
            eventField.classList.add("slds-has-error");
        } else {
            eventField.classList.remove("slds-has-error");
        }
        this.submitDisableToTommieAlerts();
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

    submittedUrl() {
        this.searchParamsUrl = new URL(this.tellSomeoneParamsUrl);
        this.searchParamsUrl.searchParams.set("submitted", "true");
        if (this.submitWellBeingFormFail) {
            this.searchParamsUrl.searchParams.set("submitvalid", "false");
        }
        if (this.saveDocumentsFail) {
            this.searchParamsUrl.searchParams.set("nodocument", "true");
        }
        return this.searchParamsUrl;
    }

    showSpinner = false;
    saveDocumentsFail = false;
    submitWellBeingFormFail = false;
    async submitFormHandler(event) {
        const eventField = event.currentTarget;
        this.saveDocumentsFail = false;
        this.submitWellBeingFormFail = false;
        let attachDocumentResponse = {
            Status: "",
            SupportingDocumentUrl: "",
            SupportingDocumentId: ""
        }
        let formReportNumber = "";

        this.showSpinner = true;

        if (this.attachDocuments.length > 0) {
            try {
                this.saveDocumentsFail = await attachedDocumentsSave(this.attachDocuments, 'Advocate Well Being Incident', attachDocumentResponse);
                // this.wellBeingIncidentFormValues.salesforce_support_documents = attachDocumentResponse.SupportingDocumentUrl; //REMOVING FOR NOW UNTIL I GET NEW FIELD
                console.log('attachDocumentResponse: ', JSON.stringify(attachDocumentResponse));
                console.log('this.wellBeingIncidentFormValues: ', JSON.stringify(this.wellBeingIncidentFormValues));
            } catch (error) {
                this.saveDocumentsFail = true;
                console.error('Error saving attached documents:', error);
            }
        }

        try {
            console.log('formValues: ', JSON.stringify(this.wellBeingIncidentFormValues));
            formReportNumber = await submitWellBeingReportForm({formValues: this.wellBeingIncidentFormValues});
            this.submitWellBeingFormFail = !formReportNumber;
            console.log('formReportNumber: ', formReportNumber);
        } catch (error) {
            this.submitWellBeingFormFail = true;
            console.error('Error submitting well-being form:', error);
        }

/*START TEST INPUTS*/
// formReportNumber = "Testing 123";
// this.submitWellBeingFormFail = !formReportNumber ;
// this.saveDocumentsFail = true;
/*END TEST INPUTS*/

        try {
            await finalizeSupportingDocument(this.saveDocumentsFail, this.submitWellBeingFormFail, attachDocumentResponse, formReportNumber);
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
        const customEvent = new CustomEvent("submitdisablewellbeing", {
            detail: { value: this.submitDisable }
        });
        this.dispatchEvent(customEvent);
    }

}