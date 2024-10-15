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

        if(!currentTerm.isEmpty()) {

            termAdvisorMap.put('CurrentTerm', currentTerm[0].Id);
        }

        if(String.isNotBlank(urlBid)) {
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

        if(!advisor.isEmpty()) {

            termAdvisorMap.put('AdvisorContactId', advisor[0].Id);
            termAdvisorMap.put('AdvisorContactName', advisor[0].Name);
            termAdvisorMap.put('AdvisorLNameFName', advisor[0].Last_Name_First_Name__c);
            termAdvisorMap.put('AdvisorEmail', advisor[0].hed__UniversityEmail__c);
            termAdvisorMap.put('AdvisorBannerId', advisor[0].University_Banner_ID__c);
        }

        System.debug('What is termAdvisorList: '+termAdvisorMap);

        return termAdvisorMap;
    }

//    public hed__Course_Offering__c getSingleCourse(String bannerIdAdvisor, String courseCrn) {
//        hed__Course_Offering__c course = new hed__Course_Offering__c();
//
//        List<hed__Course_Offering__c> advisorCourses = [
//                SELECT Id, Name, Course_Title__c, hed__Section_ID__c, hed__Faculty__r.University_Banner_ID__c
//                FROM hed__Course_Offering__c
//                WHERE hed__Faculty__r.University_Banner_ID__c = :bannerIdAdvisor
//                AND Course_CRN__c = :courseCrn
//                AND Current_Term__c = TRUE
//                ORDER BY Name ASC
//        ];
//
//        if (!advisorCourses.isEmpty()) {
//            course = advisorCourses[0];
//        }
//
//        return course;
//    }
//
//    public List<SelectOption> getCourses(String bannerIdAdvisor) {
//        List<SelectOption> coursesList = new List<SelectOption>();
//
//        //Get a list of current term courses assigned to that advisor
//        coursesList.add(new SelectOption('', 'Select...'));
//
//        List<hed__Course_Offering__c> advisorCourses = [
//                SELECT Id, Name, Course_Title__c, hed__Section_ID__c, hed__Faculty__r.University_Banner_ID__c
//                FROM hed__Course_Offering__c
//                WHERE hed__Faculty__r.University_Banner_ID__c = :bannerIdAdvisor
//                AND Current_Term__c = TRUE
//                ORDER BY Name ASC
//        ];
//
//        for (hed__Course_Offering__c course : advisorCourses) {
//            coursesList.add(new SelectOption(course.Id, course.Name + ' - ' + course.hed__Section_ID__c + ' (' + course.Course_Title__c + ')'));
//        }
//        return coursesList;
//    }
//
//    public hed__Course_Enrollment__c getSingleStudent(Id courseOfferingId, String studentBannerId) {
//        hed__Course_Enrollment__c student = new hed__Course_Enrollment__c();
//        Id studentRecordId = Schema.SObjectType.hed__Course_Enrollment__c.getRecordTypeInfosByName().get('Student').getRecordTypeId();
//
//        List<hed__Course_Enrollment__c> enrollmentStudents = [
//                SELECT hed__Contact__c, hed__Contact__r.Id, hed__Contact__r.Last_Name_First_Name__c, hed__Contact__r.Advisor__r.Email, Credit_Hours__c, Id
//                FROM hed__Course_Enrollment__c
//                WHERE Current_Term_Course__c = TRUE
//                AND hed__Course_Offering__c = :courseOfferingId
//                AND hed__Contact__r.University_Banner_ID__c = :studentBannerId
//                AND RecordTypeId = :studentRecordId
//                AND Course_Connection_Deleted_in_Banner__c = FALSE
//                AND (Registration_Code__c = 'OR'
//                OR Registration_Code__c = 'RE')
////                    AND Credit_Hours__c != NULL
////                    AND Credit_Hours__c != '0'
//                ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC
//        ];
//
//        if (!enrollmentStudents.isEmpty()) {
//            student= enrollmentStudents[0];
//        }
//
//        return student;
//    }
//
//    public List<SelectOption> getStudents(Id courseOfferingId) {
//        List<SelectOption> studentList = new List<SelectOption>() ;
//        studentList.add(new SelectOption('', 'Select...'));
//        Id studentRecordId = Schema.SObjectType.hed__Course_Enrollment__c.getRecordTypeInfosByName().get('Student').getRecordTypeId();
//        List<hed__Course_Enrollment__c> enrollmentStudents = [
//                SELECT hed__Contact__r.Id, hed__Contact__r.Last_Name_First_Name__c, hed__Contact__r.Advisor__r.Email, Credit_Hours__c, Id
//                FROM hed__Course_Enrollment__c
//                WHERE Current_Term_Course__c = TRUE
//                AND hed__Course_Offering__c = :courseOfferingId
//                AND RecordTypeId = :studentRecordId
//                AND Course_Connection_Deleted_in_Banner__c = FALSE
//                AND (Registration_Code__c = 'OR'
//                OR Registration_Code__c = 'RE')
////                    AND Credit_Hours__c != NULL
////                    AND Credit_Hours__c != '0'
//                ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC
//        ];
//
//        Map<Id, String> uniqueStudents = new Map<Id, String>();
//        for (hed__Course_Enrollment__c student : enrollmentStudents) {
//            uniqueStudents.put(student.hed__Contact__r.Id, student.hed__Contact__r.Last_Name_First_Name__c);
//        }
//
//        for (Id key : uniqueStudents.keySet()) {
//            studentList.add(new SelectOption(key, uniqueStudents.get(key)));
//        }
//        return studentList;
//    }

}