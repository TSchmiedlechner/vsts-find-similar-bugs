/// <reference types="vss-web-extension-sdk" />

import StringSimilarity = require("string-similarity");
import {WorkItemClient} from "./workitem-client";

const extensionContext = VSS.getExtensionContext();
let menuAction = {
    execute: async (actionContext) => {
        if (actionContext.workItemTypeName !== "Bug") {
            console.log("Currently, only bugs are supported by this extension.");
            return;
        }

        const workItemClient = new WorkItemClient("Bug");
        const currentWorkItem = await workItemClient.getCurrentWorkItemAsync(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"]);
        const workItems = await workItemClient.getAllWorkItems(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"]);

        console.log(currentWorkItem);
        console.log(workItems);
       //  let matches = StringSimilarity.findBestMatch(reproSteps, workItems.map(wi => wi.fields["Microsoft.VSTS.TCM.ReproSteps"]));
    }
};

// Needed for >TFS2017
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.find-similar-bugs-menu`, menuAction);
// Needed for <TFS2015
VSS.register("find-similar-bugs-menu", menuAction);
