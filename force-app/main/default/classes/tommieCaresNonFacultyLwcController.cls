/**
 * Created by nguy0092 on 2/7/2025.
 */

public without sharing class tommieCaresNonFacultyLwcController {

    @AuraEnabled(Cacheable=true)
    public static Contact studentInformation(String studentContactId) {

        Contact studentContact = new Contact();

        if (String.isNotBlank(studentContactId)) {
            studentContact = [
                    SELECT Id,
                            Name,
                            Last_Name_First_Name__c,
                            hed__UniversityEmail__c,
                            University_Banner_ID__c,
                            St_Thomas_Connection__c
                    FROM Contact
                    WHERE Id = :studentContactId
            ];
        }

        return studentContact;
    }

    @AuraEnabled(Cacheable=true)
    public static Contact advisorInformation(String advisorBannerId) {

        Contact advisorContact = new Contact();
        List<Contact> advisorContactList = new List<Contact>();

        if (String.isNotBlank(advisorBannerId)) {
            advisorContactList = [
                    SELECT Id,
                            Name,
                            Email,
                            Last_Name_First_Name__c,
                            hed__UniversityEmail__c,
                            University_Banner_ID__c
                    FROM Contact
                    WHERE University_Banner_ID__c = :advisorBannerId
                    AND St_Thomas_Connection__c INCLUDES ('Faculty', 'Staff')
            ];
        }

        if (advisorContactList.size() > 0) {
            advisorContact = advisorContactList[0];
        }

        return advisorContact;
    }


    @AuraEnabled(Cacheable=true)
    public static List<hed__Course_Enrollment__c> studentCourseList(String studentContactId) {

//        List<hed__Course_Enrollment__c> students = new List<hed__Course_Enrollment__c>();

        List<RecordType> recordId = [
                SELECT Id,
                        Name
                FROM RecordType
                WHERE SobjectType = 'hed__Course_Enrollment__c'
                AND DeveloperName = 'Student'
        ];

        String studentRecordId = !recordId.isEmpty() ? recordId[0].Id : '';

        return [SELECT Id,
                Course_Name__c,
                hed__Contact__c,
                hed__Contact__r.Id,
                hed__Contact__r.Last_Name_First_Name__c,
                hed__Contact__r.University_Banner_ID__c
                FROM hed__Course_Enrollment__c
                WHERE RecordTypeId = :studentRecordId
                AND hed__Contact__r.Id = :studentContactId
                AND Course_Connection_Deleted_in_Banner__c = FALSE];

    }
}