/**
 * Created by nguy0092 on 9/16/2026.
 */

@IsTest
private class TommieAlertsAdvgStudtLwcController_TEST {

    @TestSetup
    public static void testSetup() {
        Contact student = new Contact(
                FirstName = 'Test',
                LastName = 'Student',
                University_Banner_ID__c = '2222222221',
                hed__UniversityEmail__c = 'test-advstudent@test.com',
                Email = 'test-advstudent@test.com',
                St_Thomas_Connection__c = 'Student'
        );
        insert student;

        Contact primaryAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Advisor',
                University_Banner_ID__c = '2222222222',
                hed__UniversityEmail__c = 'test-advstudent-advisor@test.com',
                Email = 'test-advstudent-advisor@test.com',
                St_Thomas_Connection__c = 'Staff'
        );
        insert primaryAdvisor;

        hed__Relationship__c primaryAdvisorRelationship = new hed__Relationship__c(
                hed__Contact__c = primaryAdvisor.Id,
                hed__Type__c = 'Primary Advisor',
                hed__RelatedContact__c = student.Id,
                hed__Status__c = 'Current'
        );
        insert primaryAdvisorRelationship;
    }

    @IsTest
    static void testGetTommieCaresPicklists() {
        Test.startTest();
        Map<String, List<TommieAlertsAdvisingStudentLwcController.PicklistOption>> result = TommieAlertsAdvisingStudentLwcController.getTommieCaresPicklists();
        Test.stopTest();

        System.assert(result.containsKey('tommieCaresReasons'));
        System.assert(result.containsKey('tommieHigh5Reasons'));
    }

    @IsTest
    static void testAdvisorInformation() {
        Test.startTest();
        Contact advisorContact = TommieAlertsAdvisingStudentLwcController.advisorInformation('2222222222');
        Test.stopTest();

        System.assertEquals('2222222222', advisorContact.University_Banner_ID__c);
        System.assertEquals('Advisor', advisorContact.LastName);
    }

    @IsTest
    static void testAdvisorInformationBlankBannerId() {
        Test.startTest();
        Contact advisorContact = TommieAlertsAdvisingStudentLwcController.advisorInformation('');
        Test.stopTest();

        System.assertEquals(null, advisorContact.Id);
    }

    @IsTest
    static void testSearchStudentByBanner() {
        Test.startTest();
        List<Contact> matches = TommieAlertsAdvisingStudentLwcController.searchStudent('banner', '2222222221', 'Student', null);
        Test.stopTest();

        System.assertEquals(1, matches.size());
        System.assertEquals('2222222221', matches[0].University_Banner_ID__c);
    }

    @IsTest
    static void testSearchStudentByBannerMissingLastName() {
        Test.startTest();
        List<Contact> matches = TommieAlertsAdvisingStudentLwcController.searchStudent('banner', '2222222221', '', null);
        Test.stopTest();

        System.assert(matches.isEmpty());
    }

    @IsTest
    static void testSearchStudentByEmail() {
        Test.startTest();
        List<Contact> matches = TommieAlertsAdvisingStudentLwcController.searchStudent('email', null, null, 'test-advstudent@test.com');
        Test.stopTest();

        System.assertEquals(1, matches.size());
        System.assertEquals('test-advstudent@test.com', matches[0].hed__UniversityEmail__c);
    }

    @IsTest
    static void testSearchStudentByEmailBlank() {
        Test.startTest();
        List<Contact> matches = TommieAlertsAdvisingStudentLwcController.searchStudent('email', null, null, '');
        Test.stopTest();

        System.assert(matches.isEmpty());
    }

    @IsTest
    static void testSearchStudentInvalidMode() {
        Test.startTest();
        List<Contact> matches = TommieAlertsAdvisingStudentLwcController.searchStudent('invalid', '2222222221', 'Student', null);
        Test.stopTest();

        System.assert(matches.isEmpty());
    }

    @IsTest
    static void testSearchStudentBlankSearchMode() {
        Test.startTest();
        List<Contact> matches = TommieAlertsAdvisingStudentLwcController.searchStudent('', '2222222221', 'Student', null);
        Test.stopTest();

        System.assert(matches.isEmpty());
    }

    @IsTest
    static void testNormalizeLastName() {
        System.assertEquals('oconnor', TommieAlertsAdvisingStudentLwcController.normalizeLastName('O\'Connor'));
        System.assertEquals('smithjones', TommieAlertsAdvisingStudentLwcController.normalizeLastName('Smith-Jones'));
        System.assertEquals('vandyke', TommieAlertsAdvisingStudentLwcController.normalizeLastName(' Van Dyke '));
        System.assertEquals('', TommieAlertsAdvisingStudentLwcController.normalizeLastName(null));
    }

    @IsTest
    static void testSubmitTommieAlertsAdvisingStudent() {
        Contact student = [SELECT Id FROM Contact WHERE University_Banner_ID__c = '2222222221' LIMIT 1];
        Contact advisor = [SELECT Id, hed__UniversityEmail__c FROM Contact WHERE University_Banner_ID__c = '2222222222' LIMIT 1];

        Map<String, String> formSubmitSelections = new Map<String, String>{
                'AdvisorContactId' => advisor.Id,
                'AdvisorEmail' => advisor.hed__UniversityEmail__c,
                'StudentContactId' => student.Id,
                'TommieCares_Reasons' => '',
                'High5_Reasons' => '',
                'Attendance_Reasons' => '',
                'Academic_Reasons' => '',
                'High5_Details' => '',
                'Pass_Course_Selection' => '',
                'Other_Details' => '',
                'Personal_Message' => '',
                'Additional_Concerns' => '',
                'TellSomeoneSubmission' => 'false',
                'submitWellBeingFormFail' => 'false',
                'TellSomeoneWellBeingReportNumber' => '',
                'submitTitleIxIncidentFormFail' => 'false',
                'TellSomeoneTitleIxReportNumber' => ''
        };

        Test.startTest();
        Boolean caseSubmittedErrorCheck = TommieAlertsAdvisingStudentLwcController.submitTommieAlertsAdvisingStudent(formSubmitSelections);
        Test.stopTest();

        System.assertEquals(false, caseSubmittedErrorCheck);

        List<Case> savedCases = [
                SELECT Id, Subject, Origin, Case_Reporter__c, ContactId, Primary_Advisor_Contact__c
                FROM Case
                WHERE ContactId = :student.Id
        ];

        System.assertEquals(1, savedCases.size());
        System.assertEquals('Web', savedCases[0].Origin);
        System.assertEquals('Tommie Cares', savedCases[0].Subject);
        System.assertEquals(advisor.Id, savedCases[0].Case_Reporter__c);
        System.assertEquals(advisor.Id, savedCases[0].Primary_Advisor_Contact__c);
    }
}