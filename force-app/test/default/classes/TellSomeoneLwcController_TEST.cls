/**
 * Created by nguy0092 on 9/15/2026.
 */

@IsTest
private class TellSomeoneLwcController_TEST {

    @TestSetup
    public static void testSetup() {
        Contact testDefaultReporter = new Contact (
                FirstName = 'Etl',
                LastName = 'User',
                Email = 'salesforce@stthomas.edu'
        );
        insert testDefaultReporter;

        Contact testContact = new Contact (
                FirstName = 'Testfname',
                LastName = 'Testlname',
                St_Thomas_Connection__c = 'Staff',
                hed__UniversityEmail__c = 'testemail@testemail.edu',
                University_Banner_ID__c = '123456789'
        );
        insert testContact;

        Account universityAccount = new Account(
                Name = 'Test University',
                RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Administrative').getRecordTypeId()
        );
        insert universityAccount;

        Account universityDepartment = new Account(
                Name = 'Test Department',
                RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('University Department').getRecordTypeId()
        );
        insert universityDepartment;

        hed__Term__c currentTerm = new hed__Term__c(
                hed__Start_Date__c = System.today().addMonths(-12),
                hed__End_Date__c = System.today().addMonths(12),
                Name = 'Season ' + String.valueOf(System.today().year()),
                hed__Account__c = universityAccount.Id
        );
        insert currentTerm;

        hed__Course__c testCourse = new hed__Course__c(
                Name = 'Test Course',
                hed__Account__c = universityDepartment.Id,
                Active__c = true
        );
        insert testCourse;

        hed__Course_Offering__c testCourseOffering = new hed__Course_Offering__c(
                Name = 'Test Course Offering',
                hed__Course__c = testCourse.Id,
                hed__Term__c = currentTerm.Id,
                hed__Faculty__c = testContact.Id
        );
        insert testCourseOffering;
    }

    @IsTest
    public static void testIAmContactInfo() {
        Contact testContact = [
                SELECT Id,
                        University_Banner_ID__c
                FROM Contact
                WHERE University_Banner_ID__c = '123456789'
                LIMIT 1
        ];
        String sfId = testContact.Id;
        String bId = '';

        Test.startTest();
        List<Contact> iAmContact = TellSomeoneLwcController.iAmContactInfo(sfId, bId);
        System.assertEquals('123456789', iAmContact[0].University_Banner_ID__c);
        System.assertEquals('Faculty', iAmContact[0].St_Thomas_Connection__c);
        Test.stopTest();
    }

    @IsTest
    public static void testSubmitBiasIncidentReportForm() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        Map<String, Object> formValues = new Map<String, Object>{ 'reporterType' => 'Faculty' };

        Test.startTest();
        String biasIncidentReportNumber = TellSomeoneLwcController.submitBiasIncidentReportForm(formValues);
        Test.stopTest();

