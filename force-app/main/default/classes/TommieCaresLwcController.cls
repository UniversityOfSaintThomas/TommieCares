/**
 * Created by nguy0092 on 10/14/2024.
 */

public without sharing class TommieCaresLwcController {

    @AuraEnabled(Cacheable=true)
    public static Map<String, String> currentTermAdvisor(String urlBid) {

        Map<String, String> termAdvisorMap = new Map<String, String>{
                'Current_Term' => '',
                'Advisor_ContactId' => '',
                'Advisor_ContactName' => '',
                'Advisor_LNameFName' => '',
                'Advisor_Email' => '',
                'Advisor_BannerId' => ''
        };
        List<hed__Term__c> currentTerm = new List<hed__Term__c>();
        List<Contact> advisor = new List<Contact>();

        currentTerm = [
                SELECT Id
                FROM hed__Term__c
                WHERE Current_Term__c = TRUE
        ];

        if (!currentTerm.isEmpty()) {
            termAdvisorMap.put('Current_Term', currentTerm[0].Id);
        }

        if (String.isNotBlank(urlBid)) {
            advisor = [
                    SELECT Id,
                            Name,
                            Last_Name_First_Name__c,
                            hed__UniversityEmail__c,
                            University_Banner_ID__c
                    FROM Contact
                    WHERE University_Banner_ID__c = :urlBid
            ];
        }

        if (!advisor.isEmpty()) {
            termAdvisorMap.put('Advisor_ContactId', advisor[0].Id);
            termAdvisorMap.put('Advisor_ContactName', advisor[0].Name);
            termAdvisorMap.put('Advisor_LNameFName', advisor[0].Last_Name_First_Name__c);
            termAdvisorMap.put('Advisor_Email', advisor[0].hed__UniversityEmail__c);
            termAdvisorMap.put('Advisor_BannerId', advisor[0].University_Banner_ID__c);
        }

        System.debug('termAdvisorMap: '+termAdvisorMap);
        return termAdvisorMap;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Map<String, String>> advisorCoursesList(String advisorContactId, String courseCrn) {

        List<Map<String, String>> courseMapList = new List<Map<String, String>>();
        List<hed__Course_Offering__c> courses = new List<hed__Course_Offering__c>();
        String singleCrnCriteria = '';

        String allCourseCriteria = 'SELECT Id, Name, Course_Title__c, hed__Section_ID__c\n' +
                ' FROM hed__Course_Offering__c\n' +
                ' WHERE hed__Faculty__r.Id = :advisorContactId\n' +
                ' AND Current_Term__c = TRUE\n';

        String allCoursesQuery = allCourseCriteria + '\n' +
                ' ORDER BY Name ASC';

        if (String.isNotBlank(courseCrn)) {
            singleCrnCriteria = ' AND Course_CRN__c = \'' + courseCrn + '\'';

            String singleStudentQuery = allCourseCriteria + '\n' +
                    singleCrnCriteria + '\n' +
                    ' ORDER BY Name ASC';

            courses = Database.query(singleStudentQuery);
        }

        if (courses.size() == 0) {
            courses = Database.query(allCoursesQuery);
        }

        for (hed__Course_Offering__c c : courses) {

            Map<String, String> courseValueLabel = new Map<String, String>{'label' => c.Name + ' - ' + c.hed__Section_ID__c + ' (' + c.Course_Title__c + ')', 'value' => c.Id};
            courseMapList.add(courseValueLabel);
        }

        return courseMapList;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Map<String, String>> studentCourseList(String studentBannerId, String courseId) {

        List<Map<String, String>> studentMapList = new List<Map<String, String>>();
        List<hed__Course_Enrollment__c> students = new List<hed__Course_Enrollment__c>();
        String singleStudentCriteria = '';

        List<RecordType> recordId = [
                SELECT Id,
                        Name
                FROM RecordType
                WHERE SobjectType = 'hed__Course_Enrollment__c'
                AND DeveloperName = 'Student'
        ];

        String studentRecordId = !recordId.isEmpty() ? recordId[0].Id : '';

        String allStudentsCriteria = 'SELECT Id, hed__Contact__c, hed__Contact__r.Id, hed__Contact__r.Last_Name_First_Name__c, hed__Contact__r.University_Banner_ID__c\n' +
                ' FROM hed__Course_Enrollment__c\n' +
                ' WHERE Current_Term_Course__c = TRUE\n' +
                ' AND hed__Course_Offering__c = :courseId\n' +
                ' AND RecordTypeId = :studentRecordId\n' +
                ' AND Course_Connection_Deleted_in_Banner__c = FALSE\n' +
                ' AND (Registration_Code__c = \'OR\'\n' +
                ' OR Registration_Code__c = \'RE\')';

        String allStudentQuery = allStudentsCriteria + '\n' +
                ' ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC';

        if (String.isNotBlank(studentBannerId)) {
            singleStudentCriteria = ' AND hed__Contact__r.University_Banner_ID__c = \'' + studentBannerId + '\'';

            String singleStudentQuery = allStudentsCriteria + '\n' +
                    singleStudentCriteria + '\n' +
                    ' ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC';

            students = Database.query(singleStudentQuery);
        }

        if (students.size() == 0) {
            students = Database.query(allStudentQuery);
        }

        for (hed__Course_Enrollment__c s : students) {

            Map<String, String> studentValueLabel = new Map<String, String>{'label' => s.hed__Contact__r.Last_Name_First_Name__c+' ('+s.hed__Contact__r.University_Banner_ID__c+')', 'value' => s.hed__Contact__r.Id};
            studentMapList.add(studentValueLabel);
        }

        return studentMapList;
    }

    @AuraEnabled(Cacheable=false)
    public static void saveCase(Map<String, String> formSelections) {
        Case tommieCaresCase = new Case();

        List<RecordType> recordId = [
                SELECT Id,
                        Name
                FROM RecordType
                WHERE SobjectType = 'Case'
                AND DeveloperName = 'Tommie_Cares'
        ];

        String caseRecordId = !recordId.isEmpty() ? recordId[0].Id : '';

        tommieCaresCase.RecordTypeId = caseRecordId;
        tommieCaresCase.Case_Reporter__c = formSelections.get('AdvisorContactId');
        tommieCaresCase.Subject = 'Tommie Cares';
        tommieCaresCase.Origin = 'Web';
        tommieCaresCase.Reporter_University_Email__c = formSelections.get('AdvisorEmail');
        tommieCaresCase.ContactId = formSelections.get('StudentContactId');
        tommieCaresCase.Course_Offering__c = formSelections.get('CourseSelectionId');
        tommieCaresCase.Alert_Term_lookup__c = formSelections.get('currentTermId');
        tommieCaresCase.Tommie_Alert_Primary_Reason__c = formSelections.get('TommieCares_Reasons');
        tommieCaresCase.Tommie_High_5__c = formSelections.get('High5_Reasons');
        tommieCaresCase.Attendance_Concerns_Reason_s__c = formSelections.get('Attendance_Reasons');
        tommieCaresCase.Academic_Performance_Reason_s__c = formSelections.get('Academic_Reasons');
        tommieCaresCase.Can_this_student_pass_course__c = formSelections.get('Pass_Course_Selection');
        tommieCaresCase.Tommie_High_5_Notes__c = formSelections.get('High5_Details');
        tommieCaresCase.Tommie_Alert_Primary_Reason_Other_Notes__c = formSelections.get('Other_Details');
        tommieCaresCase.Case_Reporter_Notes_to_Student__c = formSelections.get('Personal_Message');
        tommieCaresCase.Shared_Case_Notes__c = formSelections.get('Additional_Concerns');

        //Get Course Connection for student selected
        List<hed__Course_Enrollment__c> studentCourseEnrollmentList = [
                SELECT Id
                FROM hed__Course_Enrollment__c
                WHERE Course_Offering_ID__c = :tommieCaresCase.Course_Offering__c
                AND hed__Contact__c = :tommieCaresCase.ContactId
        ];

        if (studentCourseEnrollmentList.size() > 0) {
            tommieCaresCase.Course_Connection__c = studentCourseEnrollmentList[studentCourseEnrollmentList.size() - 1].Id;
        }

        List <String> relationshipTypes = new List<String>{
                'Primary Advisor',
                'Student-Athlete Advisor',
                'Secondary Advisor',
                'First-Year Advisor',
                'Probationary Advisor',
                'Financial Aid Counselor',
                'General Advisor',
                'International Advisor',
                'Faculty Advisor'
        };

        //Get All Relationship Information
        List<hed__Relationship__c> advisorContacts = [
                SELECT hed__Contact__c, hed__Contact__r.Id, hed__Contact__r.Name, Name, hed__Type__c, hed__Status__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
                FROM hed__Relationship__c
                WHERE hed__Type__c IN :relationshipTypes
                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
                AND hed__Status__c = 'Current'
                ORDER BY CreatedDate DESC NULLS LAST
        ];

        Map<String, hed__Relationship__c> advisorContactsMap = new Map<String, hed__Relationship__c>();
        for (hed__Relationship__c contact : advisorContacts) {
            advisorContactsMap.put(contact.hed__Type__c, contact);
        }

        if (advisorContactsMap.size() > 0) {
            tommieCaresCase.Primary_Advisor_Contact__c = getAdvisorInfo('Id', 'Primary Advisor', advisorContactsMap);
            tommieCaresCase.Primary_Advisory_Email__c = String.isBlank(tommieCaresCase.Primary_Advisor_Contact__c) ? 'registrar@stthomas.edu' : getAdvisorInfo('Email', 'Primary Advisor', advisorContactsMap);
            tommieCaresCase.Student_Athlete_Advisor_Email__c = getAdvisorInfo('Email', 'Student-Athlete Advisor', advisorContactsMap);
            tommieCaresCase.Student_Athlete_Advisor__c = getAdvisorInfo('Id', 'Student-Athlete Advisor', advisorContactsMap);
            tommieCaresCase.Secondary_Advisor_Email__c = getAdvisorInfo('Email', 'Secondary Advisor', advisorContactsMap);
            tommieCaresCase.Secondary_Advisor__c = getAdvisorInfo('Id', 'Secondary Advisor', advisorContactsMap);
            tommieCaresCase.First_Year_Advisor_Email__c = getAdvisorInfo('Email', 'First-Year Advisor', advisorContactsMap);
            tommieCaresCase.First_Year_Advisor__c = getAdvisorInfo('Id', 'First-Year Advisor', advisorContactsMap);
            tommieCaresCase.Probation_Advisor_Email__c = getAdvisorInfo('Email', 'Probationary Advisor', advisorContactsMap);
            tommieCaresCase.Probation_Advisor_Contact__c = getAdvisorInfo('Id', 'Probationary Advisor', advisorContactsMap);
            tommieCaresCase.Financial_Aid_Counselor_Email__c = getAdvisorInfo('Email', 'Financial Aid Counselor', advisorContactsMap);
            tommieCaresCase.Financial_Aid_Counselor__c = getAdvisorInfo('Id', 'Financial Aid Counselor', advisorContactsMap);
            tommieCaresCase.General_Advisor_Email__c = getAdvisorInfo('Email', 'General Advisor', advisorContactsMap);
            tommieCaresCase.General_Advisor__c = getAdvisorInfo('Id', 'General Advisor', advisorContactsMap);
            tommieCaresCase.International_Advisor_Email__c = getAdvisorInfo('Email', 'International Advisor', advisorContactsMap);
            tommieCaresCase.International_Advisor__c = getAdvisorInfo('Id', 'International Advisor', advisorContactsMap);
            tommieCaresCase.Faculty_Advisor_Email__c = getAdvisorInfo('Email', 'Faculty Advisor', advisorContactsMap);
            tommieCaresCase.Faculty_Advisor__c = getAdvisorInfo('Id', 'Faculty Advisor', advisorContactsMap);
        } else {
            tommieCaresCase.Primary_Advisory_Email__c = 'registrar@stthomas.edu';
        }

        List<hed__Course_Enrollment__c> courseConnection = [
                SELECT Id
                FROM hed__Course_Enrollment__c
                WHERE hed__Contact__r.Id = :tommieCaresCase.ContactId
                AND hed__Course_Offering__c = :formSelections.get('CourseSelectionId')
        ];

        if (courseConnection.size() > 0) {
            tommieCaresCase.Course_Connection__c = courseConnection[0].Id;
        }

        System.debug(JSON.serializePretty(tommieCaresCase));

        insert tommieCaresCase;

    }

    public static String getAdvisorInfo(String EmailOrId, String relationshipType, Map<String, hed__Relationship__c> advisorContactsMap) {
        String advisorInfo;
        if (advisorContactsMap.size() > 0) {
            if (advisorContactsMap.containsKey(relationshipType)) {
                if (EmailOrId == 'Id') {
                    advisorInfo = advisorContactsMap.get(relationshipType).hed__Contact__r.Id;
                } else if (EmailOrId == 'Email') {
                    advisorInfo = advisorContactsMap.get(relationshipType).hed__Contact__r.Email;
                }
            }
        }

        return advisorInfo;
    }

}
