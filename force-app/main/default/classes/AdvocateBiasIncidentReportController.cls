/**
 * Created by nguy0092 on 7/31/2025.
 */

public without sharing class AdvocateBiasIncidentReportController {
    private static String api_token = (String) Advocate_Symplicity_API_Token__mdt.getInstance('Api_Token').get('Bias_Incident__c');

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object biasReportingFormOptions1() {
        Continuation con = new Continuation(60);
        con.continuationMethod = 'processGetResponse1';
        con.state='Picklist Values';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/reporterType');
//        req.setEndpoint('callout:Advocate_Symplicity_Incident_Reports/picklists/incidents/reporterType');
        req.setMethod('GET');
        req.setHeader('Authorization', api_token);
        con.addHttpRequest(req);

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/discrimination_protected_classes');
        req2.setMethod('GET');
        req2.setHeader('Authorization', api_token);
        con.addHttpRequest(req2);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> processGetResponse1(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();

        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);
        HttpResponse response2 = Continuation.getResponse(labels[1]);

        if (response1.getStatusCode() == 200 & response2.getStatusCode() == 200) {
            resultsObjects.add(response1.getBody());
            resultsObjects.add(response2.getBody());
        } else {
            System.debug('processGetResponse1 Error: '+response1.getStatusCode()+ ' '+response2.getStatusCode());
        }

        return resultsObjects;
    }

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object biasReportingFormOptions2() {
        Continuation con = new Continuation(60);
        con.continuationMethod = 'processGetResponse2';
        con.state='Picklist Values';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/affiliation_of_target');
//        req.setEndpoint('callout:Advocate_Symplicity_Incident_Reports/picklists/incidents/affiliation_of_target');
        req.setMethod('GET');
        req.setHeader('Authorization', api_token);
        con.addHttpRequest(req);

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/affiliation_of_person_engaged_in_harm');
        req2.setMethod('GET');
        req2.setHeader('Authorization', api_token);
        con.addHttpRequest(req2);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> processGetResponse2(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();

        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);
        HttpResponse response2 = Continuation.getResponse(labels[1]);

        if (response1.getStatusCode() == 200 & response2.getStatusCode() == 200) {
            resultsObjects.add(response1.getBody());
            resultsObjects.add(response2.getBody());
        } else {
            System.debug('processGetResponse2 Error: '+response1.getStatusCode()+ ' '+response2.getStatusCode());
        }

        return resultsObjects;
    }

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object submitForm(String formValues) {
//        String con = formValues;
        System.debug('This form values: '+formValues);

        Continuation con = new Continuation(60);
//        con.continuationMethod = 'processPostResponse';
//        con.state='Form Submitted';
//
//        HttpRequest req = new HttpRequest();
//        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/incidents');
//        req.setMethod('POST');
//        req.setHeader('Authorization', api_token);
//        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
//        req.setBody(formValues);
//        con.addHttpRequest(req);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> processPostResponse(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();

        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);
        resultsObjects.add(response1.getBody());
        resultsObjects.add(response1.getStatus());
        resultsObjects.add(response1.getStatusCode());
        System.debug('This result getBody: '+response1.getBody());
        System.debug('This result getStatus: '+response1.getStatus());
        System.debug('This result getStatusCode: '+response1.getStatusCode());

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
    public static String saveSupportingDocuments(List<DocumentsWrapper> attachedDocumentsList) {
        String recordUrl = '';

        if (attachedDocumentsList.size() > 0 ) {
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
                    Name = 'Advocate Bias Incident'
            );

            insert supportingDocument;

            for (DocumentsWrapper d : attachedDocumentsList) {
                Blob fileBlob = EncodingUtil.base64Decode(d.fileContent);
                ContentVersion contentVersion = new ContentVersion(
                        Title = d.fileName,
                        PathOnClient = d.fileName,
                        VersionData = fileBlob,
//                        Supporting_Document_Id__c = supportingDocument.Id,
                        Origin = 'C'
                );
                insert contentVersion;

            }
            String baseUrl = Url.getOrgDomainUrl().toExternalForm();
            recordUrl = baseUrl + '/' + supportingDocument.Id;
        }

        return recordUrl;
    }
}