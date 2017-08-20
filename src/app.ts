/// <reference types="vss-web-extension-sdk" />

import TFS_Wit_Contracts = require("TFS/WorkItemTracking/Contracts");
import TFS_Wit_Client = require("TFS/WorkItemTracking/RestClient");
import TFS_Wit_Services = require("TFS/WorkItemTracking/Services");
import StringSimilarity = require("string-similarity");

const extensionContext = VSS.getExtensionContext();
let menuAction = {
    execute: (actionContext) => {
        if (actionContext.workItemTypeName !== "Bug") {
            console.log("Currently, only bugs are supported by this extension.");
            return;
        }

        TFS_Wit_Services.WorkItemFormService.getService().then(wi => {
            wi.getFieldValues(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"]).then(fields => {
                let title = fields["System.Title"];
                let reproSteps = fields["Microsoft.VSTS.TCM.ReproSteps"];

                let client = TFS_Wit_Client.getClient();
                let start = new Date().getTime();

                client.queryByWiql({ query: "Select [System.Title],[Microsoft.VSTS.TCM.ReproSteps] FROM WorkItems Where [System.WorkItemType] = 'Bug'" }).then(
                    queryResult => {
                        // We got the work item ids, now get the field values
                        if (queryResult.workItems.length > 0) {

                            let workitemIds = queryResult.workItems.map(wi => wi.id);
                            let columns = queryResult.columns.map(wiRef => wiRef.referenceName);

                            let chunkSize = 100;
                            for (let i = 0; i < workitemIds.length; i += chunkSize) {
                                let chunk = workitemIds.slice(i, i + chunkSize);
                                client.getWorkItems(chunk, columns)
                                    .then(workItems => {
                                        // let similarity = StringSimilarity.compareTwoStrings("healed", "sealed");
                                        let matches = StringSimilarity.findBestMatch(reproSteps, workItems.map(wi => wi.fields["Microsoft.VSTS.TCM.ReproSteps"]));
                                        console.log(matches);
                                        let end = new Date().getTime();
                                        console.log("Finding the workitems took: " + (end - start));

                                    }, err => {
                                        console.log(err.message);
                                    });
                            }
                        }
                    },
                    err => {
                        console.log(err);
                    },
                );
            });
        });
    }
};

// Needed for >TFS2017
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.find-similar-bugs-menu`, menuAction);
// Needed for <TFS2015
VSS.register("find-similar-bugs-menu", menuAction);
