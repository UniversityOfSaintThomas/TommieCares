/**
 * Created by nguy0092 on 8/12/2025.
 */

import {api, LightningElement, track} from 'lwc';

export default class AdvocateTitleIxIncidentReportLwc extends LightningElement {
    @api communityOfConcernReportType = "";
    @api communityOfConcernName = "";
    @api communityOfConcernEmail = "";
    @api paramUrl = "";

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