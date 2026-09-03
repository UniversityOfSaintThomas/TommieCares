/**
 * Created: 09/02/2026:
 * This LWC is a child component in tellSomeoneLwc.
 */

import {api, LightningElement, track, wire} from 'lwc';
import biasReportingFormOptions from "@salesforce/apex/TellSomeoneLwcController.getBiasIncidentOptions";
import submitBiasIncidentReportForm from "@salesforce/apex/TellSomeoneLwcController.submitBiasIncidentReportForm";
import {emailValidation, attachDocumentsUpload, attachedDocumentsSave, finalizeSupportingDocument} from "c/tellSomeoneUtilJs";

export default class TellSomeoneBiasIncidentReportLwc extends LightningElement {
    //From parent component
    @api tellSomeoneReportType = "";
    @api tellSomeoneReporterFirstName = "";
    @api tellSomeoneReporterLastName = "";
    @api tellSomeoneReporterEmail = "";
    @api tellSomeoneConcernWhoValue = "";
    @api tellSomeoneParamsUrl = "";

    @track reporterTypeOptions = [];
    @track protectedClassesOptions = [];
    @track affiliationOfTargetOptions = [];
    @track affiliationOfPersonEngagedInHarmOptions = [];

    // reporterType; //Using variable to hold value for form because can't pass to API reporterType
    reporter_type_custom; //Using variable to hold value for form because can't pass to API reporterType
    @track biasIncidentFormValues = {
        reporter_type: "", //I am a
        // reporter_type_custom: "", //Using because can't pass to API reporterType
        reporterName: "", //Your Name
        reporterPhone: "", //Phone Number
        reporterEmail: "", //Your Email Address
        incidentDate: "", //Date/Time of Incident
        incident_location: "", //Location of Incident
        individuals_involved: "", //Students Involved
        who_was_harmed: "", //Who was harmed
        affiliation_of_harmed_party: "",  //Affiliation of Harmed Party - picklist
        who_caused_the_harm: "", //Who caused the harm
        affiliation_of_person_who_caused_harm: "", //Affiliation of Person Who Caused Harm - picklist
        description: "", //Incident Description
        // incidentType: "12", //required
        // additionalLocation: "1", //required
        // emsCalled: false, //required
        // residentialHallStaffCalled: false, //required
        // policeCalled: false, //required
        // alcohol: false, //required
        // salesforce_support_documents: "" //For Supporting Documents record ID REMOVING FOR NOW WAITING FOR NEW FIELD
    }

    get showFormAll() {
        return !!this.reporter_type_custom; //Using because can't pass to API reporterType
    }

    get isAnonymous() {
        return this.tellSomeoneReportType === "Anonymous";
    }

    get isNotAnonymous() {
        return !this.isAnonymous;
    }

    get submitDisable() {
        return !(!!this.reporter_type_custom && this.validDateTime && !!this.biasIncidentFormValues.description &&
            !!this.biasIncidentFormValues.incident_location && !!this.biasIncidentFormValues.individuals_involved && !!this.biasIncidentFormValues.who_was_harmed &&
            !!this.biasIncidentFormValues.affiliation_of_harmed_party && !!this.biasIncidentFormValues.who_caused_the_harm && !!this.biasIncidentFormValues.affiliation_of_person_who_caused_harm &&
            (this.isAnonymous || (!!this.biasIncidentFormValues.reporterName && this.validEmail && !!this.biasIncidentFormValues.reporterEmail)));
    }

    rendered = false;
    dateFieldElement;
    timeFieldElement;
    renderedCallback() {
        if(!this.rendered) {
            this.biasIncidentFormValues.reporterName = this.tellSomeoneReporterFirstName ? this.tellSomeoneReporterFirstName + " " + this.tellSomeoneReporterLastName : "";
            if (this.tellSomeoneReporterEmail) {
                let emailValidationResults = emailValidation(this.tellSomeoneReporterEmail);
                this.biasIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
            }
            this.rendered = !this.rendered;
        }
        this.dateFieldElement = this.template.querySelector("[data-inputtype='date']");
        this.timeFieldElement = this.template.querySelector("[data-inputtype='time']");
    }

