/**
 * Created by nguy0092 on 7/27/2025.
 */

public with sharing class CommunityOfConcernLwcController {

    @AuraEnabled(Cacheable=false)
    public static void saveCase(Map<String, String> formSelections) {
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

        insert communityOfConcernCase;

//        import COMMUNITY_CONCERN_REPORTER_TYPE from "@salesforce/schema/Case.Community_Concern_Reporter_Type__c";
//        import COMMUNITY_CONCERN_WHO_TYPE from "@salesforce/schema/Case.Community_Concern_Who_Type__c";
//        import COMMUNITY_CONCERN_WHAT from "@salesforce/schema/Case.Community_Concern__c";
//        import CASE_OBJECT from "@salesforce/schema/Case";
//        import CASE_STATUS from "@salesforce/schema/Case.Status";
//        import RECORD_TYPE from "@salesforce/schema/Case.RecordTypeId";
//        import ORIGIN from "@salesforce/schema/Case.Origin";
//        import SUBJECT from "@salesforce/schema/Case.Subject";
//        import CASE_REPORTER from "@salesforce/schema/Case.Case_Reporter__c";
//        import SUPPLIED_NAME from "@salesforce/schema/Case.SuppliedName";
//        import SUPPLIED_EMAIL from "@salesforce/schema/Case.SuppliedEmail";
//        import SUPPLIED_PHONE from "@salesforce/schema/Case.SuppliedPhone";
//        import FIRST_NAME from "@salesforce/schema/Case.First_Name__c";
//        import LAST_NAME from "@salesforce/schema/Case.Last_Name__c";
//        import ST_THOMAS_EMAIL from "@salesforce/schema/Case.St_Thomas_Email__c";
//        import PHONE from "@salesforce/schema/Case.Phone__c";
//        import {updateRecord} from "lightning/uiRecordApi";
//    import {ShowToastEvent} from "lightning/platformShowToastEvent";

//        this.communityOfConcernCase.IAmValue = this.iAmValue;
//        this.communityOfConcernCase.IAmContactId = this.reporterInfo.Id;
//        this.communityOfConcernCase.IAmFirstName = this.reporterInfo.FirstName;
//        this.communityOfConcernCase.IAmLastName = this.reporterInfo.LastName;
//        // this.communityOfConcernCase.IAmStThomasConnection = this.reporterInfo.Email;
//        this.communityOfConcernCase.IAmEmail = this.reporterInfo.Email;
//        this.communityOfConcernCase.IAmPhone = this.reporterInfo.Phone;
//        // this.communityOfConcernCase.IAmBannerId: "",
//        this.communityOfConcernCase.ConcernedWhoValue = this.concernedWhatValue;
//        this.communityOfConcernCase.ConcernedWhoFirstName = this.concernedWhoInfo.FirstName;
//        this.communityOfConcernCase.ConcernedWhoLastName = this.concernedWhoInfo.LastName;
//        this.communityOfConcernCase.ConcernedWhoEmail = this.concernedWhoInfo.Email;
//        this.communityOfConcernCase.ConcernedWhoPhone = this.concernedWhoInfo.Phone;
//        this.communityOfConcernCase.concernedWhatValue = this.concernedWhatValue;
    }
}