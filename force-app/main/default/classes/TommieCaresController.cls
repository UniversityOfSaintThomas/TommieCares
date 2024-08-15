/**
 * Created by frie9974 on 8/14/2023.
 */

public with sharing class TommieCaresController {
    public String bannerId { get; set; }
    public Contact advisor { get; set; }
    public List<hed__Term__c> currentTerm { get; set; }
    public List<SelectOption> courses { get; set; }
    public Case tommieCaresCase { get; set; }
    public Id studentCourseConnection { get; set; }
    public Id studentCourseEnrollment { get; set; }
    public Id courseOfferingId { get; set; }
    public String primaryConcern { get; set; }
    public String highFiveReason { get; set; }
    public String academicConcern { get; set; }
    public String attendanceConcern { get; set; }
    public doCrud crud2Do { get; set; }
    public Boolean caseSubmitted { get; set; }

    public TommieCaresController() {

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Canvas_Tommie_Alert_NC');
        req.setMethod('GET');
        Http http = new Http();
        HTTPResponse res = http.send(req);
        System.debug(res.getBody());

        tommieCaresCase = new Case();
        caseSubmitted = false;
        crud2Do = new doCrud();
        if (String.isNotBlank(ApexPages.currentPage().getParameters().get('bid'))) {
            bannerId = ApexPages.currentPage().getParameters().get('bid').escapeHtml4();
        }

        if (String.isNotBlank(ApexPages.currentPage().getParameters().get('submitted'))) {
            try {
                caseSubmitted = Boolean.valueOf(ApexPages.currentPage().getParameters().get('submitted').escapeHtml4());
            } catch (Exception e) {

            }
        }

        currentTerm = [
                SELECT Id
                FROM hed__Term__c
                WHERE Current_Term__c = TRUE
                LIMIT 1
        ];

        if (String.isNotBlank(bannerId)) {
            advisor = crud2Do.getAdvisor(bannerId);
            if (advisor != null) {
                courses = crud2Do.getCourses(bannerId);
                System.debug(courses);
            }
        }
    }

    public List<SelectOption> getStudentsOptions() {
        return crud2Do.getStudents(studentCourseConnection);
    }

    public List<SelectOption> getPrimaryReasonOptions() {
        return getPicklists(Case.Tommie_Alert_Primary_Reason__c.getDescribe(), false);
    }

    public List<SelectOption> getAcademicConcernOptions() {
        return getPicklists(Case.Academic_Performance_Reason_s__c.getDescribe(), false);
    }

    public List<SelectOption> getAttendanceConcernsOptions() {
        return getPicklists(Case.Attendance_Concerns_Reason_s__c.getDescribe(), false);
    }

    public List<SelectOption> getTommieHigh5ReasonOptions() {
        return getPicklists(Case.Tommie_High_5__c.getDescribe(), false);
    }

    public PageReference saveCase() {
        Id tcCaseRTID = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Tommie Cares').getRecordTypeId();

        PageReference savePage = Page.TommieCares;
        if (String.isNotBlank(bannerId)) {
            savePage.getParameters().put('bid', bannerId);
            savePage.getParameters().put('submitted', 'true');
            savePage.setRedirect(true);
        }
        tommieCaresCase.RecordTypeId = tcCaseRTID;
        tommieCaresCase.Case_Reporter__c = advisor.Id;
        tommieCaresCase.Subject = 'Tommie Cares';
        tommieCaresCase.Origin = 'Web';
        tommieCaresCase.Reporter_University_Email__c = advisor.hed__UniversityEmail__c;

        tommieCaresCase.Course_Offering__c = studentCourseConnection;
        tommieCaresCase.Alert_Term_lookup__c = currentTerm[0].Id;
        tommieCaresCase.Tommie_Alert_Primary_Reason__c = primaryConcern;
        tommieCaresCase.Tommie_High_5__c = highFiveReason;
        tommieCaresCase.Attendance_Concerns_Reason_s__c = attendanceConcern;
        tommieCaresCase.Academic_Performance_Reason_s__c = academicConcern;

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
                SELECT hed__Contact__c, hed__Contact__r.Id, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
                FROM hed__Relationship__c
                WHERE hed__Type__c IN :relationshipTypes
                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
                ORDER BY CreatedDate DESC NULLS LAST
        ];

        Map<String, hed__Relationship__c> advisorContactsMap = new Map<String, hed__Relationship__c>();
        for (hed__Relationship__c contact : advisorContacts) {
            advisorContactsMap.put(contact.hed__Type__c, contact);
        }

        if (advisorContactsMap.size() > 0) {
            tommieCaresCase.Primary_Advisor_Contact__c = getAdvisorInfo('Id', 'Primary Advisor', advisorContactsMap);
            tommieCaresCase.Primary_Advisory_Email__c = getAdvisorInfo('Email', 'Primary Advisor', advisorContactsMap);
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
        }

        System.debug('tommieCaresCase: ' + JSON.serializePretty(tommieCaresCase));

//        Get Primary Advisor Contact and Email Address
//        List<hed__Relationship__c> advisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'Primary Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (advisorContacts.size() > 0) {
//            tommieCaresCase.Primary_Advisor_Contact__c = advisorContacts[advisorContacts.size() - 1].hed__Contact__r.Id;
//            tommieCaresCase.Primary_Advisory_Email__c = advisorContacts[advisorContacts.size() - 1].hed__Contact__r.Email;
//        }
//
//        Get Student Athlete Advisor Contact and Email Address
//        List<hed__Relationship__c> STATHLadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'Student-Athlete Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (STATHLadvisorContacts.size() > 0) {
//            tommieCaresCase.Student_Athlete_Advisor_Email__c = STATHLadvisorContacts[STATHLadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.Student_Athlete_Advisor__c = STATHLadvisorContacts[STATHLadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }
//
//        Get Secondary Advisor Contact and Email Address
//        List<hed__Relationship__c> SecondadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'Secondary Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (SecondadvisorContacts.size() > 0) {
//            tommieCaresCase.Secondary_Advisor_Email__c = SecondadvisorContacts[SecondadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.Secondary_Advisor__c = SecondadvisorContacts[SecondadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }
//
//
//        Get FY Advisor Contact and Email Address
//        List<hed__Relationship__c> FYadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'First-Year Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//                //AND Effective_Term__r.hed__Start_Date__c <= TODAY
//                // ORDER BY Effective_Term__r.hed__End_Date__c NULLS LAST
//
//        ];
//
//        if (FYadvisorContacts.size() > 0) {
//            tommieCaresCase.First_Year_Advisor_Email__c = FYadvisorContacts[FYadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.First_Year_Advisor__c = FYadvisorContacts[FYadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }
//
////        Get Probation Advisor Contact and Email Address
//        List<hed__Relationship__c> PROBadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'Probationary Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (PROBadvisorContacts.size() > 0) {
//            tommieCaresCase.Probation_Advisor_Email__c = PROBadvisorContacts[PROBadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.Probation_Advisor_Contact__c = PROBadvisorContacts[PROBadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }
//
////        Get Financial Aid Counselor Contact and Email Address
//        List<hed__Relationship__c> FinAidadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'Financial Aid Counselor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (FinAidadvisorContacts.size() > 0) {
//            tommieCaresCase.Financial_Aid_Counselor_Email__c = FinAidadvisorContacts[FinAidadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.Financial_Aid_Counselor__c = FinAidadvisorContacts[FinAidadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }
//
////        Get General Advisor Contact and Email Address
//        List<hed__Relationship__c> GENadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'General Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (GENadvisorContacts.size() > 0) {
//            tommieCaresCase.General_Advisor_Email__c = GENadvisorContacts[GENadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.General_Advisor__c = GENadvisorContacts[GENadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }
//
//
////        Get International Advisor Contact and Email Address
//        List<hed__Relationship__c> INTLadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'International Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (INTLadvisorContacts.size() > 0) {
//            tommieCaresCase.International_Advisor_Email__c = INTLadvisorContacts[INTLadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.International_Advisor__c = INTLadvisorContacts[INTLadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }
//
////        Get Faculty Advisor Contact and Email Address
//        List<hed__Relationship__c> FACadvisorContacts = [
//                SELECT hed__Contact__c, hed__Contact__r.Name, Name, hed__Type__c, hed__RelatedContact__r.Name, hed__Contact__r.Email
//                FROM hed__Relationship__c
//                WHERE hed__Type__c = 'Faculty Advisor'
//                AND hed__RelatedContact__c = :tommieCaresCase.ContactId
//                ORDER BY CreatedDate DESC NULLS LAST
//                LIMIT 1
//        ];
//
//        if (FACadvisorContacts.size() > 0) {
//            tommieCaresCase.Faculty_Advisor_Email__c = FACadvisorContacts[FACadvisorContacts.size() - 1].hed__Contact__r.Email;
//            tommieCaresCase.Faculty_Advisor__c = FACadvisorContacts[FACadvisorContacts.size() - 1].hed__Contact__r.Id;
//        }

        List<hed__Course_Enrollment__c> courseConnection = [
                SELECT Id
                FROM hed__Course_Enrollment__c
                WHERE hed__Contact__r.Id = :tommieCaresCase.ContactId
                AND hed__Course_Offering__c = :studentCourseConnection
        ];

        if (courseConnection.size() > 0) {
            tommieCaresCase.Course_Connection__c = courseConnection[0].Id;
        }

        System.debug(JSON.serializePretty(tommieCaresCase));
        crud2Do.insertCase(tommieCaresCase);
        return savePage;
    }

    public String getAdvisorInfo(String EmailOrId, String relationshipType, Map<String, hed__Relationship__c> advisorContactsMap) {
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

    public List<SelectOption> getPicklists(Schema.DescribeFieldResult atObj, Boolean showSelectLabel) {
        List<SelectOption> listOut = new List<SelectOption>();
        List<Schema.PicklistEntry> ple = atObj.getPicklistValues();
        if (showSelectLabel) {
            listOut.add(new SelectOption('', 'Select...'));
        }
        for (Integer ii = 0; ii < ple.size(); ii++) {
            listOut.add(new SelectOption(ple[ii].getLabel(), ple[ii].getValue()));
        }
        return listOut;
    }

    public void getCanvasAccessToken() {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Canvas_Tommie_Alert_NC');
        req.setMethod('GET');
        Http http = new Http();
        HTTPResponse res = http.send(req);
        System.debug(res.getBody());
    }

    public without sharing class doCrud {

        public Contact getAdvisor(String bannerId) {
            Contact advisor = new Contact();
            try {
                advisor = [
                        SELECT Name, Id, Last_Name_First_Name__c, hed__UniversityEmail__c
                        FROM Contact
                        WHERE University_Banner_ID__c = :bannerId
                        LIMIT 1
                ];

            } catch (Exception e) {
                System.debug(e.getMessage());
            }
            return advisor;
        }

        public List<SelectOption> getCourses(String bannerIdAdvisor) {
            List<SelectOption> coursesList = new List<SelectOption>();

            //Get a list of current term courses assigned to that advisor
            coursesList.add(new SelectOption('', 'Select...'));

            List<hed__Course_Offering__c> advisorCourses = [
                    SELECT Id, Name, Course_Title__c, hed__Section_ID__c, hed__Faculty__r.University_Banner_ID__c
                    FROM hed__Course_Offering__c
                    WHERE hed__Faculty__r.University_Banner_ID__c = :bannerIdAdvisor
                    AND Current_Term__c = TRUE
                    ORDER BY Name ASC
            ];

            for (hed__Course_Offering__c course : advisorCourses) {
                coursesList.add(new SelectOption(course.Id, course.Name + ' - ' + course.hed__Section_ID__c + ' (' + course.Course_Title__c + ')'));
            }
            return coursesList;
        }

        public List<SelectOption> getStudents(Id courseOfferingId) {
            List<SelectOption> studentList = new List<SelectOption>() ;
            studentList.add(new SelectOption('', 'Select...'));
            Id studentRecordId = Schema.SObjectType.hed__Course_Enrollment__c.getRecordTypeInfosByName().get('Student').getRecordTypeId();
            List<hed__Course_Enrollment__c> students = [
                    SELECT hed__Contact__r.Id, hed__Contact__r.Last_Name_First_Name__c, hed__Contact__r.Advisor__r.Email, Credit_Hours__c, Id
                    FROM hed__Course_Enrollment__c
                    WHERE Current_Term_Course__c = TRUE
                    AND hed__Course_Offering__c = :courseOfferingId
                    AND RecordTypeId = :studentRecordId
                    AND Course_Connection_Deleted_in_Banner__c = FALSE
                    AND (Registration_Code__c = 'OR'
                    OR Registration_Code__c = 'RE')
//                    AND Credit_Hours__c != NULL
//                    AND Credit_Hours__c != '0'
                    ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC
            ];

            Map<Id, String> uniqueStudents = new Map<Id, String>();
            for (hed__Course_Enrollment__c student : students) {
                uniqueStudents.put(student.hed__Contact__r.Id, student.hed__Contact__r.Last_Name_First_Name__c);
            }

            for (Id key : uniqueStudents.keySet()) {
                studentList.add(new SelectOption(key, uniqueStudents.get(key)));
            }
            return studentList;
        }

        public void insertCase(Case caseToInsert) {
            try {
                insert caseToInsert;
            } catch (Exception e) {
                System.debug(e.getMessage());
            }
        }

    }
}