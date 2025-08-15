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

    get isAnonymous() {
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
        // _attachDocuments: "", //Attach documents/Upload [“document” subform in Advocate]
        incidentType: "12", //required
        // location: null, //required
        additionalLocation: "1", //required
        emsCalled: false, //required
        residentialHallStaffCalled: false, //required
        policeCalled: false, //required
        alcohol: false, //required
        custom_field_1: "" //temporarily using this field for Supporting Documents record ID
    }

    _incidentDate = "";
    _incidentTime = ""

    get submitDisable() {
        return !(!!this.biasIncidentFormValues.reporterType && !!this.biasIncidentFormValues.incidentDate && !!this.biasIncidentFormValues.description);
    }

    rendered = false;
    renderedCallback() {
        if(!this.rendered) {
            this.biasIncidentFormValues.reporterName = !!this.communityOfConcernName ? this.communityOfConcernName : "";
            this.biasIncidentFormValues.reporterEmail = !!this.communityOfConcernEmail ? this.communityOfConcernEmail : "";
            this.rendered = !this.rendered;
        }
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
        let eventValue = event.detail.value;
        switch (event.currentTarget.dataset.inputtype) {
            case "name":
                this.biasIncidentFormValues.reporterName = eventValue;
                break;
            case "phone":
                this.biasIncidentFormValues.reporterPhone = eventValue;
                break;
            case "email":
                this.biasIncidentFormValues.reporterEmail = eventValue;
                break;
            case "date":
                if (eventValue) {
                    this._incidentDate = eventValue;
                } else {
                    this._incidentDate = "";
                }
                console.log("Date: "+this._incidentDate);
                this.biasIncidentFormValues.incidentDate = this.dateTime();
                break;
            case "time":
                if (eventValue) {
                    this._incidentTime = eventValue;
                } else {
                    this._incidentTime = "";
                }
                console.log("Time: "+this._incidentTime);
                this.biasIncidentFormValues.incidentDate = this.dateTime();
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

    acceptedFormats = [".txt", ".pdf", ".docx", ".doc", ".jpg", ".png", ".xlsx", ".csv"];
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
                let fileSizeInMB = 0;
                new Promise((resolve, reject) => {
                    console.log("File name: " + file.name + ' ' + file.size);
                    fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                    if (fileSizeInMB < 3.5) {
                        resolve(file);
                    } else {
                        this.attachDocumentsExclude.push( {
                            fileId: this.fileIndex,
                            fileName: file.name,
                            fileSize: fileSizeInMB,
                            fileWarning: "exceeds file size limit"
                        } )
                        reject("File size exceeded limit");
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
                            fileName: file.name,
                            fileSize: fileSizeInMB,
                            fileType: file.type
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

    dateTime() {
        let date = "";
        let time = "";
        if (this._incidentDate) {
            date = this._incidentDate+"T";
            if (this._incidentTime) {
                let findMilliseconds = this._incidentTime.search(/[.]/);
                let newTime = this._incidentTime.slice(0, findMilliseconds);
                time = newTime+"Z";
            } else {
                time = "Z";
            }
        }
        return date+time;
    }

    showUrl = false;
    returnUrl;
    async submitCase() {
        // this.biasIncidentFormValues.incidentDate = this.dateTime;
        await saveSupportingDocuments( {attachedDocumentsList: this.attachDocuments}).then((result) => {
            console.log(JSON.stringify(result));
            if (result.Status === 'success') {
                this.biasIncidentFormValues.custom_field_1 = result.Url;

                this.returnUrl = result.Url;
                this.showUrl = true;
            }
        })
        console.log("All File: " + JSON.stringify(this.biasIncidentFormValues));

        try {
            delete this.biasIncidentFormValues.reporterType //USED JUST FOR TESTING BECAUSE GETTING reporteType FIELD DOES NOT EXIST ON POST RESPONSE
            let formValues = JSON.stringify(this.biasIncidentFormValues);
            let postBiasReportResults = await submitForm({formValues: formValues});
            console.log("imperativeContinuation results: "+JSON.stringify(postBiasReportResults));
            this.error = undefined;
        } catch (error) {
            this.error = error;
        }

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