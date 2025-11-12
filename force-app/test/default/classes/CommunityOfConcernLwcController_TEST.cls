/**
 * Created by nguy0092 on 9/5/2025.
 */

@IsTest
public class CommunityOfConcernLwcController_TEST {

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
//                Email = 'testemail@testemail.edu', //Used for scratch org testing
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
        List<Contact> iAmContact = CommunityOfConcernLwcController.iAmContactInfo(sfId, bId);
        System.assertEquals('123456789', iAmContact[0].University_Banner_ID__c);
        System.assertEquals('Faculty', iAmContact[0].St_Thomas_Connection__c);
        Test.stopTest();
    }


    @IsTest
    public static void testSubmitForm() {
        // Invoke the continuation by calling the action method
        Continuation conti = (Continuation)CommunityOfConcernLwcController.submitForm('formValues', 'wellbeing');

        // Verify that the continuation has the proper requests
        Map<String, HttpRequest> allRequests = conti.getRequests();
        List<String> keys = new List<String>(allRequests.keySet());
        System.assert(allRequests.size() == 1);
        System.assert(allRequests.get(keys[0]) != null);

        // Perform mock callout
        HttpResponse response = new HttpResponse();
        response.setBody('Mock response body');
        Test.setContinuationResponse(keys[0], response);
        String state = '';
        List<Object> result = CommunityOfConcernLwcController.submitFormProcessPostResponse(keys, state);
        System.debug('Results: '+result);
        System.assertEquals(2, result.size());
    }

    @IsTest
    public static void testIncidentReportingFormOptions1() {
        // Invoke the continuation by calling the action method
        Continuation conti = (Continuation)CommunityOfConcernLwcController.incidentReportingFormOptions1();

        // Verify that the continuation has the proper requests
        Map<String, HttpRequest> allRequests = conti.getRequests();
        List<String> keys = new List<String>(allRequests.keySet());
        System.assert(allRequests.size() == 2);
        System.assert(allRequests.get(keys[0]) != null);

        // Perform mock callout
        HttpResponse response = new HttpResponse();
        response.setBody('Mock response body');
        Test.setContinuationResponse(keys[0], response);
        String state = '';
        List<Object> result = CommunityOfConcernLwcController.incidentProcessGetResponse1(keys, state);
        System.assertEquals(0, result.size());
    }

    @IsTest
    public static void testIncidentReportingFormOptions2() {
        // Invoke the continuation by calling the action method
        Continuation conti = (Continuation)CommunityOfConcernLwcController.incidentReportingFormOptions2();

        // Verify that the continuation has the proper requests
        Map<String, HttpRequest> allRequests = conti.getRequests();
        List<String> keys = new List<String>(allRequests.keySet());
        System.assert(allRequests.size() == 2);
        System.assert(allRequests.get(keys[0]) != null);

        // Perform mock callout
        HttpResponse response = new HttpResponse();
        response.setBody('Mock response body');
        Test.setContinuationResponse(keys[0], response);
        String state = '';
        System.debug('Keys: '+keys);
        List<Object> result = CommunityOfConcernLwcController.incidentProcessGetResponse2(keys, state);
        System.debug('Result: '+result);
        System.assertEquals(0, result.size());
    }

    @IsTest
    public static void testTitleIxReportingFormOptions1() {
        // Invoke the continuation by calling the action method
        Continuation conti = (Continuation)CommunityOfConcernLwcController.titleIxReportingFormOptions1();

        // Verify that the continuation has the proper requests
        Map<String, HttpRequest> allRequests = conti.getRequests();
        List<String> keys = new List<String>(allRequests.keySet());
        System.assert(allRequests.size() == 2);
        System.assert(allRequests.get(keys[0]) != null);

        // Perform mock callout
        HttpResponse response = new HttpResponse();
        response.setBody('Mock response body');
        Test.setContinuationResponse(keys[0], response);
        String state = '';
        List<Object> result = CommunityOfConcernLwcController.titleIxProcessGetResponse1(keys, state);
        System.assertEquals(0, result.size());
    }

    @IsTest
    public static void testSaveCase() {
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
        String saveCaseResult = CommunityOfConcernLwcController.saveCase(testFormSelections);
        System.assertEquals('', saveCaseResult);
        Test.stopTest();
    }

    @IsTest
    public static void testSaveSupportingDocuments() {
        List<CommunityOfConcernLwcController.DocumentsWrapper> testDocumentsList = new List<CommunityOfConcernLwcController.DocumentsWrapper>();
        CommunityOfConcernLwcController.DocumentsWrapper testDocuments = new CommunityOfConcernLwcController.DocumentsWrapper();
        testDocuments.fileId = '1234';
        testDocuments.fileContent = 'This is a test';
        testDocuments.fileName = 'Test Document.txt';
        testDocuments.fileSize = '';
        testDocuments.fileType = '';
        testDocumentsList.add(testDocuments);
        String supportingDocumentNameType = 'Advocate Bias Incident';

        Test.startTest();
        Map<String, String> saveSupportingDocumentsResults = CommunityOfConcernLwcController.saveSupportingDocuments(testDocumentsList, supportingDocumentNameType);
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
                Source__c = 'Community of Concern',
                Document_Load_Date__c = Date.today()
        );
        insert testSupportingDocument;

        Test.startTest();
        String updateSupportingDocumentResult = CommunityOfConcernLwcController.updateSupportingDocument(testSupportingDocument.Id, '0605-2025');
        System.assertEquals('success', updateSupportingDocumentResult);
        Test.stopTest();
    }

}