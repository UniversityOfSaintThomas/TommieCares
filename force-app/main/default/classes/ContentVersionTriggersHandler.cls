/**
 * Created by nguy0092 on 8/11/2025.
 */

public without sharing class ContentVersionTriggersHandler {

    public void afterInsert(List<SObject> insertedContentVersions) {
        Set<String> supportingDocumentsIds = new Set<String>();
        List<ContentVersion> newContentVersions = new List<ContentVersion>();
        List<ContentVersion> supportingDocumentsVersions = new List<ContentVersion>();

        for (SObject sobj : insertedContentVersions) {
            ContentVersion cv = (ContentVersion)sobj;
            if (String.isNotBlank(cv.Supporting_Documents_Id_fileupload__c)) {
                newContentVersions.add(cv);
                supportingDocumentsIds.add(cv.Supporting_Documents_Id_fileupload__c);
            }
        }

        List<Supporting_Document__c> supportingDocumentsList = [
                SELECT Id
                FROM Supporting_Document__c
                WHERE Id IN :supportingDocumentsIds
        ];

        for (Supporting_Document__c sd : supportingDocumentsList) {
            for (ContentVersion cv : newContentVersions) {
                if (sd.Id == cv.Supporting_Documents_Id_fileupload__c) {
                    supportingDocumentsVersions.add(cv);
                }
            }
        }

        if (supportingDocumentsVersions.size() > 0) {
            SupportingDocumentsLink(supportingDocumentsVersions);
        }
    }

    public void SupportingDocumentsLink(List<ContentVersion> filteredContentVersions) {
        List<ContentDocumentLink> contentDocumentLinkList = new List<ContentDocumentLink>();
        for (ContentVersion cv : filteredContentVersions) {
//            System.debug('Trigger files: ' +JSON.serializePretty(cv));
//            System.debug('What is cv.Id: ' +cv.Id);

            ContentDocumentLink contentDocumentLink = new ContentDocumentLink(
                    ContentDocumentId = cv.ContentDocumentId,
                    LinkedEntityId = cv.Supporting_Documents_Id_fileupload__c,
                    ShareType = 'V'
            );

            contentDocumentLinkList.add(contentDocumentLink);
        }

        try {
            insert contentDocumentLinkList;
        } catch (DmlException e) {
            System.debug('ContentVersion trigger SupportingDocumentsLink insert error: '+e);
        }
    }
}