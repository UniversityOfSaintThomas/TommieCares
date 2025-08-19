/**
 * Created by nguy0092 on 8/18/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import wellBeingReportingFormOptions from "@salesforce/apexContinuation/AdvocateWellBeingIncidentReprtController.wellBeingReportingFormOptions";
import saveSupportingDocuments from "@salesforce/apex/AdvocateWellBeingIncidentReprtController.saveSupportingDocuments";

export default class AdvocateWellBeingIncidentReportLwc extends LightningElement {
    @api communityOfConcernReportType = "";
    @api communityOfConcernName = "";
    @api communityOfConcernEmail = "";
    @api paramUrl = "";

    @track reporterTypeOptions = [];

    get showFormAll() {
        return !!this.wellBeingIncidentFormValues.reporterType;
    }
    get isNotAnonymous() {
        return !(this.communityOfConcernReportType === "Anonymous");
    }

    @track wellBeingIncidentFormValues = {
        reporterType: "",
        reporterName: "",
        reporterEmail: "",
        reporterPhone: "",
        otherStudent: "",
        studentGroup: "",
        DONOTKNOWFORKNOW: "",
        witness: "",
        otherWitness: "",
        description: "",
        incidentType: "14", //required
        additionalLocation: "1", //required
        emsCalled: false, //required
        residentialHallStaffCalled: false, //required
        policeCalled: false, //required
        alcohol: false, //required
        custom_field_1: "" //temporarily using this field for Supporting Documents record ID
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
            case "studentsinvolved":
                this.wellBeingIncidentFormValues.otherStudent = eventValue;
                break;
            case "studentgroupsinvolved":
                this.wellBeingIncidentFormValues.studentGroup = eventValue;
                break;
            case "donotknowforknow":
                this.wellBeingIncidentFormValues.DONOTKNOWFORKNOW = eventValue;
                break;
            case "witness":
                this.wellBeingIncidentFormValues.witness = eventValue;
                break;
            case "otherwitness":
                this.wellBeingIncidentFormValues.otherWitness = eventValue;
                break;
            case "description":
                this.wellBeingIncidentFormValues.description = eventValue;
                break;
        }
        console.log("wellBeingIncidentFormValues2 value: "+JSON.stringify(this.wellBeingIncidentFormValues));
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
            this.wellBeingIncidentFormValues.reporterEmail = emailAddress;
            this.validEmail = true;
            this.validEmailWarning = false;
        }

        if (this.validEmailWarning) {
            emailField.classList.add("slds-has-error");
        } else {
            emailField.classList.remove("slds-has-error");
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
        console.log("All File: " + JSON.stringify(this.wellBeingIncidentFormValues));
        await saveSupportingDocuments( {attachedDocumentsList: this.attachDocuments}).then((result) => {
            console.log(JSON.stringify(result));
            if (result.Status === 'success') {
                // this.biasIncidentFormValues.custom_field_1 = result.Url;

                this.returnUrl = result.Url;
                this.showUrl = true;
            }
        })

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