    @wire(biasReportingFormOptions, {})
    biasReportingFormOptionsWire({error, data}) {
        let _reporterTypeOptions = [];
        let _affiliationTargetOptions = [];
        let _affiliationPersonEngagedHarmOptions = [];
        if (data) {
            if (data.reporterType) {
                let _reporterTypeData = JSON.parse(data.reporterType);
                _reporterTypeData.forEach((options) => {
                    _reporterTypeOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })

                this.reporterTypeOptions = _reporterTypeOptions;
                if (this.reporterTypeOptions.length > 0 && this.tellSomeoneReportType && (!this.reporter_type_custom || !this.biasIncidentFormValues.reporter_type)) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.tellSomeoneReportType.toLowerCase())) {
                            this.biasIncidentFormValues.reporter_type = this.reporterTypeOptions[i].value;
                            this.reporter_type_custom = this.reporterTypeOptions[i].label;
                            break;
                        } else {
                            let otherType = _reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                this.biasIncidentFormValues.reporter_type = otherType.value;
                                this.reporter_type_custom = otherType.label;
                            }
                        }
                    }
                }
            }

            if (data.affiliationOfHarmedParty) {
                let _affiliationOfHarmedPartyData = JSON.parse(data.affiliationOfHarmedParty);
                _affiliationOfHarmedPartyData.forEach((options) => {
                    _affiliationTargetOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.affiliationOfTargetOptions = _affiliationTargetOptions;
                if (this.affiliationOfTargetOptions.length > 0 && this.tellSomeoneConcernWhoValue) {
                    for (let i = 0; i < this.affiliationOfTargetOptions.length; i++) {
                        if (this.affiliationOfTargetOptions[i].label.toLowerCase().includes(this.tellSomeoneConcernWhoValue.toLowerCase())) {
                            this.biasIncidentFormValues.affiliation_of_harmed_party = this.affiliationOfTargetOptions[i].value;
                            break;
                        }
                    }
                }
            }

            if (data.affiliationOfThePersonWhoCausedHarm) {
                let _affiliationOfThePersonWhoCausedHarmData = JSON.parse(data.affiliationOfThePersonWhoCausedHarm);
                _affiliationOfThePersonWhoCausedHarmData.forEach((options) => {
                    _affiliationPersonEngagedHarmOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.affiliationOfPersonEngagedInHarmOptions = _affiliationPersonEngagedHarmOptions;
            }
        }

        if (error) {
            console.log("biasReportingFormOptionsWire error: "+JSON.stringify(error));
        }
    }

    selectValueHandler(event) {
        let eventValue = event.detail.value;
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.selecttype) {
            // case "reportertype":
            //     this.biasIncidentFormValues.reporter_type = eventValue;
            //     // eslint-disable-next-line no-case-declarations
            //     let reporterTypeLabel = this.reporterTypeOptions.find((typeOption) => typeOption.value === eventValue);
            //     this.reporter_type_custom = reporterTypeLabel.label;
            //     break;
            case "affiliationharmed":
                this.biasIncidentFormValues.affiliation_of_harmed_party = eventValue;
                break;
            case "affiliationcausedharm":
                this.biasIncidentFormValues.affiliation_of_person_who_caused_harm = eventValue;
                break;
        }
    }

    inputValueHandler(event) {
        let eventField = event.target;
        let eventValue = event.detail.value;
        // eslint-disable-next-line default-case
        switch (event.currentTarget.dataset.inputtype) {
            case "name":
                this.biasIncidentFormValues.reporterName = eventValue;
                break;
            case "phone":
                this.biasIncidentFormValues.reporterPhone = eventValue;
                break;
            case "email":
                if (!eventValue) {
                    this.validEmailWarning = false;
                    this.validEmail = true;
                } else {
                    this.validEmail = false;
                }
                break;
            case "date":
                if (eventValue) {
                    this._incidentDate = eventValue;
                } else {
                    this._incidentDate = "";
                }
                break;
            case "time":
                if (eventValue) {
                    this._incidentTime = eventValue;
                } else {
                    this._incidentTime = "";
                }
                break;
            case "location":
                this.biasIncidentFormValues.incident_location = eventValue;
                break;
            case "studentsinvolved":
                this.biasIncidentFormValues.individuals_involved = eventValue;
                break;
            case "whoharmed":
                this.biasIncidentFormValues.who_was_harmed = eventValue;
                break;
            case "whocausedharm":
                this.biasIncidentFormValues.who_caused_the_harm = eventValue;
                break;
            case "description":
                this.biasIncidentFormValues.description = eventValue;
                break;
        }
    }

    validEmail = true;
    validEmailWarning = false;
    emailValidationBlur(event) {
        const emailField = event.currentTarget;
        const emailAddress = event.target.value;
        let emailValidationResults = emailValidation(emailAddress);

        this.biasIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
        this.validEmail = emailValidationResults.validEmail;
        this.validEmailWarning = emailValidationResults.validEmailWarning;

        if (this.validEmailWarning) {
            emailField.classList.add("slds-has-error");
        } else {
            emailField.classList.remove("slds-has-error");
        }
    }

    _incidentDate = "";
    _incidentTime = "";
    validDateTime = false;
    validDateWarning = false;
    validTimeWarning = false;
    dateWarningText = "";
    timeWarningText = "";
    dateValidationBlur(event) {
        // const dateTimeDataType = event.currentTarget.dataset.inputtype;
        let inputDate = this._incidentDate;
        let inputTime = "00:00:00";
        const dateNow = new Date();
        const dateTimeNow = dateNow.getTime();
        this.validDateTime = false;
        if (!this.dateFieldElement.checkValidity() || !this.timeFieldElement.checkValidity()) {
            if (!this.dateFieldElement.checkValidity()) {
                this.dateWarningText = "Invalid Date format";
                this.validDateWarning = true;
            } else {
                this.validDateWarning = false;
            }
            if (!this.timeFieldElement.checkValidity()) {
                this.timeWarningText = "Invalid Time format";
                this.validTimeWarning = true;
            } else {
                this.validTimeWarning = false;
            }
        } else {
            if (!this._incidentDate) {
                this.dateWarningText = "Date cannot be blank";
                this.validDateWarning = true;
                this.validTimeWarning = false;
            } else {
                if (this._incidentTime) {
                    const findMilliseconds = this._incidentTime.search(/[.]/);
                    inputTime = this._incidentTime.slice(0, findMilliseconds);
                }
                const dateInputParse = Date.parse(inputDate + ' ' + inputTime);
                if (dateInputParse > dateTimeNow) {
                    if (!this._incidentTime) {
                        this.dateWarningText = "Cannot be future Date";
                        this.validDateWarning = true;
                        this.validTimeWarning = false;
                    } else {
                        this.timeWarningText = "Cannot be future Time";
                        this.validTimeWarning = true;
                        this.validDateWarning = true;
                    }
                } else {
                    this.biasIncidentFormValues.incidentDate = inputDate + ' ' + inputTime;
                    this.validDateTime = true;
                    this.validDateWarning = false;
                    this.validTimeWarning = false;
                }
            }

            if (this.validDateWarning) {
                this.dateFieldElement.classList.add("slds-has-error");
            } else {
                this.dateFieldElement.classList.remove("slds-has-error");
            }

            if (this.validTimeWarning) {
                this.timeFieldElement.classList.add("slds-has-error");
            } else {
                this.timeFieldElement.classList.remove("slds-has-error");
            }
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
        if (this.submitBiasIncidentFormFail) {
            this.searchParamsUrl.searchParams.set("submitvalid", "false");
        }
        if (this.saveDocumentsFail) {
            this.searchParamsUrl.searchParams.set("nodocument", "true");
        }
        return this.searchParamsUrl;
    }

    showSpinner = false;
    saveDocumentsFail = false;
    submitBiasIncidentFormFail = false;
    async submitFormHandler(event) {
        const eventField = event.currentTarget;
        this.saveDocumentsFail = false;
        this.submitBiasIncidentFormFail = false;
        let attachDocumentResponse = {
            Status: "",
            SupportingDocumentUrl: "",
            SupportingDocumentId: ""
        }
        let formReportNumber = "";

        this.showSpinner = true;

        if (this.attachDocuments.length > 0) {
            try {
                this.saveDocumentsFail = await attachedDocumentsSave(this.attachDocuments, 'Advocate Bias Incident', attachDocumentResponse);
                // this.biasIncidentFormValues.salesforce_support_documents = attachDocumentResponse.SupportingDocumentUrl; //REMOVING FOR NOW WAITING FOR NEW FIELD
                console.log('attachDocumentResponse: ', JSON.stringify(attachDocumentResponse));
                console.log('this.biasIncidentFormValues: ', JSON.stringify(this.biasIncidentFormValues));
            } catch (error) {
                this.saveDocumentsFail = true;
                console.error('Error saving attached documents:', error);
            }
        }

        try {
            console.log('formValues: ', JSON.stringify(this.biasIncidentFormValues));
            formReportNumber = await submitBiasIncidentReportForm({formValues: this.biasIncidentFormValues});
            this.submitBiasIncidentFormFail = !formReportNumber;
            console.log('formReportNumber: ', formReportNumber);
        } catch (error) {
            this.submitBiasIncidentFormFail = true;
            console.error('Error submitting titleIx form:', error);
        }

        /*START TEST INPUTS*/
// formReportNumber = "Test0987";
// this.submitBiasIncidentFormFail = !formReportNumber;
// this.saveDocumentsFail = true;
        /*END TEST INPUTS*/

        try {
            await finalizeSupportingDocument(this.saveDocumentsFail, this.submitBiasIncidentFormFail, attachDocumentResponse, formReportNumber);
            // eslint-disable-next-line no-restricted-globals
            location.replace(this.submittedUrl());
        } catch (error) {
            console.error('Error finalizing supporting document:', error);
        } finally {
            this.showSpinner = false;
        }
    }

}