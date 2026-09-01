/**
 * Created by nguy0092 on 6/23/2026.
 */
import saveSupportingDocuments from "@salesforce/apex/TellSomeoneLwcController.saveSupportingDocuments";
import updateSupportingDocument from "@salesforce/apex/TellSomeoneLwcController.updateSupportingDocument";
import deleteSupportingDocument from "@salesforce/apex/TellSomeoneLwcController.deleteSupportingDocument";

const emailValidation = (emailAddress) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const validEmail = !!emailAddress && emailRegex.test(emailAddress);

    return {
        emailAddress,
        validEmail,
        validEmailWarning: !validEmail
    };
};

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); //This Data URL string is a base64-encoded representation of the file's content
    reader.onload = () => {
        const documentContent = reader.result.split(',')[1]; //Extract the base64 part of the data URL (remove the data:contentType;base64, prefix) to pass to Apex
        if (documentContent.length > 0) {
            resolve(documentContent);
        } else {
            reject("No documentContent");
        }
    };
    reader.onerror = () => reject("FileReader error");
});

const buildExcludedFile = (fileId, fileName, fileSizeInMB, fileExtension, fileType, fileWarning) => ({
    fileId: fileId,
    fileName: fileName,
    fileSize: fileSizeInMB,
    fileExtension: fileExtension,
    fileType: fileType,
    fileWarning: fileWarning
});

const attachDocumentsUpload = async (uploadedFiles, acceptedExtensionTypes, acceptedMimeTypes, fileIndex,
                                     existingDocuments = [], maxFileSize, maxFileCount) => {
    const _acceptedExtensionTypes = acceptedExtensionTypes.split(",").map(item => item.trim());
    let initialFileIndex = fileIndex;
    let attachDocumentResults = {
        attachDocuments: [],
        attachDocumentsExclude: [],
        fileIndex: initialFileIndex,
    }

    if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
            const fileName = file.name;
            const fileExtension = "."+fileName.split('.').pop();
            const fileType = file.type;
            const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            const fileSizeLimit = fileSizeInMB < maxFileSize;
            const fileExtensionIncludes = _acceptedExtensionTypes.includes(fileExtension.toLowerCase());
            const fileTypeIncludes = acceptedMimeTypes.includes(fileType.toLowerCase());

            if (fileSizeLimit && fileExtensionIncludes && fileTypeIncludes) {
                const isDuplicate = existingDocuments.some(d => d.fileName === fileName && d.fileSize === fileSizeInMB);

                if (!isDuplicate) {
                    try {
                        if(attachDocumentResults.attachDocuments.length + existingDocuments.length >= maxFileCount) {
                            attachDocumentResults.attachDocumentsExclude.push(
                                buildExcludedFile(initialFileIndex, fileName, fileSizeInMB, fileExtension, fileType, "maximum file count reached")
                            );
                        } else {
                            // eslint-disable-next-line no-await-in-loop
                        const documentContent = await readFileAsBase64(file);
                            if (documentContent.length > 0) {
                                attachDocumentResults.attachDocuments.push({
                                    fileId: initialFileIndex,
                                    fileContent: documentContent,
                                    fileName: fileName,
                                    fileSize: fileSizeInMB,
                                    fileType: fileType
                                });
                            }
                        }
                    } catch (error) {
                        console.log(error);
                        attachDocumentResults.attachDocumentsExclude.push(
                            buildExcludedFile(initialFileIndex, fileName, fileSizeInMB, fileExtension, fileType, "unable to read file")
                        );
                    }

                } else {
                    console.log("Duplicate File");
                    attachDocumentResults.attachDocumentsExclude.push(
                        buildExcludedFile(initialFileIndex, fileName, fileSizeInMB, fileExtension, fileType, "duplicate file attached")
                    );
                }
            } else {
                let fileWarningType = [];

                if (!fileExtensionIncludes || !fileTypeIncludes) {
                    fileWarningType.push("document type not supported");
                }

                if (!fileSizeLimit) {
                    fileWarningType.push("exceeds file size limit");
                }

                attachDocumentResults.attachDocumentsExclude.push(
                    buildExcludedFile(initialFileIndex, fileName, fileSizeInMB, fileExtension, fileType, fileWarningType.join("/"))
                );
            }

            initialFileIndex++;
        }
        attachDocumentResults.fileIndex = initialFileIndex;
    }

    return attachDocumentResults;
}

