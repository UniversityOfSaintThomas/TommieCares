/**
 * Created by frie9974 on 8/14/2023.
 */
public without sharing class TommieCaresController {
    public String bannerId { get; set; }
    public Contact advisor { get; set; }
    public String advisorSFId { get; set; }
    public Id tcCaseRTID { get; set; }
    public List<SelectOption> courses { get; set; }
    public List<SelectOption> students { get; set; }
    public List<SelectOption> concerns { get; set; }
    public List<SelectOption> acconcerns { get; set; }
    public List<SelectOption> atconcerns { get; set; }
    public String selectedCourse { get; set; }
    public Case tcCase { get; set; }
    public Id stuCC { get; set; }
    public Id stuc { get; set; }
    public Id stud { get; set; }
    public String concs { get; set; }
    public String acconcs { get; set; }
    public String atconcs { get; set; }

    public class facultyCourses {
        public String courseName { get; set; }
        public Id courseId { get; set; }
    }

    public TommieCaresController() {
        if (String.isNotBlank(ApexPages.currentPage().getParameters().get('bid'))) {
            bannerId = ApexPages.currentPage().getParameters().get('bid').escapeHtml4();
        }
        tcCaseRTID = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Tommie Cares').getRecordTypeId();

        courses = new List<SelectOption>();
        students = new List<SelectOption>();
        concerns = new List<SelectOption>();
        acconcerns = new List<SelectOption>();
        atconcerns = new List<SelectOption>();


        if (!String.isBlank(bannerId)) {
            try {
                advisor = [SELECT Name, Id, Last_Name_First_Name__c, hed__UniversityEmail__c From Contact WHERE University_Banner_ID__c = :bannerId LIMIT 1];

            } catch (Exception e) {
                System.debug(e.getMessage());
            }

            if (advisor != null) {
                getCourses gc = new getCourses();
                courses = gc.getCourses(bannerId);

                // getStudents gs = new getStudents();
                // students = gs.getStudents(stuc);

                getConcerns gcs = new getConcerns();
                concerns = gcs.getConcerns();

                getacConcerns gaccs = new getacConcerns();
                acconcerns = gaccs.getacConcerns();

                getatConcerns gatcs = new getatConcerns();
                atconcerns = gatcs.getatConcerns();


            }
        }
    }

    public without sharing class getCourses {
        public List<SelectOption> getCourses(String bannerIdAdvisor) {
            List<SelectOption> coursesList = new List<SelectOption>();

            //Get a list of current term courses assigned to that advisor
            coursesList.add(new SelectOption('', '--None--'));

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

    }

    public without sharing class getStudents {
        public List<SelectOption> getStudents(Id stuc) {
            List<SelectOption> studentList = new List<SelectOption>() ;

            //  studentList.add(new SelectOption('','--None--'));

            List<hed__Course_Enrollment__c> stuList = [
                    SELECT hed__Contact__r.Id, hed__Contact__r.Last_Name_First_Name__c
                    FROM hed__Course_Enrollment__c
                    WHERE Current_Term_Course__c = TRUE
                    AND Course_Offering_ID__c = :stuc
                    ORDER BY hed__Contact__r.Last_Name_First_Name__c ASC
            ];
            for (hed__Course_Enrollment__c stu : stuList) {
                studentList.add(new SelectOption(stu.hed__Contact__r.Id, stu.hed__Contact__r.Last_Name_First_Name__c));
            }
            return studentList;
        }
    }

    public without sharing class getConcerns {
        public List<SelectOption> getConcerns() {
            List<SelectOption> concernsList = new List<SelectOption>() ;

            Schema.DescribeFieldResult atObj = Case.Tommie_Alert_Primary_Reason__c.getDescribe();
            List<Schema.PicklistEntry> ple = atObj.getPicklistValues();

            //  concernsList.add(new SelectOption('','--None--'));

            for (Integer ii = 0; ii < ple.size(); ii++) {
                concernsList.add(new SelectOption(ple[ii].getLabel(), ple[ii].getValue()));
            }
            return concernsList;
        }
    }

    public without sharing class getacConcerns {
        public List<SelectOption> getacConcerns() {
            List<SelectOption> acconcernsList = new List<SelectOption>() ;

            Schema.DescribeFieldResult atObj = Case.Academic_Performance_Reason_s__c.getDescribe();
            List<Schema.PicklistEntry> ple = atObj.getPicklistValues();

            //  acconcernsList.add(new SelectOption('','--None--'));

            for (Integer ii = 0; ii < ple.size(); ii++) {
                acconcernsList.add(new SelectOption(ple[ii].getLabel(), ple[ii].getValue()));
            }
            return acconcernsList;
        }
    }

    public without sharing class getatConcerns {
        public List<SelectOption> getatConcerns() {
            List<SelectOption> atconcernsList = new List<SelectOption>() ;

            Schema.DescribeFieldResult atObj = Case.Attendance_Concerns_Reason_s__c.getDescribe();
            List<Schema.PicklistEntry> ple = atObj.getPicklistValues();

            //  atconcernsList.add(new SelectOption('','--None--'));

            for (Integer ii = 0; ii < ple.size(); ii++) {
                atconcernsList.add(new SelectOption(ple[ii].getLabel(), ple[ii].getValue()));
            }
            return atconcernsList;
        }
    }


    private void setstuC() {
        stuC = tcCase.Course_Offering__c;
        System.debug('Course Offering: ' + stuC);
    }

    private void setstucc() {
        stucc = tcCase.Course_Connection__c;
        System.debug('Course Connection: ' + stucc);
    }
    private void setconcs() {
        concs = tcCase.Tommie_Alert_Primary_Reason__c;
        System.debug('Concerns: ' + concs);
    }

    private void setacconcs() {
        acconcs = tcCase.Academic_Performance_Reason_s__c;
        System.debug('Academic Concerns: ' + acconcs);
    }

    private void setatconcs() {
        atconcs = tcCase.Attendance_Concerns_Reason_s__c;
        System.debug('Attendance Concerns: ' + atconcs);
    }

}