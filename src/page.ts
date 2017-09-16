/// <reference types="vss-web-extension-sdk" />

import StringSimilarity = require("string-similarity");
import Controls = require("VSS/Controls");
import Grids = require("VSS/Controls/Grids");
import WorkItemServices = require("TFS/WorkItemTracking/Services");
import { WorkItemClient } from "./workitem-client";
import { WorkItemRelation } from "TFS/WorkItemTracking/Contracts";
import { TfsWorkItem } from "./models/tfsworkitem.model";
import { WorkItemTypeInfo } from "./workitem-typeinfo";

const striptags = require("striptags");
const decode = require("decode-html");

export class Page {

    private grid: Grids.Grid;
    private workItemClient: WorkItemClient;
    private currentWorkItem: TfsWorkItem;
    private currentWorkItemFields: string[];
    private workItems: TfsWorkItem[];
    private workItemFormService: WorkItemServices.IWorkItemFormService;
    private currentRelations: WorkItemRelation[];

    constructor() {
        this.workItemClient = new WorkItemClient();
    }

    async reload() {
        let currentWorkItemType = await this.workItemClient.getCurrentWorkItemTypeAsync();
        this.currentWorkItemFields = WorkItemTypeInfo.getFieldsForType(currentWorkItemType);
        this.currentWorkItem = await this.workItemClient.getCurrentWorkItemAsync(this.currentWorkItemFields);
        this.currentRelations = await this.workItemFormService.getWorkItemRelations();

        this.workItems = this.currentWorkItem && this.currentWorkItem.id > 0
            ? (await this.workItemClient.getAllWorkItems(currentWorkItemType, this.currentWorkItemFields)).filter(x => x.id !== this.currentWorkItem.id)
            : await this.workItemClient.getAllWorkItems(currentWorkItemType, this.currentWorkItemFields);

        this.grid.setDataSource(this.workItems.map(w => this.mapWorkItems(w, this.currentWorkItem)));
        this.grid.redraw();
    }

    async onLoaded(workItem) {
        this.workItemFormService = await WorkItemServices.WorkItemFormService.getService();
        this.grid = await this.createGrid();
        await this.reload();
        VSS.notifyLoadSucceeded();
    }

    private async createGrid(): Promise<Grids.Grid> {
        let options: Grids.IGridOptions = {
            width: "100%",
            height: "100%",
            autoSort: true,
            sortOrder: [{ index: 2, order: "desc" }],
            lastCellFillsRemainingContent: true,
            columns: [
                { text: "Id", width: 50, canMove: false, fixed: true },
                { text: "Title", width: 200, fixed: true },
                { text: "Similarity", width: 100, fixed: true },
                {
                    text: "Actions", fixed: true, getCellContents: (rowInfo) => {
                        return $("<div>").addClass("grid-cell").css("padding", "5px")
                            .append(this.createViewButton(rowInfo))
                            .append(this.createLinkButton(rowInfo));
                    }
                },
                { text: "Repro Steps", index: 4, fixed: true }
            ]
        };

        return Controls.create(Grids.Grid, $("#grid-container"), options);
    }

    private createViewButton(rowInfo: any): any {
        return $("<span>").addClass("btn").attr("title", "Open workitem in new tab").append($("<img>").attr("src", "images/open.png"))
            .on("click", () => {
                let id = rowInfo.row.context.firstChild.innerText;
                WorkItemServices.WorkItemFormNavigationService.getService().then(workItemNavSvc => {
                    workItemNavSvc.openWorkItem(id, true);
                });
            });
    }

    private createLinkButton(rowInfo: any): any {
        const suffix = "/" + rowInfo.row.context.firstChild.innerText;
        let relation = this.currentRelations.filter(x => x.url.indexOf(suffix, x.url.length - suffix.length) !== -1)[0];
        let linkItemIcon = relation ? "images/unlink.png" : "images/link.png";
        let linkItemTitle = relation ? "Remove workitem relation" : "Link workitem to current one";
        return $("<span>").addClass("btn").attr("title", linkItemTitle).append($("<img>").attr("src", linkItemIcon))
            .on("click", (event) => {
                if (relation) {
                    this.workItemFormService.removeWorkItemRelations([relation]).then(() => {
                        relation = null;
                        this.setRelationLink(event.currentTarget, false);
                    });
                }
                else {
                    let id = +rowInfo.row.context.firstChild.innerText;

                    this.workItemFormService.addWorkItemRelations([{
                        rel: "Related",
                        url: this.workItems.filter(x => x.id === id)[0].resourceUrl,
                        attributes: {}
                    }]).then(() => {
                        this.workItemFormService.getWorkItemRelations().then(relations => {
                            relation = relations.filter(x => x.url.indexOf(suffix, x.url.length - suffix.length) !== -1)[0];
                        });
                        this.setRelationLink(event.currentTarget, true);
                    });
                }
            });
    }

    private mapWorkItems(workItem: TfsWorkItem, currentWorkItem: TfsWorkItem) {
        let reproStepsOther: string = "";
        if (workItem.fields.indexOf["Microsoft.VSTS.TCM.ReproSteps"] > -1) {
            reproStepsOther = striptags(decode(workItem.fields.filter(x => x.name === "Microsoft.VSTS.TCM.ReproSteps")[0].value));
        }

        let reproStepsCurrent: string = "";
        if (currentWorkItem.fields.indexOf["Microsoft.VSTS.TCM.ReproSteps"] > -1) {
            reproStepsCurrent = striptags(decode(currentWorkItem.fields.filter(x => x.name === "Microsoft.VSTS.TCM.ReproSteps")[0].value));
        }

        let titleOther: string = striptags(decode(workItem.fields["System.Title"]));
        let titleCurrent: string = striptags(decode(currentWorkItem.fields.filter(x => x.name === "System.Title")[0].value));
        let similarityTitle = StringSimilarity.compareTwoStrings(titleCurrent, titleOther);
        let similarityReproSteps = StringSimilarity.compareTwoStrings(reproStepsCurrent, reproStepsOther);
        let similarity: number = similarityTitle * 0.7 + similarityReproSteps * 0.3;

        return [
            workItem.id,
            workItem.fields["System.Title"],
            Math.floor(similarity * 1000) / 1000,
            workItem.id,
            reproStepsOther
        ];
    }

    private setRelationLink(element: Element, relationExists: boolean): void {
        let linkItemIcon = relationExists ? "images/unlink.png" : "images/link.png";
        let linkItemTitle = relationExists ? "Remove workitem relation" : "Link workitem to current one";
        element.setAttribute("title", linkItemTitle);
        element.children[0].setAttribute("src", linkItemIcon);
    }
}