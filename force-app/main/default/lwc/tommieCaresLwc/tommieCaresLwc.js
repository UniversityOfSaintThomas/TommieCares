/**
 * Created by nguy0092 on 10/8/2024.
 */

import {LightningElement, api, wire} from 'lwc';
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import currentTermAdvisor from "@salesforce/apex/TommieCaresLwcController.currentTermAdvisor";

export default class TommieCaresLwc extends LightningElement {

    @api urlBid = '';
    @api urlSbid = '';
    @api urlCrn = '';

    CurrentTerm;
    AdvisorBannerId;
    AdvisorContactName;
    AdvisorLNameFName;

    @wire(currentTermAdvisor, {urlBid: "$urlBid"})
    termAdvisorWire({error, data}) {

        if(data) {
            const termAdvisor = JSON.parse(JSON.stringify(data));
            this.CurrentTerm = termAdvisor.CurrentTerm;
            this.AdvisorBannerId = termAdvisor.AdvisorBannerId;
            this.AdvisorContactName = termAdvisor.AdvisorContactName;
            this.AdvisorLNameFName = termAdvisor.AdvisorLNameFName;
        }

        if(error) {
            console.log("termAdvisorWire error!");
        }
    }

}