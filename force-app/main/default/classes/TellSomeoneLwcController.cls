/**
 * Created by nguy0092 on 6/22/2026.
 */

public without sharing class TellSomeoneLwcController {

    @AuraEnabled(Cacheable=true)
    public static List<Contact> iAmContactInfo(String salesforceId, String bannerId) {
        List<Contact> iAmContact = [
                SELECT Id,
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

        if (!iAmContact.isEmpty()) {
            if (String.isBlank(iAmContact[0].St_Thomas_Connection__c) || !iAmContact[0].St_Thomas_Connection__c.contains('Faculty')) {
                List<hed__Course_Offering__c> nonFacultyCourseInstructor = [
                        SELECT Id
                        FROM hed__Course_Offering__c
                        WHERE Current_Term__c = TRUE
                        AND hed__Faculty__r.University_Banner_ID__c = :iAmContact[0].University_Banner_ID__c
                        WITH SECURITY_ENFORCED
                        LIMIT 1
                ];

                if (!nonFacultyCourseInstructor.isEmpty()) {
                    iAmContact[0].St_Thomas_Connection__c = 'Faculty';
                }
            }
        }

        return iAmContact;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> titleIxReportingFormOptions() {
        List<Object> resultsObjects = new List<Object>();

        HttpRequest req1 = new HttpRequest();
        req1.setEndpoint('callout:Symplicity_Advocate_Integration_Key/v1/picklists/titleix_reports/reporterType');
        req1.setMethod('GET');

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint('callout:Symplicity_Advocate_Integration_Key/v1/picklists/titleix_reports/status_of_individual_who_caused_harm');
        req2.setMethod('GET');

        Http http = new Http();
        HttpResponse response1 = http.send(req1);
        HttpResponse response2 = http.send(req2);

        System.debug('Response1 Code: ' + response1.getStatusCode());
        System.debug('Response2 Code: ' + response2.getStatusCode());

        if (response1.getStatusCode() == 200 && response2.getStatusCode() == 200) {
            resultsObjects.add(response1.getBody());
            resultsObjects.add(response2.getBody());
        } else {
            System.debug('titleIxReportingFormOptions2 Error: response1 code=' + response1.getStatusCode() + ' response2 code=' + response2.getStatusCode());
        }

        return resultsObjects;
    }

//    @AuraEnabled(Continuation=true Cacheable=true)
//    public static Object titleIxReportingFormOptions2() {
//        Continuation con = new Continuation(60);
//        con.continuationMethod = 'titleIxProcessGetResponse2';
//        con.state='Picklist Values';
//
//        HttpRequest req = new HttpRequest();
//        req.setEndpoint('callout:Symplicity_Advocate_Integration_Key/v1/picklists/titleix_reports/reporterType');
//        req.setMethod('GET');
////        req.setHeader('Authorization', titleix_api_token);
//        con.addHttpRequest(req);
//
//        HttpRequest req2 = new HttpRequest();
//        req2.setEndpoint('callout:Symplicity_Advocate_Integration_Key/v1/picklists/titleix_reports/status_of_individual_who_caused_harm');
//        req2.setMethod('GET');
////        req2.setHeader('Authorization', titleix_api_token);
//        con.addHttpRequest(req2);
//
//        return con;
//    }
//
//    @AuraEnabled(Cacheable=true)
//    public static List<Object> titleIxProcessGetResponse2(List<String> labels, Object state) {
//        List<Object> resultsObjects = new List<Object>();
//        // Get the response by using the unique label
//        HttpResponse response1 = Continuation.getResponse(labels[0]);
//        HttpResponse response2 = Continuation.getResponse(labels[1]);
//
//        System.debug('response1.getStatusCode(): '+response2.getStatusCode());
//        System.debug('response2.getStatusCode(): '+response2.getStatusCode());
//
//        if (response1.getStatusCode() == 200 && response2.getStatusCode() == 200)  {
//            resultsObjects.add(response1.getBody());
//            resultsObjects.add(response2.getBody());
//        } else {
//            System.debug('titleIxProcessGetResponse1 Error: response1.getStatusCode() or response2.getStatusCode()');
//        }
//
//        return resultsObjects;
//    }

    public class DocumentsWrapper {
        @AuraEnabled public String fileId { get; set; }
        @AuraEnabled public String fileContent { get; set; }
        @AuraEnabled public String fileName { get; set; }
        @AuraEnabled public String fileSize { get; set; }
        @AuraEnabled public String fileType { get; set; }
    }

    @AuraEnabled(Cacheable=false)
    public static Map<String, String> saveSupportingDocuments(List<DocumentsWrapper> attachedDocumentsList, String supportingDocumentName) {
//        System.debug(JSON.serializePretty(attachedDocumentsList));
        List<ContentVersion> insertContentVersionList = new List<ContentVersion>();
        String recordUrl = '';
        Map<String, String> returnStatusUrl = new Map<String, String>{
                'Status' => '',
                'Url' => '',
                'SupportingDocumentId'  => ''
        };

        if (!attachedDocumentsList.isEmpty()) {
            String recordType = Schema.SObjectType.Supporting_Document__c.getRecordTypeInfosByDeveloperName().get('Current_Student_Restricted').getRecordTypeId();
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
//                            Supporting_Documents_Id_fileupload__c = supportingDocument.Id,
                            Origin = 'C',
                            FirstPublishLocationId = supportingDocument.Id
                    );
                    insertContentVersionList.add(contentVersion);
                }

                insert insertContentVersionList;
                //ContentVersionTriggers->ContentVersionTriggersHandler attaches document to Supporting Document record

                String baseUrl = Url.getOrgDomainUrl().toExternalForm();
                recordUrl = baseUrl + '/' + supportingDocument.Id;
                returnStatusUrl.put('Status','success');
                returnStatusUrl.put('Url', recordUrl);
                returnStatusUrl.put('SupportingDocumentId', supportingDocument.Id);

            } catch (DmlException e) {
                returnStatusUrl.put('Status','error');
                returnStatusUrl.put('Url','There was an error attaching documents.');
                System.debug('saveSupportingDocuments error: ' + e);
            }
        }

        return returnStatusUrl;
    }


}