/**
 * Created by nguy0092 on 8/18/2025.
 */

const emailValidation = (emailAddress) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let emailValidationResults = {
        emailAddress: emailAddress,
        validEmail: null,
        validEmailWarning: null
    }

    if (emailAddress && !(emailRegex.test(emailAddress))) {
        emailValidationResults.validEmail = false;
        emailValidationResults.validEmailWarning = true;
    } else {
        emailValidationResults.validEmail = true;
        emailValidationResults.validEmailWarning = false;
    }
    return emailValidationResults;
}

const attachDocumentsUpload = async (uploadedFiles, acceptedExtensionTypes, acceptedMimeTypes, fileIndex) => {
    let initialFileIndex = fileIndex;
    let attachDocumentResults = {
        attachDocuments: [],
        attachDocumentsExclude: [],
        fileIndex: initialFileIndex,
    }
    console.log("Uploaded Files Length: " + uploadedFiles.length);
    if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
            let fileSize = file.size;
            let fileSizeInMB = 0;
            let fileName = file.name;
            let fileExtension = "."+fileName.split('.').pop();
            let fileType = file.type;

            await new Promise((resolve, reject) => {
                fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
                console.log("File info: " + fileName + " " + fileSize + " " + fileSizeInMB + " " + fileExtension + " " + fileType);

                let fileSizeLimit = fileSizeInMB < 3;
                let fileExtensionIncludes = acceptedExtensionTypes.includes(fileExtension.toLowerCase());
                let fileTypeIncludes = acceptedMimeTypes.includes(fileType.toLowerCase());

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

                    attachDocumentResults.attachDocumentsExclude.push( {
                        fileId: initialFileIndex,
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
                    attachDocumentResults.attachDocuments.push( {
                        fileId: initialFileIndex,
                        fileContent: resolveDocumentContent,
                        fileName: fileName,
                        fileSize: fileSizeInMB,
                        fileType: fileType
                    } );
                }
                console.log("All File length: " + attachDocumentResults.attachDocuments.length);
                initialFileIndex++;
            }).catch((rejectMsg) => {
                console.log(rejectMsg);
            })
        }
        attachDocumentResults.fileIndex = initialFileIndex;
    }
    return attachDocumentResults;
}

export { emailValidation, attachDocumentsUpload };