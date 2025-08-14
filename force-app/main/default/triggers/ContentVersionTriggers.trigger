/**
 * Created by nguy0092 on 8/11/2025.
 */

trigger ContentVersionTriggers on ContentVersion (after insert) {

    ContentVersionTriggersHandler contentVersionHandler = new ContentVersionTriggersHandler();
    switch on Trigger.operationType {
        when AFTER_INSERT {
            contentVersionHandler.afterInsert(Trigger.new);
        }

    }
}