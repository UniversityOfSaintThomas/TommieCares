/**
 * Created by nguy0092 on 8/21/2026.
 */

import {api, LightningElement, track, wire} from 'lwc';
import biasReportingFormOptions1 from "@salesforce/apexContinuation/CommunityOfConcernLwcController.incidentReportingFormOptions1";
import biasReportingFormOptions2 from "@salesforce/apexContinuation/CommunityOfConcernLwcController.incidentReportingFormOptions2";
import saveSupportingDocuments from "@salesforce/apex/CommunityOfConcernLwcController.saveSupportingDocuments";
import updateSupportingDocument from "@salesforce/apex/CommunityOfConcernLwcController.updateSupportingDocument";
import submitForm from "@salesforce/apexContinuation/CommunityOfConcernLwcController.submitForm";
import {emailValidation, attachDocumentsUpload} from "c/communityOfConcernUtilJs";

export default class TellSomeoneBiasIncidentReport extends LightningElement {
    @api tellSomeoneReportType = "Faculty";
    @api tellSomeoneReporterFirstName = "Test";
    @api tellSomeoneReporterLastName = "Tester";
    @api tellSomeoneReporterEmail = "test@tester.com";
    @api tellSomeoneParamsUrl = "";

    @track reporterTypeOptions = [];
    @track protectedClassesOptions = [];
    @track affiliationOfTargetOptions = [];
    @track affiliationOfPersonEngagedInHarmOptions = [];

    reporterType; //Using variable to hold value for form because can't pass to API reporterType
    @track biasIncidentFormValues = {
        // reporterType: "", //I am a
        reporter_type_custom: "", //Using because can't pass to API reporterType
        reporterName: "", //Your Name
        reporterPhone: "", //Phone Number
        reporterEmail: "", //Your Email Address
        incidentDate: "", //Date/Time of Incident
        additionalInformation: "", //Location of Incident
        otherStudent: "", //Students Involved
        who_was_the_target_of_the_behavior: "", //Who was harmed
        affiliation_of_target: "",  //Affiliation of Harmed Party - picklist
        who_engaged_in_the_behavior: "", //Who caused the harm
        affiliation_of_person_engaged_in_harm: "", //Affiliation of Person Who Caused Harm - picklist
        description: "", //Incident Description
        incidentType: "12", //required
        additionalLocation: "1", //required
        emsCalled: false, //required
        residentialHallStaffCalled: false, //required
        policeCalled: false, //required
        alcohol: false, //required
        salesforce_support_documents: "" //For Supporting Documents record ID
    }

    get showFormAll() {
        return !!this.biasIncidentFormValues.reporter_type_custom; //Using because can't pass to API reporterType
    }

    get isAnonymous() {
        return this.tellSomeoneReportType === "Anonymous";
    }

    get isNotAnonymous() {
        return !this.isAnonymous;
    }

    get submitDisable() {
        return !(!!this.biasIncidentFormValues.reporter_type_custom && this.validDateTime && !!this.biasIncidentFormValues.description &&
            !!this.biasIncidentFormValues.additionalInformation && !!this.biasIncidentFormValues.otherStudent && !!this.biasIncidentFormValues.who_was_the_target_of_the_behavior &&
            !!this.biasIncidentFormValues.affiliation_of_target && !!this.biasIncidentFormValues.who_engaged_in_the_behavior && !!this.biasIncidentFormValues.affiliation_of_person_engaged_in_harm &&
            (this.isAnonymous || (!!this.biasIncidentFormValues.reporterName && this.validEmail && !!this.biasIncidentFormValues.reporterEmail)));
    }

    rendered = false;
    dateFieldElement;
    timeFieldElement;
    renderedCallback() {
        if(!this.rendered) {
            this.biasIncidentFormValues.reporterName = !!this.tellSomeoneReporterFirstName ? this.tellSomeoneReporterFirstName + " " + this.tellSomeoneReporterLastName : "";
            if (this.tellSomeoneReporterEmail) {
                let emailValidationResults = emailValidation(this.tellSomeoneReporterEmail);
                this.biasIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
            }
            this.rendered = !this.rendered;
        }
        this.dateFieldElement = this.template.querySelector("[data-inputtype='date']");
        this.timeFieldElement = this.template.querySelector("[data-inputtype='time']");
    }

