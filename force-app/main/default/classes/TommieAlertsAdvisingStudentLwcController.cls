/**
 * Created by nguy0092 on 8/30/2026.
 */

public without sharing class TommieAlertsAdvisingStudentLwcController {

    @AuraEnabled(Cacheable=true)
    public static Map<String, List<PicklistOption>> getTommieCaresPicklists() {
        Map<String, List<PicklistOption>> result = new Map<String, List<PicklistOption>>();

        result.put('tommieCaresReasons', getPicklistOptions(Case.Tommie_Alert_Primary_Reason__c));
        result.put('tommieHigh5Reasons', getPicklistOptions(Case.Tommie_High_5__c));

        return result;
    }

    private static List<PicklistOption> getPicklistOptions(Schema.SObjectField fieldToken) {
        List<PicklistOption> options = new List<PicklistOption>();
        Schema.DescribeFieldResult dfr = fieldToken.getDescribe();

        for (Schema.PicklistEntry entry : dfr.getPicklistValues()) {
            if (entry.isActive()) {
                options.add(new PicklistOption(entry.getLabel(), entry.getValue()));
            }
        }
        return options;
    }

    @AuraEnabled(Cacheable=true)
    public static Contact advisorInformation(String advisorBannerId) {

        Contact advisorContact = new Contact();
        List<Contact> advisorContactList = new List<Contact>();

        if (String.isNotBlank(advisorBannerId)) {
            advisorContactList = [
                    SELECT Id,
                            Name,
                            FirstName,
                            LastName,
                            Email,
                            Last_Name_First_Name__c,
                            hed__UniversityEmail__c,
                            University_Banner_ID__c,
                            St_Thomas_Connection__c
                    FROM Contact
                    WHERE University_Banner_ID__c = :advisorBannerId
                    AND St_Thomas_Connection__c INCLUDES ('Faculty', 'Staff')
                    WITH SECURITY_ENFORCED
                    LIMIT 1
            ];
        }

        if (advisorContactList.size() > 0) {
            advisorContact = advisorContactList[0];
        }

        return advisorContact;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Contact> searchStudent(String searchMode, String bannerId, String lastName, String email) {
        List<Contact> matches = new List<Contact>();

        // Basic guard
        if (String.isBlank(searchMode)) {
            return matches;
        }

        // Build SELECT clause
        String baseSelect = 'SELECT Id, FirstName, LastName, Name, Email, hed__UniversityEmail__c, '
                + 'University_Banner_ID__c, St_Thomas_Connection__c, Undergraduate_Cohort_Code__c FROM Contact '
                + 'WHERE St_Thomas_Connection__c INCLUDES (\'Student\')';

        // Build WHERE parts dynamically (use escapeSingleQuotes to avoid SOQL injection)
        List<String> whereParts = new List<String>();

        if (searchMode == 'banner') {
            if (String.isBlank(bannerId) || String.isBlank(lastName)) {
                return matches; // keep existing behavior: require bannerId + lastName (you can change to be more permissive)
            }
            whereParts.add('University_Banner_ID__c = \'' + String.escapeSingleQuotes(bannerId) + '\'');
            // We intentionally don't try to normalize last name in SOQL; we'll filter in Apex (keeps query selective)
        } else if (searchMode == 'email') {
            if (String.isBlank(email)) {
                return matches;
            }
            // match exact stored university email (escape the input)
            whereParts.add('hed__UniversityEmail__c = \'' + String.escapeSingleQuotes(email.trim()) + '\'');
        } else {
            // unknown mode
            return matches;
        }

        if (whereParts.isEmpty()) {
            return matches; // no filters => return empty set instead of full table scan
        }
        // Compose final query; include WITH SECURITY_ENFORCED so the running user must have access
        String andWhereClause = ' AND ' + String.join(whereParts, ' AND ');
        String finalQuery = baseSelect + andWhereClause + ' WITH SECURITY_ENFORCED LIMIT 1'; // add a reasonable limit to prevent abuse

        // Execute dynamic query
        List<Contact> contacts = Database.query(finalQuery);

        List<Contact> filteredContacts = new List<Contact>();
        for (Contact c : contacts) {
            if (String.isBlank(c.Undergraduate_Cohort_Code__c) || !c.Undergraduate_Cohort_Code__c.contains('DCNFDSFL')) {
                filteredContacts.add(c);
            }
        }

        // If banner search, filter by normalized last name in Apex (existing normalizeLastName helper)
        if (searchMode == 'banner') {
            String normalizedInput = normalizeLastName(lastName);
            if (String.isBlank(normalizedInput)) {
                return matches;
            }
            for (Contact c : filteredContacts) {
                String normalizedStored = normalizeLastName(c.LastName);
                if (normalizedInput.equals(normalizedStored)) {
                    matches.add(c);
                }
            }
            return matches;
        }

        // For email search just return results
        return filteredContacts;
    }

// Helper: remove whitespace, hyphens, and apostrophes, then lowercase.
// Examples:
//   "O'Connor" -> "oconnor"
//   "Smith-Jones" -> "smithjones"
//   " Van Dyke " -> "vandyke"
    public static String normalizeLastName(String s) {
        if (s == null) return '';
        // Remove whitespace using regex, then remove hyphens and apostrophes.
        // Use String.valueOf((char)39) to represent the apostrophe character safely.
        String withoutWhitespace = s.replaceAll('\\s', '');
        String withoutHyphens = withoutWhitespace.replace('-', '');
//        String apostrophe = String.valueOf((char)39); // char(39) == '
        String withoutApos = withoutHyphens.replace('\'', '');
        return withoutApos.toLowerCase();
    }

    @AuraEnabled(Cacheable=false)
    public static Boolean submitTommieAlertsAdvisingStudent(Map<String, String> formSelections) {
        Boolean caseSubmittedErrorCheck = false;

        Case tommieCaresCase = new Case();

        List<RecordType> recordId = [
                SELECT Id,
                        Name
                FROM RecordType
                WHERE SobjectType = 'Case'
                AND DeveloperName = 'Tommie_Cares'
        ];

        String caseRecordId = !recordId.isEmpty() ? recordId[0].Id : '';

        List<String> advocateReportNumbers = new List<String>();

        if (Boolean.valueOf(formSelections.get('submitWellBeingFormFail'))) {
                advocateReportNumbers.add('Advocate Well-Being Report Submission Failed');
        } else if (!Boolean.valueOf(formSelections.get('submitWellBeingFormFail')) && String.isNotBlank(formSelections.get('TellSomeoneWellBeingReportNumber'))) {
            advocateReportNumbers.add('Advocate Well-Being Report Number: '+formSelections.get('TellSomeoneWellBeingReportNumber'));
        }

        if (Boolean.valueOf(formSelections.get('submitTitleIxIncidentFormFail'))) {
            advocateReportNumbers.add('Advocate Title IX Report Submission Failed');
        } else if (!Boolean.valueOf(formSelections.get('submitTitleIxIncidentFormFail')) && String.isNotBlank(formSelections.get('TellSomeoneTitleIxReportNumber'))) {
            advocateReportNumbers.add('Advocate Title IX Report Number: '+formSelections.get('TellSomeoneTitleIxReportNumber'));
        }

        String caseDescription = advocateReportNumbers.isEmpty() ? '' : String.join(advocateReportNumbers, ' | ');

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
        tommieCaresCase.Description = caseDescription;

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

        try {
            insert tommieCaresCase;
        } catch (DmlException e) {
            System.debug('Error occurred while inserting Tommie Cares Advising Student Case:' + e.getMessage());
            caseSubmittedErrorCheck = true;
        }

        return caseSubmittedErrorCheck;
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

    public class PicklistOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;

        public PicklistOption(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

}