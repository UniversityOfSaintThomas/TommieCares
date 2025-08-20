/**
 * Created by nguy0092 on 7/27/2025.
 */

public without sharing class CommunityOfConcernLwcController {

    @AuraEnabled(Cacheable=true)
    public static List<Contact> iAmContactInfo(String salesforceId, String bannerId) {
        return [SELECT Id,
                        FirstName,
                        LastName,
                        St_Thomas_Connection__c,
                        hed__UniversityEmail__c,
                        University_Banner_ID__c
                FROM Contact
                WHERE Id = :salesforceId
                OR (University_Banner_ID__c != ''
                AND University_Banner_ID__c = :bannerId)
                LIMIT 1
        ];
//        return contactInfo;
    }

    @AuraEnabled(Cacheable=false)
    public static String saveCase(Map<String, String> formSelections) {
        String insertStatus = '';
        Case communityOfConcernCase = new Case();

        List<RecordType> recordId = [
                SELECT Id,
                        Name
                FROM RecordType
                WHERE SobjectType = 'Case'
                AND DeveloperName = 'Community_Concern'
        ];

        String caseRecordId = !recordId.isEmpty() ? recordId[0].Id : '';

        communityOfConcernCase.RecordTypeId = caseRecordId;
        communityOfConcernCase.Origin = 'Web';
        communityOfConcernCase.Subject = 'Community Concern';
        communityOfConcernCase.Community_Concern_Reporter_Type__c = formSelections.get('IAmValue');
        if (String.isNotBlank(formSelections.get('IAmContactId'))) {
            communityOfConcernCase.Case_Reporter__c = formSelections.get('IAmContactId');
        }
        communityOfConcernCase.SuppliedName = formSelections.get('IAmFirstName') + ' ' + formSelections.get('IAmLastName');
        communityOfConcernCase.SuppliedEmail = formSelections.get('IAmEmail');
        communityOfConcernCase.SuppliedPhone = formSelections.get('IAmPhone');
        communityOfConcernCase.Community_Concern_Who_Type__c = formSelections.get('ConcernedWhoValue');
        communityOfConcernCase.First_Name__c = formSelections.get('ConcernedWhoFirstName');
        communityOfConcernCase.Last_Name__c = formSelections.get('ConcernedWhoLastName');
        communityOfConcernCase.St_Thomas_Email__c = formSelections.get('ConcernedWhoEmail');
        communityOfConcernCase.Phone__c = formSelections.get('ConcernedWhoPhone');
        communityOfConcernCase.Community_Concern__c = formSelections.get('ConcernedWhatValue');
        communityOfConcernCase.Restricted_Access_Notes__c = formSelections.get('ConcernedWhatAdditionalInfo');

        try {
            insert communityOfConcernCase;
        } catch (DmlException e) {
            insertStatus = 'fail';
            System.debug('Insert Case error: '+e);
        }

        return insertStatus;
    }
}