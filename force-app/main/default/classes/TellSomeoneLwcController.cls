/**
 * Created by nguy0092 on 6/22/2026.
 */

public without sharing class TellSomeoneLwcController {
    private static final String symplicityAdvocateIntegrationKeyCallout = 'callout:Symplicity_Advocate_Integration_Key';
    private static final String symplicityAdvocateFlexFormTokenCallout = 'callout:Symplicity_Advocate_Flex_Forms';

    @AuraEnabled(Cacheable=true)
    public static Map<String, List<PicklistOption>> getTellSomeonePicklists() {
        Map<String, List<PicklistOption>> result = new Map<String, List<PicklistOption>>();

        result.put('tellSomeoneReporterType', getPicklistOptions(Case.Community_Concern_Reporter_Type__c));
        result.put('tellSomeoneWhoType', getPicklistOptions(Case.Community_Concern_Who_Type__c));
        result.put('tellSomeoneWhatType', getPicklistOptions(Case.Community_Concern__c));

        return result;
    }

    private static List<PicklistOption> getPicklistOptions(Schema.SObjectField fieldToken) {
        List<PicklistOption> options = new List<PicklistOption>();
        Schema.DescribeFieldResult dfr = fieldToken.getDescribe();

        for (Schema.PicklistEntry entry : dfr.getPicklistValues()) {
            if (entry.isActive()) {
                options.add(new PicklistOption(entry.getLabel(), entry.getValue()));
            }
        }
        return options;
    }

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
    public static Map<String, Object> getWellBeingOptions() {
        Map<String, Object> resultsObjects = new Map<String, Object>();

        HttpRequest req1 = new HttpRequest();
        req1.setEndpoint(symplicityAdvocateFlexFormTokenCallout + '/v1/picklists/fw/6320164b2a4a1fad79299ed27d892c07/cases/reporter_type');
        req1.setMethod('GET');

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint(symplicityAdvocateFlexFormTokenCallout + '/v1/picklists/fw/6320164b2a4a1fad79299ed27d892c07/cases/affiliation_of_the_person_of_concern');
        req2.setMethod('GET');

        Http http = new Http();
        HttpResponse response1 = http.send(req1);
        HttpResponse response2 = http.send(req2);

        System.debug('Response1 Code: ' + response1.getStatusCode());
        System.debug('Response2 Code: ' + response2.getStatusCode());

        if (response1.getStatusCode() == 200) {
            resultsObjects.put('reporterType', response1.getBody());
        } else {
            System.debug('getWellBeingOptions Errors: response1 code=' + response1.getStatusCode());
        }

        if (response2.getStatusCode() == 200) {
            resultsObjects.put('affiliationOfThePersonOfConcern', response2.getBody());
        } else {
            System.debug('getWellBeingOptions Errors: response2 code=' + response2.getStatusCode());
        }

        return resultsObjects;
    }

    @AuraEnabled(Cacheable=true)
    public static Map<String, Object> getBiasIncidentOptions() {
        Map<String, Object> resultsObjects = new Map<String, Object>();

        HttpRequest req1 = new HttpRequest();
        req1.setEndpoint(symplicityAdvocateFlexFormTokenCallout + '/v1/picklists/fw/6320164b2a4a1fad79299ed27d892c07/cases/reporter_type');
        req1.setMethod('GET');

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint(symplicityAdvocateFlexFormTokenCallout + '/v1/picklists/fw/6320164b2a4a1fad79299ed27d892c07/cases/affiliation_of_harmed_party');
        req2.setMethod('GET');

        HttpRequest req3 = new HttpRequest();
        req3.setEndpoint(symplicityAdvocateFlexFormTokenCallout + '/v1/picklists/fw/6320164b2a4a1fad79299ed27d892c07/cases/affiliation_of_person_who_caused_harm');
        req3.setMethod('GET');

        Http http = new Http();
        HttpResponse response1 = http.send(req1);
        HttpResponse response2 = http.send(req2);
        HttpResponse response3 = http.send(req3);

        System.debug('Response1 Code: ' + response1.getStatusCode());
        System.debug('Response2 Code: ' + response2.getStatusCode());
        System.debug('Response3 Code: ' + response3.getStatusCode());

        if (response1.getStatusCode() == 200) {
            resultsObjects.put('reporterType', response1.getBody());
        } else {
            System.debug('getBiasIncidentOptions Errors: response1 code=' + response1.getStatusCode());
        }

        if (response2.getStatusCode() == 200) {
            resultsObjects.put('affiliationOfHarmedParty', response2.getBody());
        } else {
            System.debug('getBiasIncidentOptions Errors: response2 code=' + response2.getStatusCode());
        }

        if (response3.getStatusCode() == 200) {
            resultsObjects.put('affiliationOfThePersonWhoCausedHarm', response3.getBody());
        } else {
            System.debug('getBiasIncidentOptions Errors: response3 code=' + response3.getStatusCode());
        }

        return resultsObjects;
    }

    @AuraEnabled(Cacheable=true)
    public static Map<String, Object> getTitleIxReportingOptions() {
        Map<String, Object> resultsObjects = new Map<String, Object>();

        HttpRequest req1 = new HttpRequest();
        req1.setEndpoint(symplicityAdvocateIntegrationKeyCallout + '/v1/picklists/titleix_reports/reporterType');
        req1.setMethod('GET');

        HttpRequest req2 = new HttpRequest();
        req2.setEndpoint(symplicityAdvocateIntegrationKeyCallout + '/v1/picklists/titleix_reports/status_of_individual_who_caused_harm');
        req2.setMethod('GET');

        Http http = new Http();
        HttpResponse response1 = http.send(req1);
        HttpResponse response2 = http.send(req2);

        System.debug('Response1 Code: ' + response1.getStatusCode());
        System.debug('Response2 Code: ' + response2.getStatusCode());

        if (response1.getStatusCode() == 200) {
            resultsObjects.put('reporterType', response1.getBody());
        } else {
            System.debug('getTitleIxReportingOptions Errors: response1 code=' + response1.getStatusCode());
        }

        if (response2.getStatusCode() == 200) {
            resultsObjects.put('statusOfIndividualWhoCausedHarm', response2.getBody());
        } else {
            System.debug('getTitleIxReportingOptions Errors: response2 code=' + response2.getStatusCode());
        }

        return resultsObjects;
    }

    @AuraEnabled(Cacheable=false)
    public static String submitTitleIxReportForm(String formValues) {
        String titleIxReportNumber = '';

        HttpRequest req = new HttpRequest();
        req.setEndpoint(symplicityAdvocateIntegrationKeyCallout + '/v1/titleix_reports');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setBody(formValues);

        try {
            Http http = new Http();
            HttpResponse response = http.send(req);
            System.debug('Response: ' + response.getBody());
            if (response.getStatusCode() == 200 || response.getStatusCode() == 201) {
                Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                titleIxReportNumber = (String) responseBody.get('reportNo'); //for TitleIX report number
            }
        } catch (Exception e) {
            System.debug('Error submitting request: ' + e.getMessage());
        }

        return titleIxReportNumber;
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

        if (!attachedDocumentsList.isEmpty()) {
            String recordType = Schema.SObjectType.Supporting_Document__c.getRecordTypeInfosByDeveloperName().get('Current_Student_Restricted').getRecordTypeId();
            Supporting_Document__c supportingDocument = new Supporting_Document__c(
                    RecordTypeId = recordType,
                    Name = supportingDocumentName,
//                    Source__c = 'Community of Concern',
                    Source__c = 'Tell Someone',
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

    @AuraEnabled(Cacheable=false)
    public static void updateSupportingDocument(String supportingDocumentId, String advocateReportNumber) {
        String updateStatus = '';

        if (String.isNotBlank(supportingDocumentId) && String.isNotBlank(advocateReportNumber)) {
            Id validSupportDocumentId;
            try {
                validSupportDocumentId = Id.valueOf(supportingDocumentId);
            } catch (System.StringException e) {
                updateStatus = 'failed';
                System.debug('updateSupportingDocument invalid Id: ' + e);
            }

            try {
                Supporting_Document__c supportingDocument = new Supporting_Document__c(
                        Id = validSupportDocumentId,
                        Supporting_Document_Unique_External_ID__c = advocateReportNumber
                );
                update supportingDocument;
                updateStatus = 'success';
                System.debug('updateSupportingDocument status: ' + updateStatus);
            } catch (DmlException e) {
                updateStatus = 'failed';
                System.debug('updateSupportingDocument DML error: ' + e);
            }
        }
    }

    @AuraEnabled(Cacheable=false)
    public static void deleteSupportingDocument(String supportingDocumentId) {
        String deleteStatus = '';

        if (String.isNotBlank(supportingDocumentId)) {
            Id validSupportDocumentId;
            try {
                validSupportDocumentId = Id.valueOf(supportingDocumentId);
            } catch (System.StringException e) {
                deleteStatus = 'failed';
                System.debug('deleteSupportingDocument invalid Id: ' + e);
            }

            try {
                Supporting_Document__c supportingDocument = new Supporting_Document__c(
                        Id = validSupportDocumentId
                );
                delete supportingDocument;
                deleteStatus = 'success';
                System.debug('deleteSupportingDocument status: ' + deleteStatus);
            } catch (DmlException e) {
                deleteStatus = 'failed';
                System.debug('deleteSupportingDocument DML error: ' + e);
            }
        }
    }

    public class PicklistOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;

        public PicklistOption(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
}