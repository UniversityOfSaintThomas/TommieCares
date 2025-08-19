/**
 * Created by nguy0092 on 8/18/2025.
 */

public with sharing class AdvocateWellBeingIncidentReprtController {
    private static String api_token = (String) Advocate_Symplicity_API_Token__mdt.getInstance('Api_Token').get('Bias_Incident__c');

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object wellBeingReportingFormOptions() {
        Continuation con = new Continuation(60);
        con.continuationMethod = 'processGetResponse1';
        con.state='Picklist Values';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/reporterType');
        req.setMethod('GET');
        req.setHeader('Authorization', api_token);
        con.addHttpRequest(req);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> processGetResponse1(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();

        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);

        if (response1.getStatusCode() == 200) {
            resultsObjects.add(response1.getBody());
        } else {
            System.debug('processGetResponse1 Error: '+response1.getStatusCode());
        }

        return resultsObjects;
    }

    public class DocumentsWrapper {
        @AuraEnabled public String fileId { get; set; }
        @AuraEnabled public String fileContent { get; set; }
        @AuraEnabled public String fileName { get; set; }
        @AuraEnabled public String fileSize { get; set; }
        @AuraEnabled public String fileType { get; set; }
    }

    @AuraEnabled(Cacheable=false)
    public static Map<String, String> saveSupportingDocuments(List<DocumentsWrapper> attachedDocumentsList) {
//        System.debug(JSON.serializePretty(attachedDocumentsList));
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
                    AND DeveloperName = 'Current_Student'
            ];

            if (recordTypeQuery.size() > 0) {
                recordType = recordTypeQuery[0].Id;
            }

            Supporting_Document__c supportingDocument = new Supporting_Document__c(
                    RecordTypeId = recordType,
                    Name = 'Advocate Well Being Incident'
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