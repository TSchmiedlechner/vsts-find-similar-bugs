/// <reference types="vss-web-extension-sdk" />

import StringSimilarity = require("string-similarity");
import Controls = require("VSS/Controls");
import Grids = require("VSS/Controls/Grids");
import { WorkItemClient } from "./workitem-client";

const striptags = require("striptags");
const decode = require("decode-html");

let page = {
    onLoaded: async (id) => {
        const workItemClient = new WorkItemClient("Bug");
        const currentWorkItem = await workItemClient.getCurrentWorkItemAsync(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"]);

        const workItems = await workItemClient.getAllWorkItems(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"]);
        //  let matches = StringSimilarity.findBestMatch(reproSteps, workItems.map(wi => wi.fields["Microsoft.VSTS.TCM.ReproSteps"]));

        console.log(currentWorkItem);

        let options: Grids.IGridOptions = {
            width: "100%",
            height: "100%",
            autoSort: true,
            sortOrder: [{ index: 2, order: "desc" }],
            lastCellFillsRemainingContent: true,
            source: workItems.map(function (w) {
                let reproStepsCurrent: string = striptags(decode(w.fields["Microsoft.VSTS.TCM.ReproSteps"]));
                let reproStepsOther: string = striptags(decode(currentWorkItem.fields.filter(x => x.name === "Microsoft.VSTS.TCM.ReproSteps")[0].value));

                let similarity: number = 0;
                if (reproStepsCurrent && reproStepsOther) {
                    console.log("calculating...");
                    similarity = StringSimilarity.compareTwoStrings(reproStepsCurrent, reproStepsOther);
                }

                return [
                    w.id,
                    w.fields["System.Title"],
                    Math.floor(similarity * 1000) / 1000,
                    reproStepsCurrent
                ];
            }),
            columns: [
                { text: "Id", index: 0, width: 50 },
                { text: "Title", index: 1, width: 200 },
                { text: "Similarity", index: 2, width: 100 },
                { text: "Repro Steps", index: 3 },
            ]
        };

        let grid = Controls.create(Grids.Grid, $("#grid-container"), options);
        VSS.notifyLoadSucceeded();
    }
};

const extensionContext = VSS.getExtensionContext();
// >= TFS 2017
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.find-similar-workitems-form-page`, page);
// <= TFS 2015
VSS.register("find-similar-workitems-form-page", page);
