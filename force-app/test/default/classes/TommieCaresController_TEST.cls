/**
 * Created by Thaddaeus Dahlberg, Software Engineer, University of St. Thomas on 8/29/2023.
 */


@IsTest
private class TommieCaresController_TEST {

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

        Contact primaryAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Advisor',
                University_Banner_ID__c = '1111111111',
                hed__UniversityEmail__c = 'test-advisor@test.com',
                Email = 'test-advisor@test.com'
        );
        insert primaryAdvisor;

        Contact student = new Contact(
                FirstName = 'Test',
                LastName = 'Student',
                University_Banner_ID__c = '1111111112',
                hed__UniversityEmail__c = 'test-student@test.com',
                Banner_Primary_Advisor__c = primaryAdvisor.Id
        );
        insert student;

        Contact facultyAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Faculty',
                University_Banner_ID__c = '1111111113',
                hed__UniversityEmail__c = 'test-facultyt@test.com'
        );
        insert facultyAdvisor;

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
                hed__Faculty__c = facultyAdvisor.Id,
                hed__Term__c = currentTerm.Id,
                hed__Course__c = course.Id
        );
        insert courseOffering;

        hed__Course_Enrollment__c courseEnrollment = new hed__Course_Enrollment__c(
                hed__Contact__c = student.Id,
                hed__Course_Offering__c = courseOffering.Id,
                RecordTypeId =  Schema.SObjectType.hed__Course_Enrollment__c.getRecordTypeInfosByName().get('Student').getRecordTypeId()
        );
        insert courseEnrollment;
    }

    @IsTest
    static void testBehavior() {

        PageReference pageRef = Page.TommieCares;
        pageRef.getParameters().put('bid', '1111111113');
        pageRef.getParameters().put('submitted', 'true');
        Test.setCurrentPage(pageRef);
        Test.startTest();
        TommieCaresController tcc = new TommieCaresController();

        //Get the course by faculty banner id
        System.assertEquals('Course - Test Course Title', tcc.courses[1].getLabel());

        //Set the course id to get student list
        tcc.studentCourseConnection = tcc.courses[1].getValue();
        System.debug(tcc.courses[1].getValue());

        List<SelectOption> studentOptions = tcc.getStudentsOptions();

        List<SelectOption> primaryReason = tcc.getPrimaryReasonOptions();
        System.assert(primaryReason.size() > 0);

        List<SelectOption> academicConcerns = tcc.getAcademicConcernOptions();
        System.assert(academicConcerns.size() > 0);

        List<SelectOption> attendanceConcerns = tcc.getAttendanceConcernsOptions();
        System.assert(attendanceConcerns.size() > 0);

        List<SelectOption> highFives = tcc.getTommieHigh5ReasonOptions();
        System.assert(highFives.size() > 0);

        tcc.saveCase();

        //Case savedCase = [Select Id FROM Case ContactId = student.];


        System.debug(studentOptions);
        Test.stopTest();

    }
}