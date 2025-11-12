/**
 * Created by nguy0092 on 7/27/2025.
 */

public without sharing class CommunityOfConcernLwcController {
    private static String incident_api_token = (String) Advocate_Symplicity_API_Token__mdt.getInstance('Api_Token').get('Bias_Incident__c');
    private static String titleix_api_token = (String) Advocate_Symplicity_API_Token__mdt.getInstance('Api_Token').get('Title_IX__c');

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

        if (iAmContact.size() > 0 && iAmContact[0]?.St_Thomas_Connection__c != 'Faculty') {
            List<hed__Course_Offering__c> facultyCheck = [
                    SELECT Id
                    FROM hed__Course_Offering__c
                    WHERE Current_Term__c = TRUE
                    AND hed__Faculty__r.University_Banner_ID__c = :iAmContact[0].University_Banner_ID__c
                    WITH SECURITY_ENFORCED
            ];

            if (facultyCheck.size() > 0) {
                iAmContact[0].St_Thomas_Connection__c = 'Faculty';
            }
        }

        return iAmContact;
    }

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object incidentReportingFormOptions1() {
        Continuation con = new Continuation(60);
        con.continuationMethod = 'incidentProcessGetResponse1';
        con.state = 'Picklist Values';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/reporterType');
        req.setMethod('GET');
        req.setHeader('Authorization', incident_api_token);
        con.addHttpRequest(req);

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/who_are_you_concerned_about');
        req2.setMethod('GET');
        req2.setHeader('Authorization', incident_api_token);
        con.addHttpRequest(req2);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> incidentProcessGetResponse1(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();
        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);
        HttpResponse response2 = Continuation.getResponse(labels[1]);

        if (response1.getStatusCode() == 200 && response2.getStatusCode() == 200) {
            resultsObjects.add(response1.getBody());
            resultsObjects.add(response2.getBody());
        } else {
            System.debug('incidentProcessGetResponse1 Error: response1.getStatusCode() or response2.getStatusCode()');
        }

        return resultsObjects;
    }

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object incidentReportingFormOptions2() {
        Continuation con = new Continuation(60);
        con.continuationMethod = 'incidentProcessGetResponse2';
        con.state='Picklist Values';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/affiliation_of_target');
        req.setMethod('GET');
        req.setHeader('Authorization', incident_api_token);
        con.addHttpRequest(req);

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/incidents/affiliation_of_person_engaged_in_harm');
        req2.setMethod('GET');
        req2.setHeader('Authorization', incident_api_token);
        con.addHttpRequest(req2);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> incidentProcessGetResponse2(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();
        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);
        HttpResponse response2 = Continuation.getResponse(labels[1]);

        if (response1.getStatusCode() == 200 && response2.getStatusCode() == 200) {
            resultsObjects.add(response1.getBody());
            resultsObjects.add(response2.getBody());
        } else {
            System.debug('incidentProcessGetResponse2 Error: response1.getStatusCode() or response2.getStatusCode()');
        }

        return resultsObjects;
    }

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object titleIxReportingFormOptions1() {
        Continuation con = new Continuation(60);
        con.continuationMethod = 'titleIxProcessGetResponse1';
        con.state='Picklist Values';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/titleix_reports/reporterType');
        req.setMethod('GET');
        req.setHeader('Authorization', titleix_api_token);
        con.addHttpRequest(req);

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/titleix_reports/status_of_individual_who_caused_harm');
        req2.setMethod('GET');
        req2.setHeader('Authorization', titleix_api_token);
        con.addHttpRequest(req2);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> titleIxProcessGetResponse1(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();
        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);
        HttpResponse response2 = Continuation.getResponse(labels[1]);

        if (response1.getStatusCode() == 200 && response2.getStatusCode() == 200)  {
            resultsObjects.add(response1.getBody());
            resultsObjects.add(response2.getBody());
        } else {
            System.debug('titleIxProcessGetResponse1 Error: response1.getStatusCode() or response2.getStatusCode()');
        }

        return resultsObjects;
    }

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object submitForm(String formValues, String formType) {
//        System.debug('This form values: '+formValues);
        Continuation con = new Continuation(60);
        con.continuationMethod = 'submitFormProcessPostResponse';
        con.state = 'Form Submitted';

        HttpRequest req = new HttpRequest();

        if (formType == 'titleix') {
            req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/titleix_reports');
            req.setHeader('Authorization', titleix_api_token);
        } else if (formType == 'bias' || formType == 'wellbeing') {
            req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/incidents');
            req.setHeader('Authorization', incident_api_token);
        }

        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setBody(formValues);
        con.addHttpRequest(req);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> submitFormProcessPostResponse(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();

        // Get the response by using the unique label
        HttpResponse response = Continuation.getResponse(labels[0]);
        resultsObjects.add(response.getStatusCode());

        // Get Incident or TitleIX submitted form report number to update on Supporting Document
        Map<String, String> reportNumber = new Map<String, String>{
                'reportNumber' => ''
        };

        String formResponseReportNumber = '';
        if (response.getStatusCode() == 201) {
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            String incidentReportNumber = (String) responseBody.get('reportNumber'); //for Bias or Well Being reports
            String titleIxReportNumber = (String) responseBody.get('reportNo'); //for TitleIX reports
            formResponseReportNumber = String.isNotBlank(incidentReportNumber) ? incidentReportNumber : titleIxReportNumber;
        }
        reportNumber.put('reportNumber', formResponseReportNumber);
        resultsObjects.add(reportNumber);

//        System.debug('This result getStatusCode: '+response.getStatusCode());
//        System.debug('This result getBody: '+response.getBody());

        return resultsObjects;
    }

    @AuraEnabled(Cacheable=false)
    public static String saveCase(Map<String, String> formSelections) {
        String insertStatus = '';
        Case communityOfConcernCase = new Case();

        List<Contact> defaultReporter = [
                SELECT Id,
                        FirstName,
                        LastName,
                        Email
                FROM Contact
                WHERE FirstName = 'Etl'
                AND LastName = 'User'
                AND Email = 'salesforce@stthomas.edu'
                WITH SECURITY_ENFORCED
                LIMIT 1
        ];

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
        } else {
            if (defaultReporter.size() > 0) {
                communityOfConcernCase.Case_Reporter__c = defaultReporter[0].Id;
            }
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

    @AuraEnabled(Cacheable=false)
    public static String updateSupportingDocument(String supportingDocumentId, String advocateReportNumber) {
        String updateStatus = '';

        Supporting_Document__c supportingDocument = new Supporting_Document__c(
                Id = supportingDocumentId,
                Supporting_Document_Unique_External_ID__c = advocateReportNumber
        );

        try {
            update supportingDocument;
            updateStatus = 'success';
        } catch (DmlException e) {
            updateStatus = 'failed';
            System.debug('updateSupportingDocument error: '+e);
        }

        return updateStatus;
    }
}