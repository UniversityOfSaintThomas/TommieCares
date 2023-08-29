/**
 * Created by frie9974 on 8/14/2023.
 */
public with sharing class TommieCaresController {
    public String bannerId { get; set; }
    public Contact advisor { get; set; }
    public hed__Term__c currentTerm { get; set; }
    public List<SelectOption> courses { get; set; }
    public Case tommieCaresCase { get; set; }
    public Id studentCourseConnection { get; set; }
    public Id courseOfferingId { get; set; }
    public String primaryConcern { get; set; }
    public String highFiveReason { get; set; }
    public String academicConcern { get; set; }
    public String attendanceConcern { get; set; }
    public doCrud crud2Do { get; set; }
    public Boolean caseSubmitted { get; set; }

    public TommieCaresController() {
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
                SELECT ID
                FROM hed__Term__c
                WHERE Current_Term__c = TRUE
                LIMIT 1
        ];

        courses = new List<SelectOption>();

        if (!String.isBlank(bannerId)) {
            advisor = crud2Do.getAdvisor(bannerId);
            if (advisor != null) {
                courses = crud2Do.getCourses(bannerId);
            }
        }
    }

    public List<SelectOption> getStudentsOptions() {
        return crud2Do.getStudents(courseOfferingId);
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
        System.debug('saving case for tommie cares');
        Id tcCaseRTID = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Tommie Cares').getRecordTypeId();

        PageReference savePage = Page.TommieCares;
        if (String.isNotBlank(bannerId)) {
            savePage.getParameters().put('bid', bannerId);
            savePage.getParameters().put('submitted', 'true');
            savePage.setRedirect(true);
        }
        System.debug(savePage);
        tommieCaresCase.RecordTypeId = tcCaseRTID;
        tommieCaresCase.Case_Reporter__c = advisor.Id;
        tommieCaresCase.Subject = 'Tommie Cares';
        tommieCaresCase.Origin = 'Web';
        tommieCaresCase.Course_Offering__c = studentCourseConnection;
        //tommieCaresCase.Course_Connection__c = ''
        tommieCaresCase.Reporter_University_Email__c = advisor.hed__UniversityEmail__c;
        tommieCaresCase.Alert_Term_lookup__c = currentTerm.Id;
        tommieCaresCase.Tommie_Alert_Primary_Reason__c = primaryConcern;
        tommieCaresCase.Tommie_High_5__c = highFiveReason;
        tommieCaresCase.Attendance_Concerns_Reason_s__c = attendanceConcern;
        //tommieCaresCase.Primary_Advisory_Email__c = advisor.hed__UniversityEmail__c;
        tommieCaresCase.Academic_Performance_Reason_s__c = academicConcern;

        System.debug(JSON.serializePretty(tommieCaresCase));
        crud2Do.insertCase(tommieCaresCase);
        return savePage;
    }

    public List<SelectOption> getPicklists(Schema.DescribeFieldResult atObj, Boolean showSelectLabel) {
        List<SelectOPtion> listOut = new List<SelectOption>();
        List<Schema.PicklistEntry> ple = atObj.getPicklistValues();
        if (showSelectLabel) {
            listOut.add(new SelectOption('', 'Select...'));
        }
        for (Integer ii = 0; ii < ple.size(); ii++) {
            listOut.add(new SelectOption(ple[ii].getLabel(), ple[ii].getValue()));
        }
        return listOut;
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
                    SELECT Id, Name
                    FROM hed__Course_Offering__c
                    WHERE hed__Faculty__r.University_Banner_ID__c = :bannerIdAdvisor
                    AND Current_Term__c = TRUE
                    ORDER BY Name ASC
            ];

            for (hed__Course_Offering__c co : advisorCourses) {
                coursesList.add(new SelectOption(co.Id, co.Name));
            }
            return coursesList;
        }

        public List<SelectOption> getStudents(Id stuc) {
            List<SelectOption> studentList = new List<SelectOption>() ;
            studentList.add(new SelectOption('', 'Select...'));
            List<hed__Course_Enrollment__c> stuList = [
                    SELECT hed__Contact__r.Id, hed__Contact__r.Last_Name_First_Name__c
                    FROM hed__Course_Enrollment__c
                    WHERE Current_Term_Course__c = TRUE
                    AND hed__Course_Offering__c = :stuc
                    AND RecordType.Name = 'Student'
                    ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC
            ];

            for (hed__Course_Enrollment__c stu : stuList) {
                studentList.add(new SelectOption(stu.hed__Contact__r.Id, stu.hed__Contact__r.Last_Name_First_Name__c));
            }
            return studentList;
        }


        public void insertCase(Case caseToInsert) {
            //try {
            insert caseToInsert;
            //  } catch (Exception e) {
            //      System.debug(e.getMessage());
            //  }
        }

    }

}