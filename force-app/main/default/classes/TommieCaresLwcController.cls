/**
 * Created by nguy0092 on 10/14/2024.
 */

public without sharing class TommieCaresLwcController {

    @AuraEnabled(Cacheable=true)
    public static Map<String, String> currentTermAdvisor(String urlBid) {

        Map<String, String> termAdvisorMap = new Map<String, String>();
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

        System.debug('What is termAdvisorList: ' + termAdvisorMap);

        return termAdvisorMap;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Map<String, String>> advisorCoursesList(String advisorContactId, String courseCrn) {

        List<Map<String, String>> courseMapList = new List<Map<String, String>>();

        String singleCrnCriteria = '';

        if (String.isNotBlank(courseCrn)) {
            singleCrnCriteria = ' AND Course_CRN__c = \'' + courseCrn + '\'';
        }

        String coursesQuery = 'SELECT Id, Name, Course_Title__c, hed__Section_ID__c\n' +
                ' FROM hed__Course_Offering__c\n' +
                ' WHERE hed__Faculty__r.Id = :advisorContactId\n' +
                singleCrnCriteria + '\n' +
                ' AND Current_Term__c = TRUE\n' +
                ' ORDER BY Name ASC';

        List<hed__Course_Offering__c> courses = Database.query(coursesQuery);

        for (hed__Course_Offering__c c : courses) {

            Map<String, String> courseValueLabel = new Map<String, String>{'label' => c.Name + ' - ' + c.hed__Section_ID__c + ' (' + c.Course_Title__c + ')', 'value' => c.Id};
            courseMapList.add(courseValueLabel);
        }

        System.debug('What is courseMapList: ' + courseMapList);

        return courseMapList;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Map<String, String>> studentCourseList(String studentBannerId, String courseId) {

        List<Map<String, String>> studentMapList = new List<Map<String, String>>();
        String singleStudentCriteria = '';

        List<RecordType> recordId = [
                SELECT Id,
                        Name
                FROM RecordType
                WHERE SobjectType = 'hed__Course_Enrollment__c'
                AND DeveloperName = 'Student'
        ];

        String studentRecordId = !recordId.isEmpty() ? recordId[0].Id : '';

        if (String.isNotBlank(studentBannerId)) {
            singleStudentCriteria = ' AND hed__Contact__r.University_Banner_ID__c = \'' + studentBannerId + '\'';
        }

        String studentsQuery = 'SELECT Id, hed__Contact__c, hed__Contact__r.Id, hed__Contact__r.Last_Name_First_Name__c, hed__Contact__r.University_Banner_ID__c\n' +
                ' FROM hed__Course_Enrollment__c\n' +
                ' WHERE Current_Term_Course__c = TRUE\n' +
                ' AND hed__Course_Offering__c = :courseId\n' +
                ' AND RecordTypeId = :studentRecordId\n' +
                ' AND Course_Connection_Deleted_in_Banner__c = FALSE\n' +
                singleStudentCriteria + '\n' +
                ' AND (Registration_Code__c = \'OR\'\n' +
                ' OR Registration_Code__c = \'RE\')\n' +
                ' ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC';

        List<hed__Course_Enrollment__c> students = Database.query(studentsQuery);

        for (hed__Course_Enrollment__c s : students) {

            Map<String, String> studentValueLabel = new Map<String, String>{'label' => s.hed__Contact__r.Last_Name_First_Name__c+' ('+s.hed__Contact__r.University_Banner_ID__c+')', 'value' => s.hed__Contact__r.Id};
            studentMapList.add(studentValueLabel);
        }

        System.debug('What is studentMapList: ' + studentMapList);

        return studentMapList;
    }

}
