/**
 * Created by nguy0092 on 9/16/2026.
 */

@IsTest
private class TommieAlertsLwcController_TEST {

    @TestSetup
    public static void testSetup() {
        Account universityAccount = new Account(
                Name = 'Test University',
                RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Administrative').getRecordTypeId()
        );
        insert universityAccount;

        hed__Term__c currentTerm = new hed__Term__c(
                hed__Start_Date__c = System.today().addMonths(-12),
                hed__End_Date__c = System.today().addMonths(12),
                Name = 'Season ' + String.valueOf(System.today().year()),
                hed__Account__c = universityAccount.Id
        );
        insert currentTerm;

        Contact student = new Contact(
                FirstName = 'Test',
                LastName = 'Student',
                University_Banner_ID__c = '1111111112',
                hed__UniversityEmail__c = 'test-student@test.com',
                Email = 'test-student@test.com'
        );
        insert student;

        Contact primaryAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Advisor',
                University_Banner_ID__c = '1111111111',
                hed__UniversityEmail__c = 'test-advisor@test.com',
                Email = 'test-advisor@test.com'
        );
        insert primaryAdvisor;

        hed__Relationship__c primaryAdvisorRelationship = new hed__Relationship__c(
                hed__Contact__c = primaryAdvisor.Id,
                hed__Type__c = 'Primary Advisor',
                hed__RelatedContact__c = student.Id,
                Effective_Term__c = currentTerm.Id
        );
        insert primaryAdvisorRelationship;

        Contact facultyAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Faculty',
                University_Banner_ID__c = '1111111113',
                hed__UniversityEmail__c = 'test-facultyt@test.com',
                Email = 'test-facultyt@test.com'
        );
        insert facultyAdvisor;

        hed__Relationship__c facAdvisorRelationship = new hed__Relationship__c(
                hed__Contact__c = facultyAdvisor.Id,
                hed__Type__c = 'Faculty Advisor',
                hed__RelatedContact__c = student.Id,
                Effective_Term__c = currentTerm.Id
        );
        insert facAdvisorRelationship;

        Account courseAccount = new Account(
                Name = 'Test College',
                RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('University Department').getRecordTypeId()
        );
        insert courseAccount;

        hed__Course__c course = new hed__Course__c(
                Name = 'Test Course Title',
                hed__Account__c = courseAccount.Id
        );
        insert course;

        hed__Course_Offering__c courseOffering = new hed__Course_Offering__c(
                Name = 'Course',
                Course_Title__c = 'Test Course Title',
                hed__Section_ID__c = '01',
                hed__Faculty__c = facultyAdvisor.Id,
                hed__Term__c = currentTerm.Id,
                hed__Course__c = course.Id,
                Course_CRN__c = '12345'
        );
        insert courseOffering;

        hed__Course_Enrollment__c courseEnrollment = new hed__Course_Enrollment__c(
                hed__Contact__c = student.Id,
                hed__Course_Offering__c = courseOffering.Id,
                Registration_Code__c = 'OR',
                RecordTypeId = Schema.SObjectType.hed__Course_Enrollment__c.getRecordTypeInfosByName().get('Student').getRecordTypeId()
        );
        insert courseEnrollment;
    }

    @IsTest
    static void testGetTommieCaresPicklists() {
        Test.startTest();
        Map<String, List<TommieAlertsLwcController.PicklistOption>> result = TommieAlertsLwcController.getTommieCaresPicklists();
        Test.stopTest();

        System.assert(result.containsKey('tommieCaresReasons'));
        System.assert(result.containsKey('tommieHigh5Reasons'));
        System.assert(result.containsKey('academicPerformanceReasons'));
        System.assert(result.containsKey('attendanceConcernsReasons'));
    }

    @IsTest
    static void testTommieAlertsLwcCase() {

        Test.startTest();

        Map<String, String> currentTermAdvisor = TommieAlertsLwcController.currentTermAdvisor('1111111113');
        System.assert(currentTermAdvisor.size() > 0);

        List<Map<String, String>> advisorCoursesList = TommieAlertsLwcController.advisorCoursesList(currentTermAdvisor.get('Advisor_ContactId'), '12345');
        System.assert(advisorCoursesList.size() > 0);

        List<hed__Course_Enrollment__c> studentCourseList = TommieAlertsLwcController.studentCourseList('1111111112', advisorCoursesList[0].get('value'));
        System.assert(studentCourseList.size() > 0);

        Map<String, String> formSubmitSelections = new Map<String, String>{
                'currentTermId' => currentTermAdvisor.get('Current_Term'),
                'AdvisorContactId' => currentTermAdvisor.get('Advisor_ContactId'),
                'AdvisorEmail' => currentTermAdvisor.get('Advisor_Email'),
                'CourseSelectionId' => advisorCoursesList[0].get('value'),
                'StudentContactId' => studentCourseList[0].hed__Contact__r.Id,
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

        Boolean caseSubmittedErrorCheck = TommieAlertsLwcController.submitTommieAlertsCase(formSubmitSelections);
        System.assertEquals(false, caseSubmittedErrorCheck);

        List<Case> savedCases = [
                SELECT Id, Subject, Origin, Case_Reporter__c, Alert_Term_lookup__c, Course_Connection__c, ContactId,
                        Course_Offering__c
                FROM Case
                WHERE ContactId = :studentCourseList[0].hed__Contact__r.Id
        ];

        System.assertEquals(savedCases.size(), 1);
        System.assertEquals(savedCases[0].Origin, 'Web');
        System.assertEquals(savedCases[0].Subject, 'Tommie Cares');
        System.assertEquals(savedCases[0].ContactId, studentCourseList[0].hed__Contact__r.Id);
        System.assertEquals(savedCases[0].Course_Offering__c, advisorCoursesList[0].get('value'));

        Test.stopTest();
    }
}