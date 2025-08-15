/**
 * Created by nguy0092 on 8/12/2025.
 */

import {api, LightningElement, track, wire} from 'lwc';
import titleIxReportingFormOptions from "@salesforce/apexContinuation/AdvocateTitleIxIncidentReportController.titleIxReportingFormOptions";

export default class AdvocateTitleIxIncidentReportLwc extends LightningElement {
    @api communityOfConcernReportType = "";
    @api communityOfConcernName = "";
    @api communityOfConcernEmail = "";
    @api paramUrl = "";

    @track reporterTypeOptions = [];

    statusWhoCausedHarmOptions = [
        {label: "Student", value: "Student"},
        {label: "Faculty/staff", value: "Faculty/staff"},
        {label: "Guest/visitor", value: "Guest/visitor"},
        {label: "Unknown", value: "Unknown"},
        {label: "Other", value: "Other"},
    ]
    notificationOptions = [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
    ]

    @track titleIxIncidentFormValues = {
        reporterType: "", //I am a
        status_of_individual_who_caused_harm: [], //Status of Individual Who Caused Harm
        reporterName: "", //Reporter's Name
        reporterEmail: "", //Reporter's EmailRequired
        reporterPhone: "", //Reporter's Phone
        description: "", //Incident / Concerning Behavior Description REQUIRED
        person_who_was_harmed_complainants: "", //Name of the person who caused harm
        additionalLocation: "", //Location of Incident
        date_of_incidents: "", //Date of Incident(s)Required
        person_who_did_harm_respondents: "", //Name of the person who caused harm
        otherWitness: "", //Witness(es)
        notification: "", //Notification Boolean
        reporter_followup: "", //Reporter Follow-upRequired
        hostileEnvironment: false, //REQUIRED
        quidProQuo: false, //REQUIRED
        genderDiscrimination: false, //REQUIRED
        sexualViolence: false, //REQUIRED
        maritalStatus: false, //REQUIRED
        retaliation: false, //REQUIRED
    }

    rendered = false;
    renderedCallback() {
        if(!this.rendered) {
            this.titleIxIncidentFormValues.reporterName = !!this.communityOfConcernName ? this.communityOfConcernName : "";
            this.titleIxIncidentFormValues.reporterEmail = !!this.communityOfConcernEmail ? this.communityOfConcernEmail : "";
            this.rendered = !this.rendered;
        }
    }

    @wire(titleIxReportingFormOptions, {})
    biasReportingFormOptions1Wire({error, data}) {
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
                if (this.reporterTypeOptions.length > 0 && this.communityOfConcernReportType && !this.titleIxIncidentFormValues.reporterType) {
                    for (let i = 0; i < this.reporterTypeOptions.length; i++) {
                        if (this.reporterTypeOptions[i].label.toLowerCase().includes(this.communityOfConcernReportType.toLowerCase())) {
                            this.titleIxIncidentFormValues.reporterType = this.reporterTypeOptions[i].value;
                            break;
                        }
                    }
                }
            }
        }

        if (error) {
            console.log("titleIxReportingFormOptions error: "+JSON.stringify(error));
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

}