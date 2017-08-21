/// <reference types="vss-web-extension-sdk" />

import WorkItemRestClient = require("TFS/WorkItemTracking/RestClient");
import WorkItemServices = require("TFS/WorkItemTracking/Services");
import { WorkItem } from "./models/workitem.model";
import { Field } from "./models/field.model";
import { IWorkItemFormService } from "TFS/WorkItemTracking/Services";

class WorkItemClient {

    private readonly chunkSize: number = 100;

    constructor(private workItemType: string) { }

    async getCurrentWorkItemAsync(fieldsToLoad: string[]): Promise<WorkItem> {
        const service = await WorkItemServices.WorkItemFormService.getService();

        const id = await service.getId();
        const fields = await service.getFieldValues(fieldsToLoad);

        return new WorkItem(id, fieldsToLoad.map(x => new Field(x, fields[x])));
    }

    async getAllWorkItems(fieldsToLoad: string[]): Promise<WorkItem> {

        const client = WorkItemRestClient.getClient();
        const queryResult = await client.queryByWiql({
            query: `Select ${fieldsToLoad.join(",")} FROM WorkItems Where [System.WorkItemType] = '${this.workItemType}'`
        });

        if (queryResult.workItems.length > 0) {

            const workitemIds = queryResult.workItems.map(wi => wi.id);
            const columns = queryResult.columns.map(wiRef => wiRef.referenceName);

            const chunks = workitemIds.createChunks(this.chunkSize);
            let promises: Array<IPromise<WorkItem[]>>;
            for (let chunk of chunks) {
                promises.push(client.getWorkItems(chunk, columns));
            }

            return await Promise.all(promises);
        }
        else {
            return [];
        }
    }
}