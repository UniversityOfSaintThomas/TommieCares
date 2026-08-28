/**
 * Created by nguy0092 on 6/23/2026.
 */

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

const attachedDocumentsSave = async (apexMethod, attachDocuments, supportingDocumentName, attachDocumentResponse, formValues) =>  {
    let saveDocumentsFail = false;

    try {
        let saveSupportingDocumentsResults = await apexMethod({attachedDocumentsList: attachDocuments, supportingDocumentName: supportingDocumentName});

        if (saveSupportingDocumentsResults.Status === 'success') {
            attachDocumentResponse.Status = saveSupportingDocumentsResults.Status;
            attachDocumentResponse.SupportingDocumentUrl = saveSupportingDocumentsResults.Url;
            attachDocumentResponse.SupportingDocumentId = saveSupportingDocumentsResults.SupportingDocumentId;
            formValues.salesforce_support_documents = attachDocumentResponse.SupportingDocumentUrl;
        } else if (saveSupportingDocumentsResults.Status === 'error') {
            saveDocumentsFail = true;
        }
    } catch (e) {
        console.log("Save documents error: " + JSON.stringify(e));
        saveDocumentsFail = true;
    }

    return saveDocumentsFail;
}

export { emailValidation, attachDocumentsUpload, attachedDocumentsSave };