/**
 * Created by nguy0092 on 8/18/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import wellBeingReportingFormOptions from "@salesforce/apexContinuation/AdvocateWellBeingIncidentReprtController.wellBeingReportingFormOptions";
import saveSupportingDocuments from "@salesforce/apex/CommunityOfConcernLwcController.saveSupportingDocuments";
// import saveSupportingDocuments from "@salesforce/apex/AdvocateWellBeingIncidentReprtController.saveSupportingDocuments";
import {emailValidation, attachDocumentsUpload} from "c/communityOfConcernUtilJs";

export default class AdvocateWellBeingIncidentReportLwc extends LightningElement {
    @api communityOfConcernReportType = "";
    @api communityOfConcernReporterFirstName = "";
    @api communityOfConcernReporterLastName = "";
    @api communityOfConcernReporterEmail = "";
    @api communityOfConcernParamsUrl = "";

    @track reporterTypeOptions = [];

    get showFormAll() {
        return !!this.wellBeingIncidentFormValues.reporterType;
    }
    get isAnonymous() {
        return this.communityOfConcernReportType === "Anonymous";
    }
    get isNotAnonymous() {
        return !this.isAnonymous;
    }

    @track wellBeingIncidentFormValues = {
        reporterType: "",
        reporterName: "",
        reporterEmail: "",
        reporterPhone: "",
        student: "", //This is lookup field so check on actual Symplicity field
        student_email: "", //This is a temp field so check on actual Symplicity field
        student_phone: "", //This is a temp field so check on actual Symplicity field
        // studentGroup: "",
        // otherStudent: "",
        // witness: "",
        // otherWitness: "",
        description: "",
        incidentType: "14", //required
        additionalLocation: "1", //required
        emsCalled: false, //required
        residentialHallStaffCalled: false, //required
        policeCalled: false, //required
        alcohol: false, //required
        custom_field_1: "" //temporarily using this field for Supporting Documents record ID
    }

    rendered = false;
    renderedCallback() {
        if(!this.rendered) {
            this.wellBeingIncidentFormValues.reporterName = !!this.communityOfConcernReporterFirstName ? this.communityOfConcernReporterFirstName + " " + this.communityOfConcernReporterLastName : "";
            if (this.communityOfConcernReporterEmail) {
                let emailValidationResults = emailValidation(this.communityOfConcernReporterEmail);
                this.wellBeingIncidentFormValues.reporterEmail = emailValidationResults.emailAddress;
            }
            this.rendered = !this.rendered;
        }
    }

    @wire(wellBeingReportingFormOptions, {})
    wellBeingReportingFormOptionsWire({error, data}) {
        let recordOptions = [];
        let reporterTypeOptions = [];
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
                if (this.reporterTypeOptions.length > 0 && this.communityOfConcernReportType && !this.wellBeingIncidentFormValues.reporterType) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.communityOfConcernReportType.toLowerCase())) {
                            this.wellBeingIncidentFormValues.reporterType = this.reporterTypeOptions[i].value;
                            break;
                        } else {
                            let otherType = reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                this.wellBeingIncidentFormValues.reporterType = otherType.value;
                            }
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
        console.log("select value: "+event.detail.value);
        let eventValue = event.detail.value;
        switch (event.currentTarget.dataset.selecttype) {
            case "reportertype":
                this.wellBeingIncidentFormValues.reporterType = eventValue;
                break;
        }
        console.log("wellBeingIncidentFormValues value: "+JSON.stringify(this.wellBeingIncidentFormValues));
    }

    inputValueHandler(event) {
        console.log("input value: "+event.detail.value);
        let eventField = event.target;
        let eventValue = event.detail.value;
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
                this.wellBeingIncidentFormValues.student = eventValue;
                break;
            case "involvedemail":
                this.wellBeingIncidentFormValues.student_email = eventValue;
                if (!eventValue) {
                    this.validEmailWarningIndividual = false;
                    this.validEmailIndividual = true;
                } else {
                    this.validEmailIndividual = false;
                }
                break;
            case "involvedphone":
                this.wellBeingIncidentFormValues.student_phone = eventValue;
                break;
            case "date":
                if (eventValue) {
                    this._incidentDate = eventValue;
                } else {
                    this._incidentDate = "";
                }
                console.log("Date: "+this._incidentDate);
                break;
            case "description":
                this.wellBeingIncidentFormValues.description = eventValue;
                break;
        }
        console.log("wellBeingIncidentFormValues2 value: "+JSON.stringify(this.wellBeingIncidentFormValues));
    }

    validEmail = true;
    validEmailWarning = false;
    validEmailIndividual = true;
    validEmailWarningIndividual = false;
    emailValidationBlur(event) {
        const emailField = event.currentTarget;
        const emailAddress = event.target.value;
        let emailValidationResults = emailValidation(emailAddress);

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
                this.wellBeingIncidentFormValues.student_email = emailValidationResults.emailAddress;
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
        console.log("date validity: "+eventField.checkValidity());
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

    submitFormSpinner = false;
    saveDocumentsFail = false;
    submitBiasIncidentFormFail = false;
    showUrl = false;
    returnUrl;
    async submitFormHandler(event) {
        const eventField = event.currentTarget;
        this.saveDocumentsFail = false;
        this.submitBiasIncidentFormFail = false;
        console.log("This Time: "+JSON.stringify(this.attachDocuments))
        console.log("All File: " + JSON.stringify(this.wellBeingIncidentFormValues));
        let formValues = JSON.stringify(this.wellBeingIncidentFormValues);

        // window.scrollTo(0,0);
        // this.submitFormSpinner = true;

        try {
        const supportingDocumentName = 'Advocate Well Being Incident';
        await saveSupportingDocuments({attachedDocumentsList: this.attachDocuments, supportingDocumentName: supportingDocumentName}).then((result) => {
        // await saveSupportingDocuments( {attachedDocumentsList: this.attachDocuments}).then((result) => {
            console.log(JSON.stringify(result));

            if (result.Status === 'success') {
                // this.biasIncidentFormValues.custom_field_1 = result.Url;

                //Used for testing
                this.returnUrl = result.Url;
                this.showUrl = true;
            } else if (result.Status === 'error') {
                this.saveDocumentsFail = true;
            }
        })
        } catch (e) {
            console.log("Save documents error: " + JSON.stringify(e));
            this.saveDocumentsFail = true;
        }

        // try {
        //     delete this.titleIxIncidentFormValues.reporterType //USED JUST FOR TESTING BECAUSE GETTING reporteType FIELD DOES NOT EXIST ON POST RESPONSE
        //     let formValues = JSON.stringify(this.titleIxIncidentFormValues);
        //     let postTitleIxReportResults = await submitForm({formValues: formValues});
        //     console.log("imperativeContinuation results: "+JSON.stringify(postTitleIxReportResults));
        //     this.error = undefined;
        // } catch (error) {
        //     this.error = error;
        // }
    }
}