const attachedDocumentsSave = async (attachDocuments, supportingDocumentName, attachDocumentResponse/*, formValues*/) =>  {
    let saveDocumentsFail = false;

    try {
        let saveSupportingDocumentsResults = await saveSupportingDocuments({attachedDocumentsList: attachDocuments, supportingDocumentName: supportingDocumentName});

        if (saveSupportingDocumentsResults.Status === 'success') {
            attachDocumentResponse.Status = saveSupportingDocumentsResults.Status;
            attachDocumentResponse.SupportingDocumentUrl = saveSupportingDocumentsResults.Url;
            attachDocumentResponse.SupportingDocumentId = saveSupportingDocumentsResults.SupportingDocumentId;
            // formValues.salesforce_support_documents = attachDocumentResponse.SupportingDocumentUrl;
        } else if (saveSupportingDocumentsResults.Status === 'error') {
            saveDocumentsFail = true;
        }
    } catch (e) {
        console.log("Save documents error: " + JSON.stringify(e));
        saveDocumentsFail = true;
    }

    return saveDocumentsFail;
}

const finalizeSupportingDocument = async (saveDocumentsFail, submitFormFail, attachDocumentResponse, reportNumber) => {
    if (!saveDocumentsFail && !submitFormFail && attachDocumentResponse.SupportingDocumentUrl) {
        try {
            await updateSupportingDocument({supportingDocumentId: attachDocumentResponse.SupportingDocumentId, advocateReportNumber: reportNumber});
        } catch (e) {
            console.log("updateSupportingDocument error: " + JSON.stringify(e));
        }
    } else if (!saveDocumentsFail && submitFormFail && attachDocumentResponse.SupportingDocumentUrl) {
        try {
            await deleteSupportingDocument({supportingDocumentId: attachDocumentResponse.SupportingDocumentId});
        } catch (e) {
            console.log("deleteSupportingDocument error: " + JSON.stringify(e));
        }
    }
};

const tommieAlertsTellSomeoneSubmission = async (template, formType,
                                            {selectorName, visible, documentTypeLabel, submitApexMethod/*, formSubmitSelectionsKey*/}) => {
    let formValues = {};
    let documents = [];
    let attachDocumentResponse = {
        Status: "",
        SupportingDocumentUrl: "",
        SupportingDocumentId: ""
    };
    let reportNumber = "";
    let saveDocumentsFail = false;
    let submitFormFail = false;

    if (visible) {
        const childComponent = template.querySelector(selectorName);

        if (childComponent) {
            formValues = JSON.parse(JSON.stringify(childComponent.formToTommieAlerts));
            documents = JSON.parse(JSON.stringify(childComponent.documentsToTommieAlerts));
        }

        if (formValues && Object.keys(formValues).length > 0) {
            if (documents.length > 0) {
                saveDocumentsFail = await attachedDocumentsSave(documents, documentTypeLabel, attachDocumentResponse);

                if (formType === "titleix") {
                    formValues.salesforce_support_documents = attachDocumentResponse.SupportingDocumentUrl; //For Supporting Documents record ID
                }
                // WAITING ON SALESFORCE SUPPORT DOCUMENT FIELD FOR WELL-BEING BEFORE ASSIGNING
            }

            if (submitApexMethod) {
                reportNumber = await submitApexMethod({formValues: JSON.stringify(formValues)});
            }

            /*START TEST FOR TOMMIE ALERTS SUBMIT*/
            // this.submitTitleIxIncidentFormFail = true;
            // const currentDateTime = new Date().toLocaleString();
            // reportNumber = `Report: ${currentDateTime}`;
            // reportNumber = "";
                /*END TEST FOR TOMMIE ALERTS SUBMIT*/

            // formSubmitSelections[formSubmitSelectionsKey] = reportNumber;
            submitFormFail = !reportNumber;
            console.log("submitFormFail: " + submitFormFail);

            await finalizeSupportingDocument(saveDocumentsFail, submitFormFail, attachDocumentResponse, reportNumber);
        }
    }

    return {attachDocumentResponse, reportNumber, saveDocumentsFail, submitFormFail};
};



export { emailValidation, attachDocumentsUpload, attachedDocumentsSave, finalizeSupportingDocument, tommieAlertsTellSomeoneSubmission };