/**
 * Created by nguy0092 on 7/31/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import biasReportingFormOptions1 from "@salesforce/apexContinuation/AdvocateBiasIncidentReportController.biasReportingFormOptions1";
import biasReportingFormOptions2 from "@salesforce/apexContinuation/AdvocateBiasIncidentReportController.biasReportingFormOptions2";
import saveSupportingDocuments from "@salesforce/apex/AdvocateBiasIncidentReportController.saveSupportingDocuments";
import submitForm from "@salesforce/apexContinuation/AdvocateBiasIncidentReportController.submitForm";

export default class AdvocateBiasIncidentReportLwc extends LightningElement {
    @api communityOfConcernReportType = "";
    @api communityOfConcernName = "";
    @api communityOfConcernEmail = "";
    @api paramUrl = "";

    @track reporterTypeOptions = [];
    @track protectedClassesOptions = [];
    @track affiliationOfTargetOptions = [];
    @track affiliationOfPersonEngagedInHarmOptions = [];

    get showFormAll() {
        return !!this.biasIncidentFormValues.reporterType;
    }

    get isNotAnonymous() {
        return !(this.communityOfConcernReportType === "Anonymous");
    }

    @track biasIncidentFormValues = {
        reporterType: "", //I am a
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
        // discrimination_protected_classes: [], // Discrimination Protected Classes - multi-select
        description: "", //Incident Description
        incidentType: "12", //required
        additionalLocation: "1", //required
        emsCalled: false, //required
        residentialHallStaffCalled: false, //required
        policeCalled: false, //required
        alcohol: false, //required
        custom_field_1: "" //temporarily using this field for Supporting Documents record ID
    }

    get submitDisable() {
        return !(!!this.biasIncidentFormValues.reporterType && this.validDateTime && !!this.biasIncidentFormValues.description && this.validEmail);
    }
    dateFieldElement;
    timeFieldElement;
    rendered = false;
    renderedCallback() {
        if(!this.rendered) {
            this.biasIncidentFormValues.reporterName = !!this.communityOfConcernName ? this.communityOfConcernName : "";
            this.biasIncidentFormValues.reporterEmail = !!this.communityOfConcernEmail ? this.communityOfConcernEmail : "";
            this.rendered = !this.rendered;
        }
        this.dateFieldElement = this.template.querySelector("[data-inputtype='date']");
        this.timeFieldElement = this.template.querySelector("[data-inputtype='time']");
    }

    @wire(biasReportingFormOptions1, {})
    biasReportingFormOptions1Wire({error, data}) {
        let recordOptions = [];
        let reporterTypeOptions = [];
        let protectedClassesOptions = [];
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
                if (this.reporterTypeOptions.length > 0 && this.communityOfConcernReportType && !this.biasIncidentFormValues.reporterType) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.communityOfConcernReportType.toLowerCase())) {
                            this.biasIncidentFormValues.reporterType = this.reporterTypeOptions[i].value;
                            break;
                        } else {
                            let otherType = reporterTypeOptions.find((typeOption) => typeOption.label.toLowerCase() === 'community member');
                            if (otherType) {
                                this.biasIncidentFormValues.reporterType = otherType.value;
                            }
                        }
                    }
                }
            }

            if (recordOptions[1]) {
                recordOptions[1].forEach((options) => {
                    protectedClassesOptions.push({
                        label: options.value,
                        value: options.id.toString(),
                    })
                })
                this.protectedClassesOptions = protectedClassesOptions;
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
        console.log("select value: "+event.detail.value);
        let eventValue = event.detail.value;
        switch (event.currentTarget.dataset.selecttype) {
            case "reportertype":
                this.biasIncidentFormValues.reporterType = eventValue;
                break;
            case "affiliationharmed":
                this.biasIncidentFormValues.affiliation_of_target = eventValue;
                break;
            case "affiliationcausedharm":
                this.biasIncidentFormValues.affiliation_of_person_engaged_in_harm = eventValue;
                break;
            case "protectedclass":
                this.biasIncidentFormValues.discrimination_protected_classes = eventValue;
                break;
        }
    }

    inputValueHandler(event) {
        console.log("input value: "+event.detail.value);
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
                console.log("Date: "+this._incidentDate);
                break;
            case "time":
                if (eventValue) {
                    this._incidentTime = eventValue;
                } else {
                    this._incidentTime = "";
                }
                console.log("Time: "+this._incidentTime);
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
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (emailAddress && !(emailRegex.test(emailAddress))) {
            this.validEmail = false;
            this.validEmailWarning = true;
        } else {
            this.biasIncidentFormValues.reporterEmail = emailAddress;
            this.validEmail = true;
            this.validEmailWarning = false;
        }

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
        console.log("date validity: "+this.dateFieldElement.checkValidity());
        console.log("time validity: "+this.timeFieldElement.checkValidity());
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

    acceptedExtensionTypes = [".csv", ".doc", ".docx", ".jpg", ".jpeg", ".pdf", ".png", ".txt", ".xls", ".xlsx"];
    acceptedMimeTypes = ["text/csv", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                  "image/jpeg", "application/pdf", "image/png", "text/plain", "application/vnd.ms-excel",
                                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]

    get showAttachDocumentName() {
        return this.attachDocuments.length !== 0;
    }
    get showAttachDocumentExcludeName() {
        return this.attachDocumentsExclude.length !== 0;
    }
    @track attachDocuments = [];
    @track attachDocumentsExclude = [];
    fileIndex = 0;

    attachDocumentsUpload(event) {
        const uploadedFiles = event.target.files;
        console.log("Uploaded Files Length: " + uploadedFiles.length);
        this.attachDocumentsExclude = [];
        if (uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
                let fileSize = file.size;
                let fileSizeInMB = 0;
                let fileName = file.name;
                let fileExtension = "."+fileName.split('.').pop();
                let fileType = file.type;
                new Promise((resolve, reject) => {
                    fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
                    console.log("File info: " + fileName + " " + fileSize + " " + fileSizeInMB + " " + fileExtension + " " + fileType);

                    let fileSizeLimit = fileSizeInMB < 3;
                    let fileExtensionIncludes = this.acceptedExtensionTypes.includes(fileExtension.toLowerCase());
                    let fileTypeIncludes = this.acceptedMimeTypes.includes(fileType.toLowerCase());

                    if (fileSizeLimit && fileExtensionIncludes && fileTypeIncludes) {
                        resolve(file);
                    } else {
                        let fileWarningType = [];
                        if (!fileSizeLimit) {
                            fileWarningType.push("exceeds file size limit");
                        }
                        if (!fileExtensionIncludes || !fileType) {
                            fileWarningType.push("document type not supported");
                        }
                        let fileWarningText = fileWarningType.join("/");

                        this.attachDocumentsExclude.push( {
                            fileId: this.fileIndex,
                            fileName: fileName,
                            fileSize: fileSizeInMB,
                            fileExtension: fileExtension,
                            fileType: fileType,
                            fileWarning: fileWarningText
                        } )
                        reject("Incompatible file");
                    }
                }).then((resolveFile) => {
                    const reader = new FileReader();
                    return new Promise((resolve, reject) => {
                        reader.readAsDataURL(resolveFile); //This Data URL string is a base64-encoded representation of the file's content
                        reader.onload = () => {
                            let documentContent = reader.result.split(',')[1]; //Extract the base64 part of the data URL (remove the data:contentType;base64, prefix) to pass to Apex
                            if (documentContent.length > 0) {
                                resolve(documentContent);
                            } else {
                                reject("No documentContent");
                            }
                        }
                    })
                }).then((resolveDocumentContent) => {
                    console.log("what is resolvedDocument size: " + resolveDocumentContent.length);
                    if (resolveDocumentContent.length > 0) {
                        this.attachDocuments.push( {
                            fileId: this.fileIndex,
                            fileContent: resolveDocumentContent,
                            fileName: fileName,
                            fileSize: fileSizeInMB,
                            fileType: fileType
                        } );
                    }
                    console.log("All File length: " + this.attachDocuments.length);
                    this.fileIndex++;
                }).catch((rejectMsg) => {
                    console.log(rejectMsg);
                })
            }
        }
    }

    attachDocumentsDelete(event) {
        let removeFileId = event.currentTarget.dataset.fileid;
        this.attachDocuments = this.attachDocuments.filter(obj => obj.fileId.toString() !== removeFileId.toString());
        // this.attachDocumentContent = this.attachDocumentContent.filter( obj => obj.fileId.toString() !== removeFileId.toString());
        console.log("After remove file length: "+this.attachDocuments.length);
        if (this.attachDocuments.length === 0) {
            this.attachDocumentsExclude = [];
        }
    }

    showUrl = false;
    returnUrl;
    async submitCase() {
        console.log("All File: " + JSON.stringify(this.biasIncidentFormValues));
        await saveSupportingDocuments( {attachedDocumentsList: this.attachDocuments}).then((result) => {
            console.log(JSON.stringify(result));
            if (result.Status === 'success') {
                this.biasIncidentFormValues.custom_field_1 = result.Url;

                this.returnUrl = result.Url;
                this.showUrl = true;
            }
        })

        // try {
        //     delete this.biasIncidentFormValues.reporterType //USED JUST FOR TESTING BECAUSE GETTING reporteType FIELD DOES NOT EXIST ON POST RESPONSE
        //     let formValues = JSON.stringify(this.biasIncidentFormValues);
        //     let postBiasReportResults = await submitForm({formValues: formValues});
        //     console.log("imperativeContinuation results: "+JSON.stringify(postBiasReportResults));
        //     this.error = undefined;
        // } catch (error) {
        //     this.error = error;
        // }

        // await saveSupportingDocuments( {attachedDocumentsList: this.attachDocuments}).then((result) => {
        //     console.log(result);
        // })

        // console.log("initial biasIncidentFormValues: "+JSON.stringify(this.biasIncidentFormValues));
        // delete this.biasIncidentFormValues.reporterType //USED JUST FOR TESTING BECAUSE GETTING reporteType FIELD DOES NOT EXIST ON POST RESPONSE
        // console.log("deleted property biasIncidentFormValues: "+JSON.stringify(this.biasIncidentFormValues));
        //
        // let formValues = JSON.stringify(this.biasIncidentFormValues);
        // console.log("submitted stringify biasIncidentFormValues: "+formValues);
        // console.log("Uploaded Files Content on Submit: ", this.attachDocumentContent );

        // try {
        //     let imperativeContinuation = await submitForm({formValues: formValues});
        //     console.log("imperativeContinuation results: "+JSON.stringify(imperativeContinuation));
        //     this.error = undefined;
        // } catch (error) {
        //     this.error = error;
        // }
    }

}