        System.assertEquals('ADV-123', biasIncidentReportNumber);
    }

    @IsTest
    public static void testSubmitWellBeingReportForm() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        Map<String, Object> formValues = new Map<String, Object>{ 'reporterType' => 'Faculty' };

        Test.startTest();
        String wellBeingReportNumber = TellSomeoneLwcController.submitWellBeingReportForm(formValues);
        Test.stopTest();

        System.assertEquals('ADV-123', wellBeingReportNumber);
    }

    @IsTest
    public static void testSubmitTitleIxReportForm() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        Map<String, Object> formValues = new Map<String, Object>{ 'reporterType' => 'Faculty' };

        Test.startTest();
        String titleIxReportNumber = TellSomeoneLwcController.submitTitleIxReportForm(formValues);
        Test.stopTest();

        System.assertEquals('TIX-123', titleIxReportNumber);
    }

    @IsTest
    public static void testGetBiasIncidentOptions() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        Test.startTest();
        Map<String, Object> result = TellSomeoneLwcController.getBiasIncidentOptions();
        Test.stopTest();

        System.assert(result.containsKey('reporterType'));
        System.assert(result.containsKey('affiliationOfHarmedParty'));
        System.assert(result.containsKey('affiliationOfThePersonWhoCausedHarm'));
    }

    @IsTest
    public static void testGetWellBeingOptions() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        Test.startTest();
        Map<String, Object> result = TellSomeoneLwcController.getWellBeingOptions();
        Test.stopTest();

        System.assert(result.containsKey('reporterType'));
        System.assert(result.containsKey('affiliationOfThePersonOfConcern'));
    }

    @IsTest
    public static void testGetTitleIxReportingOptions() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        Test.startTest();
        Map<String, Object> result = TellSomeoneLwcController.getTitleIxReportingOptions();
        Test.stopTest();

        System.assert(result.containsKey('reporterType'));
        System.assert(result.containsKey('statusOfIndividualWhoCausedHarm'));
    }

    @IsTest
    public static void testSubmitCaseRecord() {
            Map<String, String> testFormSelections = new Map<String, String>{
                    'IAmValue' => 'Faculty',
                    'IAmContactId' => '',
                    'IAmFirstName' => 'Testfname',
                    'IAmLastName' => 'Testlname',
                    'IAmEmail' => 'testemail@testemail.edu',
                    'IAmPhone' => '6515555555',
                    'ConcernedWhoValue' => 'Student',
                    'ConcernedWhoFirstName' => 'Concernedfname',
                    'ConcernedWhoLastName' => 'Concernedlname',
                    'ConcernedWhoEmail' => 'concernedemail@testemail.edu',
                    'ConcernedWhoPhone' => '65111111111',
                    'ConcernedWhatValue' => 'I would like to submit an information report that does not fit the criteria of any of the above reports',
                    'ConcernedWhatAdditionalInfo' => 'This is a test'
            };

            Test.startTest();
            Boolean submitCaseRecordFail = TellSomeoneLwcController.submitCaseRecord(testFormSelections);
            System.assertEquals(false, submitCaseRecordFail);
            Test.stopTest();
    }

    @IsTest
    public static void testSaveSupportingDocuments() {
            List<TellSomeoneLwcController.DocumentsWrapper> testDocumentsList = new List<TellSomeoneLwcController.DocumentsWrapper>();
            TellSomeoneLwcController.DocumentsWrapper testDocuments = new TellSomeoneLwcController.DocumentsWrapper();
            testDocuments.fileId = '1234';
            testDocuments.fileContent = EncodingUtil.base64Encode(Blob.valueOf('This is a test'));
            testDocuments.fileName = 'Test Document.txt';
            testDocuments.fileSize = '';
            testDocuments.fileType = '';
            testDocumentsList.add(testDocuments);
            String supportingDocumentNameType = 'Advocate Bias Incident';

            Test.startTest();
            Map<String, String> saveSupportingDocumentsResults = TellSomeoneLwcController.saveSupportingDocuments(testDocumentsList, supportingDocumentNameType);
            System.assertEquals('success', saveSupportingDocumentsResults.get('Status'));
            Test.stopTest();
    }

    @IsTest
    public static void testUpdateSupportingDocument() {
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

            Supporting_Document__c testSupportingDocument = new Supporting_Document__c(
                    RecordTypeId = recordType,
                    Name = 'Advocate Bias Incident',
                    Source__c = 'Tell Someone',
                    Document_Load_Date__c = Date.today()
            );
            insert testSupportingDocument;

            Test.startTest();
            TellSomeoneLwcController.updateSupportingDocument(testSupportingDocument.Id, '0605-2025');
            Test.stopTest();

            Supporting_Document__c updatedDocument = [
                    SELECT Supporting_Document_Unique_External_ID__c
                    FROM Supporting_Document__c
                    WHERE Id = :testSupportingDocument.Id
            ];
            System.assertEquals('0605-2025', updatedDocument.Supporting_Document_Unique_External_ID__c);
    }

    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest request) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);

            if (request.getMethod() == 'POST' && request.getEndpoint().contains('titleix_reports')) {
                res.setBody('{"reportNo":"TIX-123"}');
            } else if (request.getMethod() == 'POST' && request.getEndpoint().contains('/cases')) {
                res.setBody('{"reportNumber":"ADV-123"}');
            } else {
                res.setBody('[]');
            }

            return res;
        }
    }

}