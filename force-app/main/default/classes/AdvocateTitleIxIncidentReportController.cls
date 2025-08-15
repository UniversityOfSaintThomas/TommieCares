/**
 * Created by nguy0092 on 8/14/2025.
 */

public with sharing class AdvocateTitleIxIncidentReportController {
    private static String api_token = (String) Advocate_Symplicity_API_Token__mdt.getInstance('Api_Token').get('Title_IX__c');

    @AuraEnabled(Continuation=true Cacheable=true)
    public static Object titleIxReportingFormOptions() {
        Continuation con = new Continuation(60);
        con.continuationMethod = 'processGetResponse1';
        con.state='Picklist Values';

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://stthomas-advocate.symplicity.com/api/public/v1/picklists/titleix_reports/reporterType');
        req.setMethod('GET');
        req.setHeader('Authorization', api_token);
        con.addHttpRequest(req);

        return con;
    }

    @AuraEnabled(Cacheable=true)
    public static List<Object> processGetResponse1(List<String> labels, Object state) {
        List<Object> resultsObjects = new List<Object>();

        // Get the response by using the unique label
        HttpResponse response1 = Continuation.getResponse(labels[0]);

        if (response1.getStatusCode() == 200) {
            resultsObjects.add(response1.getBody());
        } else {
            System.debug('processGetResponse1 Error: '+response1.getStatusCode());
        }

        return resultsObjects;
    }
}