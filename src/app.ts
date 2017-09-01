﻿/// <reference types="vss-web-extension-sdk" />

import StringSimilarity = require("string-similarity");
import Controls = require("VSS/Controls");
import Grids = require("VSS/Controls/Grids");
import WorkItemServices = require("TFS/WorkItemTracking/Services");
import { WorkItemClient } from "./workitem-client";
import { WorkItemRelation } from "TFS/WorkItemTracking/Contracts";

const striptags = require("striptags");
const decode = require("decode-html");

let page = {
    onLoaded: async (id) => {
        const workItemClient = new WorkItemClient("Bug");
        const currentWorkItem = await workItemClient.getCurrentWorkItemAsync(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"]);

        const workItems = currentWorkItem && currentWorkItem.id > 0
            ? (await workItemClient.getAllWorkItems(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"])).filter(x => x.id !== currentWorkItem.id)
            : await workItemClient.getAllWorkItems(["System.Title", "Microsoft.VSTS.TCM.ReproSteps"]);

        let options: Grids.IGridOptions = {
            width: "100%",
            height: "100%",
            autoSort: true,
            sortOrder: [{ index: 2, order: "desc" }],
            lastCellFillsRemainingContent: true,
            source: workItems.map(w => {
                let reproStepsOther: string = striptags(decode(w.fields["Microsoft.VSTS.TCM.ReproSteps"]));
                let reproStepsCurrent: string = striptags(decode(currentWorkItem.fields.filter(x => x.name === "Microsoft.VSTS.TCM.ReproSteps")[0].value));
                let titleOther: string = striptags(decode(w.fields["System.Title"]));
                let titleCurrent: string = striptags(decode(currentWorkItem.fields.filter(x => x.name === "System.Title")[0].value));

                let similarity: number = 0;
                if (reproStepsCurrent && reproStepsOther && titleCurrent && titleOther) {
                    let similarityTitle = StringSimilarity.compareTwoStrings(titleCurrent, titleOther);
                    let similarityReproSteps = StringSimilarity.compareTwoStrings(reproStepsCurrent, reproStepsOther);
                    similarity = similarityTitle * 0.7 + similarityReproSteps * 0.3;
                }
                return [
                    w.id,
                    w.fields["System.Title"],
                    Math.floor(similarity * 1000) / 1000,
                    w.id,
                    reproStepsCurrent
                ];
            }),
            columns: [
                { text: "Id", width: 50, canMove: false, fixed: true },
                { text: "Title", width: 200, fixed: true },
                { text: "Similarity", width: 100, fixed: true },
                {
                    text: "Actions", fixed: true, getCellContents: (
                        rowInfo,
                        dataIndex,
                        expandedState,
                        level,
                        column,
                        indentIndex,
                        columnOrder) => {

                        return $("<div>").addClass("grid-cell").css("padding", "5px")
                            .append($("<span>").addClass("btn").attr("title", "Open workitem in new tab").append($("<img>").attr("src", "images/open.png"))
                                .on("click", () => {
                                    let id = rowInfo.row.context.firstChild.innerText;
                                    WorkItemServices.WorkItemFormNavigationService.getService().then(function (workItemNavSvc) {
                                        workItemNavSvc.openWorkItem(id, true);
                                    });
                                })
                            )
                            .append($("<span>").addClass("btn").attr("title", "Link workitem to current one").append($("<img>").attr("src", "images/link.png"))
                                .on("click", () => {
                                    let id = +rowInfo.row.context.firstChild.innerText;
                                    WorkItemServices.WorkItemFormService.getService().then(function (workitemFormService) {
                                        workitemFormService.addWorkItemRelations([{
                                            rel: "Related",
                                            url: workItems.filter(x => x.id === id)[0].resourceUrl,
                                            attributes: {}
                                        }]);
                                    });
                                })
                            );
                    }
                },
                { text: "Repro Steps", index: 4, fixed: true }
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