    @wire(biasReportingFormOptions1, {})
    biasReportingFormOptions1Wire({error, data}) {
        let recordOptions = [];
        let _reporterTypeOptions = [];
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
                if (this.reporterTypeOptions.length > 0 && this.tellSomeoneReportType && !this.biasIncidentFormValues.reporter_type_custom) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.tellSomeoneReportType.toLowerCase())) {
                            this.reporterType = this.reporterTypeOptions[i].value;
                            this.biasIncidentFormValues.reporter_type_custom = this.reporterTypeOptions[i].label;
                            break;
                        } else {
                            let otherType = _reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                this.reporterType = otherType.value;
                                this.biasIncidentFormValues.reporter_type_custom = otherType.label;
                            }
                        }
                    }
                }
            }
        }

        if (error) {
            console.log("biasReportingFormOptions1Wire error: "+JSON.stringify(error));
        }
    }

    @wire(biasReportingFormOptions2, {})
    biasReportingFormOptions2Wire({error, data}) {
        let recordOptions = [];
        let affiliationTargetOptions = [];
        let affiliationPersonEngagedHarmOptions = [];
        if (data) {
            data.forEach((o) => {
                recordOptions.push(JSON.parse(o));
            })

            if (recordOptions[0]) {
                recordOptions[0].forEach((options) => {
                    affiliationTargetOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.affiliationOfTargetOptions = affiliationTargetOptions;
            }

            if (recordOptions[1]) {
                recordOptions[1].forEach((options) => {
                    affiliationPersonEngagedHarmOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.affiliationOfPersonEngagedInHarmOptions = affiliationPersonEngagedHarmOptions;
            }
        }

        if (error) {
            console.log("biasReportingFormOptions2Wire error: "+JSON.stringify(error));
        }
    }

    selectValueHandler(event) {
        let eventValue = event.detail.value;
        switch (event.currentTarget.dataset.selecttype) {
            case "reportertype":
                this.reporterType = eventValue;
                let reporterTypeLabel = this.reporterTypeOptions.find((typeOption) => typeOption.value === eventValue);
                this.biasIncidentFormValues.reporter_type_custom = reporterTypeLabel.label;
                break;
            case "affiliationharmed":
                this.biasIncidentFormValues.affiliation_of_target = eventValue;
                break;
            case "affiliationcausedharm":
                this.biasIncidentFormValues.affiliation_of_person_engaged_in_harm = eventValue;
                break;
        }
    }

    inputValueHandler(event) {
        let eventField = event.target;
        let eventValue = event.detail.value;
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
                this.biasIncidentFormValues.additionalInformation = eventValue;
                break;
            case "studentsinvolved":
                this.biasIncidentFormValues.otherStudent = eventValue;
                break;
            case "whoharmed":
                this.biasIncidentFormValues.who_was_the_target_of_the_behavior = eventValue;
                break;
            case "whocausedharm":
                this.biasIncidentFormValues.who_engaged_in_the_behavior = eventValue;
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
        const dateTimeDataType = event.currentTarget.dataset.inputtype;
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
    submitBiasIncidentFormFail = false;
    attachDocumentResponse = {
        Status: "",
        SupportingDocumentUrl: "",
        SupportingDocumentId: ""
    }
    formReportNumber = "";

    async submitFormHandler(event) {
        const eventField = event.currentTarget;
        this.saveDocumentsFail = false;
        this.submitBiasIncidentFormFail = false;

        this.handleShowSpinner();

        if (this.attachDocuments.length > 0) {
            const supportingDocumentName = 'Advocate Bias Incident';
            try {
                await saveSupportingDocuments({attachedDocumentsList: this.attachDocuments, supportingDocumentName: supportingDocumentName}).then((result) => {

                    if (result.Status === 'success') {
                        this.attachDocumentResponse = {
                            Status: result.Status,
                            SupportingDocumentUrl: result.Url,
                            SupportingDocumentId: result.SupportingDocumentId
                        }

                        this.biasIncidentFormValues.salesforce_support_documents = this.attachDocumentResponse.SupportingDocumentUrl;
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
                let formValues = JSON.stringify(this.biasIncidentFormValues);
                let formType = 'bias';
                await submitForm({formValues: formValues, formType: formType}).then((result) => {
                    // console.log('This all result: '+JSON.stringify(result));

                    if (result[0] !== 201) {
                        this.submitBiasIncidentFormFail = true;
                        console.log('This result ERROR getStatusCode: '+result[0]);
                    }

                    this.formReportNumber = result[1].reportNumber;
                    // console.log('Report Number: '+this.formReportNumber);
                });

            } catch (error) {
                this.submitBiasIncidentFormFail = true;
            }
        }

        if (!this.saveDocumentsFail && !this.submitBiasIncidentFormFail && this.attachDocumentResponse.SupportingDocumentUrl) {
            try {
                await updateSupportingDocument( {supportingDocumentId: this.attachDocumentResponse.SupportingDocumentId, advocateReportNumber: this.formReportNumber} ).then((result) => {
                    // console.log("Update Status: "+result);
                });
            } catch (e) {
                console.log("updateSupportingDocument error: " + JSON.stringify(e));
            }
        }

        if (this.saveDocumentsFail || this.submitBiasIncidentFormFail) {
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