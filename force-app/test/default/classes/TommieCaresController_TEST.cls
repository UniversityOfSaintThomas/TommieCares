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

        Contact athAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Faculty',
                University_Banner_ID__c = '1111111114',
                hed__UniversityEmail__c = 'test-athfacultyt@test.com',
                Email = 'test-athfacultyt@test.com'
        );
        insert athAdvisor;

        //Student-Athlete Advisor
        hed__Relationship__c athAdvisorRelationship = new hed__Relationship__c(
                hed__Contact__c = athAdvisor.Id,
                hed__Type__c = 'Student-Athlete Advisor',
                hed__RelatedContact__c = student.Id,
                Effective_Term__c = currentTerm.Id
        );
        insert athAdvisorRelationship;

        Contact probAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Faculty',
                University_Banner_ID__c = '1111111115',
                hed__UniversityEmail__c = 'test-probfacultyt@test.com',
                Email = 'test-probfacultyt@test.com'
        );
        insert probAdvisor;
        hed__Relationship__c probAdvisorRelationship = new hed__Relationship__c(
                hed__Contact__c = probAdvisor.Id,
                hed__Type__c = 'Probationary Advisor',
                hed__RelatedContact__c = student.Id,
                Effective_Term__c = currentTerm.Id
        );
        insert probAdvisorRelationship;

        Contact intAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Faculty',
                University_Banner_ID__c = '1111111116',
                hed__UniversityEmail__c = 'test-intfacultyt@test.com',
                Email = 'test-intfacultyt@test.com'
        );
        insert intAdvisor;

        hed__Relationship__c intAdvisorRelationship = new hed__Relationship__c(
                hed__Contact__c = intAdvisor.Id,
                hed__Type__c = 'International Advisor',
                hed__RelatedContact__c = student.Id,
                Effective_Term__c = currentTerm.Id
        );
        insert intAdvisorRelationship;

        Contact finAdvisor = new Contact(
                FirstName = 'Test',
                LastName = 'Faculty',
                University_Banner_ID__c = '1111111117',
                hed__UniversityEmail__c = 'test-finfacultyt@test.co',
                Email = 'test-finfacultyt@test.com'
        );
        insert finAdvisor;

        hed__Relationship__c finAdvisorRelationship = new hed__Relationship__c(
                hed__Contact__c = finAdvisor.Id,
                hed__Type__c = 'Financial Aid Counselor',
                hed__RelatedContact__c = student.Id,
                Effective_Term__c = currentTerm.Id
        );
        insert finAdvisorRelationship;

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
    static void testTommieCaresCase() {

        PageReference pageRef = Page.TommieCares;
        pageRef.getParameters().put('bid', '1111111113');
        pageRef.getParameters().put('sbid', '1111111112');
        pageRef.getParameters().put('crn', '12345');
        pageRef.getParameters().put('submitted', 'true');
        Test.setCurrentPage(pageRef);
        TommieCaresController tcc = new TommieCaresController();

        Test.startTest();
        //Get the course by faculty banner id
        System.assertEquals('Course - 01 (Test Course Title)', tcc.courses[1].getLabel());

        //Set the course id to get student list
        tcc.studentCourseConnection = tcc.courses[1].getValue();
        tcc.tommieCaresCase.Course_Offering__c = tcc.courses[1].getValue();
        List<SelectOption> studentOptions = tcc.getStudentsOptions();

        for (SelectOption student : studentOptions) {
            if (student.getLabel().equalsIgnoreCase('Student, Test')) {
                tcc.tommieCaresCase.ContactId = student.getValue();
            }
        }

        List<SelectOption> primaryReason = tcc.getPrimaryReasonOptions();
        System.assert(primaryReason.size() > 0);

        List<SelectOption> academicConcerns = tcc.getAcademicConcernOptions();
        System.assert(academicConcerns.size() > 0);

        List<SelectOption> attendanceConcerns = tcc.getAttendanceConcernsOptions();
        System.assert(attendanceConcerns.size() > 0);

        List<SelectOption> highFives = tcc.getTommieHigh5ReasonOptions();
        System.assert(highFives.size() > 0);

        tcc.saveCase();

        List<Case> savedCases = [
                SELECT Id, Subject, Origin, Case_Reporter__c, Alert_Term_lookup__c, Course_Connection__c, ContactId,
                        Course_Offering__c
                FROM Case
                WHERE ContactId = :tcc.tommieCaresCase.ContactId
        ];
        System.assertEquals(savedCases.size(), 1);
        System.assertEquals(savedCases[0].Origin, 'Web');
        System.assertEquals(savedCases[0].Subject, 'Tommie Cares');
        System.assertEquals(savedCases[0].ContactId, tcc.tommieCaresCase.ContactId);
        System.assertEquals(savedCases[0].Course_Offering__c, tcc.studentCourseConnection);

        System.debug(studentOptions);
        Test.stopTest();

    }
}