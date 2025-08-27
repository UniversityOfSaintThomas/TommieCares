/**
 * Created by nguy0092 on 7/27/2025.
 */

public without sharing class CommunityOfConcernLwcController {

    public class DocumentsWrapper {
        @AuraEnabled public String fileId { get; set; }
        @AuraEnabled public String fileContent { get; set; }
        @AuraEnabled public String fileName { get; set; }
        @AuraEnabled public String fileSize { get; set; }
        @AuraEnabled public String fileType { get; set; }
    }

    @AuraEnabled(Cacheable=true)
    public static List<Contact> iAmContactInfo(String salesforceId, String bannerId) {
        return [SELECT Id,
                        FirstName,
                        LastName,
                        St_Thomas_Connection__c,
                        hed__UniversityEmail__c,
                        University_Banner_ID__c
                FROM Contact
                WHERE Id = :salesforceId
                OR (University_Banner_ID__c != ''
                AND University_Banner_ID__c = :bannerId)
                WITH SECURITY_ENFORCED
                LIMIT 1
        ];
//        return contactInfo;
    }

    @AuraEnabled(Cacheable=false)
    public static String saveCase(Map<String, String> formSelections) {
        String insertStatus = '';
        Case communityOfConcernCase = new Case();

        List<RecordType> recordId = [
                SELECT Id,
                        Name
                FROM RecordType
                WHERE SobjectType = 'Case'
                AND DeveloperName = 'Community_Concern'
        ];

        String caseRecordId = !recordId.isEmpty() ? recordId[0].Id : '';

        communityOfConcernCase.RecordTypeId = caseRecordId;
        communityOfConcernCase.Origin = 'Web';
        communityOfConcernCase.Subject = 'Community Concern';
        communityOfConcernCase.Community_Concern_Reporter_Type__c = formSelections.get('IAmValue');
        if (String.isNotBlank(formSelections.get('IAmContactId'))) {
            communityOfConcernCase.Case_Reporter__c = formSelections.get('IAmContactId');
        }
        communityOfConcernCase.SuppliedName = formSelections.get('IAmFirstName') + ' ' + formSelections.get('IAmLastName');
        communityOfConcernCase.SuppliedEmail = formSelections.get('IAmEmail');
        communityOfConcernCase.SuppliedPhone = formSelections.get('IAmPhone');
        communityOfConcernCase.Community_Concern_Who_Type__c = formSelections.get('ConcernedWhoValue');
        communityOfConcernCase.First_Name__c = formSelections.get('ConcernedWhoFirstName');
        communityOfConcernCase.Last_Name__c = formSelections.get('ConcernedWhoLastName');
        communityOfConcernCase.St_Thomas_Email__c = formSelections.get('ConcernedWhoEmail');
        communityOfConcernCase.Phone__c = formSelections.get('ConcernedWhoPhone');
        communityOfConcernCase.Community_Concern__c = formSelections.get('ConcernedWhatValue');
        communityOfConcernCase.Restricted_Access_Notes__c = formSelections.get('ConcernedWhatAdditionalInfo');

        try {
            insert communityOfConcernCase;
        } catch (DmlException e) {
            insertStatus = 'fail';
            System.debug('Insert Case error: '+e);
        }

        return insertStatus;
    }

    @AuraEnabled(Cacheable=false)
    public static Map<String, String> saveSupportingDocuments(List<DocumentsWrapper> attachedDocumentsList, String supportingDocumentName) {
        System.debug(JSON.serializePretty(attachedDocumentsList));
        List<ContentVersion> insertContentVersionList = new List<ContentVersion>();
        String recordUrl = '';
        Map<String, String> returnStatusUrl = new Map<String, String>{
                'Status' => '',
                'Url' => ''
        };

        if (attachedDocumentsList.size() > 0) {
            String recordType;
            List<RecordType> recordTypeQuery = [
                    SELECT Id,
                            Name,
                            DeveloperName
                    FROM RecordType
                    WHERE SobjectType = 'Supporting_Document__c'
                    AND DeveloperName = 'Current_Student_Restricted'
            ];

            if (recordTypeQuery.size() > 0) {
                recordType = recordTypeQuery[0].Id;
            }

            Supporting_Document__c supportingDocument = new Supporting_Document__c(
                    RecordTypeId = recordType,
                    Name = supportingDocumentName,
                    Source__c = 'Community of Concern',
                    Document_Load_Date__c = Date.today()
            );

            try {
                insert supportingDocument;

                for (DocumentsWrapper d : attachedDocumentsList) {
                    Blob fileBlob = EncodingUtil.base64Decode(d.fileContent);
                    ContentVersion contentVersion = new ContentVersion(
                            Title = d.fileName,
                            PathOnClient = d.fileName,
                            VersionData = fileBlob,
                            Supporting_Documents_Id_fileupload__c = supportingDocument.Id,
                            Origin = 'C'
                    );
                    insertContentVersionList.add(contentVersion);
                }

                insert insertContentVersionList;

                String baseUrl = Url.getOrgDomainUrl().toExternalForm();
                recordUrl = baseUrl + '/' + supportingDocument.Id;
                returnStatusUrl.put('Status','success');
                returnStatusUrl.put('Url',recordUrl);

            } catch (DmlException e) {
                returnStatusUrl.put('Status','error');
                returnStatusUrl.put('Url','There was an error attaching documents.');
                System.debug('saveSupportingDocuments error: ' + e);
            }
        }

        return returnStatusUrl;
    }
}