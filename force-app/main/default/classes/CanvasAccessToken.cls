/**
 * Created by Thaddaeus Dahlberg, Software Engineer, University of St. Thomas on 7/8/2024.
 */

public with sharing class CanvasAccessToken {

    public static void getCanvasAccessToken() {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Canvas_Tommie_Alert_NC');
        req.setMethod('GET');
        Http http = new Http();
        HTTPResponse res = http.send(req);
        System.debug(res.getBody());
    }
}