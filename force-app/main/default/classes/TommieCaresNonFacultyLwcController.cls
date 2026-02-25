/**
 * Created by nguy0092 on 2/7/2025.
 */

public without sharing class TommieCaresNonFacultyLwcController {

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
                            University_Banner_ID__c,
                            St_Thomas_Connection__c
                    FROM Contact
                    WHERE University_Banner_ID__c = :advisorBannerId
                    AND St_Thomas_Connection__c INCLUDES ('Faculty', 'Staff')
                    WITH SECURITY_ENFORCED
            ];
        }

        if (advisorContactList.size() > 0) {
            advisorContact = advisorContactList[0];
        }

        return advisorContact;
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
        tommieCaresCase.Tommie_Alert_Primary_Reason__c = formSelections.get('TommieCares_Reasons');
        tommieCaresCase.Tommie_High_5__c = formSelections.get('High5_Reasons');
        tommieCaresCase.Attendance_Concerns_Reason_s__c = formSelections.get('Attendance_Reasons');
        tommieCaresCase.Academic_Performance_Reason_s__c = formSelections.get('Academic_Reasons');
        tommieCaresCase.Can_this_student_pass_course__c = formSelections.get('Pass_Course_Selection');
        tommieCaresCase.Tommie_High_5_Notes__c = formSelections.get('High5_Details');
        tommieCaresCase.Tommie_Alert_Primary_Reason_Other_Notes__c = formSelections.get('Other_Details');
        tommieCaresCase.Case_Reporter_Notes_to_Student__c = formSelections.get('Personal_Message');
        tommieCaresCase.Shared_Case_Notes__c = formSelections.get('Additional_Concerns');

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
                SELECT hed__Contact__c,
                        hed__Contact__r.Id,
                        hed__Contact__r.Name,
                        hed__Contact__r.Email,
                        Name, hed__Type__c,
                        hed__Status__c,
                        hed__RelatedContact__r.Id,
                        hed__RelatedContact__r.Name,
                        hed__RelatedContact__r.hed__UniversityEmail__c
//                        hed__RelatedContact__r.Email
                FROM hed__Relationship__c
                WHERE hed__Type__c IN :relationshipTypes
                AND hed__Contact__c = :tommieCaresCase.ContactId
                AND hed__Status__c = 'Current'
                WITH SECURITY_ENFORCED
                ORDER BY CreatedDate DESC NULLS LAST
        ];

        Map<String, hed__Relationship__c> advisorContactsMap = new Map<String, hed__Relationship__c>();
        for (hed__Relationship__c contact : advisorContacts) {
            advisorContactsMap.put(contact.hed__Type__c, contact);
        }

        if (advisorContactsMap.size() > 0) {
            String primaryAdvisorEmail = getAdvisorInfo('Email', 'Primary Advisor', advisorContactsMap);
            tommieCaresCase.Primary_Advisor_Contact__c = getAdvisorInfo('Id', 'Primary Advisor', advisorContactsMap);
            tommieCaresCase.Primary_Advisory_Email__c = String.isBlank(tommieCaresCase.Primary_Advisor_Contact__c) || String.isBlank(primaryAdvisorEmail) ? 'registrar@stthomas.edu' : primaryAdvisorEmail;
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

        System.debug(JSON.serializePretty(tommieCaresCase));

        insert tommieCaresCase;

    }

    public static String getAdvisorInfo(String EmailOrId, String relationshipType, Map<String, hed__Relationship__c> advisorContactsMap) {
        String advisorInfo;
        if (advisorContactsMap.size() > 0) {
            if (advisorContactsMap.containsKey(relationshipType)) {
                if (EmailOrId == 'Id') {
                    advisorInfo = advisorContactsMap.get(relationshipType).hed__RelatedContact__r.Id;
                } else if (EmailOrId == 'Email') {
                    advisorInfo = advisorContactsMap.get(relationshipType).hed__RelatedContact__r.hed__UniversityEmail__c;
//                    advisorInfo = advisorContactsMap.get(relationshipType).hed__RelatedContact__r.Email;
                }
            }
        }

        return advisorInfo;
    }

}