/// <reference types="vss-web-extension-sdk" />

import WorkItemRestClient = require("TFS/WorkItemTracking/RestClient");
import WorkItemServices = require("TFS/WorkItemTracking/Services");
import { TfsWorkItem } from "./models/tfsworkitem.model";
import { Field } from "./models/field.model";
import { IWorkItemFormService } from "TFS/WorkItemTracking/Services";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";

export class WorkItemClient {

    private readonly chunkSize: number = 100;

    constructor(private workItemType: string) { }

    async getCurrentWorkItemAsync(fieldsToLoad: string[]): Promise<TfsWorkItem> {
        const service = await WorkItemServices.WorkItemFormService.getService();

        const id = await service.getId();
        const fields = await service.getFieldValues(fieldsToLoad);

        return new TfsWorkItem(id, fieldsToLoad.map(x => new Field(x, fields[x])));
    }

    async getAllWorkItems(fieldsToLoad: string[]): Promise<TfsWorkItem[]> {

        const client = WorkItemRestClient.getClient();
        const queryResult = await client.queryByWiql({
            query: `Select ${fieldsToLoad.join(",")} FROM WorkItems Where [System.WorkItemType] = '${this.workItemType}'`
        });

        if (queryResult.workItems.length > 0) {

            const workitemIds = queryResult.workItems.map(wi => wi.id);
            const columns = queryResult.columns.map(wiRef => wiRef.referenceName);

            const chunks = this.createChunks(workitemIds, this.chunkSize);
            let promises: Array<IPromise<WorkItem[]>> = [];
            for (let chunk of chunks) {
                promises.push(client.getWorkItems(chunk, columns));
            }

            let results = await Promise.all(promises);
            return [].concat.apply([], results)
                .filter(x => x)
                .map(x => new TfsWorkItem(x.id, this.mapFields(x.fields)));
        }
        else {
            return [];
        }
    }

    private mapFields(inputFields: any): Field[] {
        let fields: Field[] = [];
        for (let key in inputFields) {
            fields[key] = inputFields[key];
        }
        return fields;
    }

    private createChunks(array: number[], chunkSize: number): number[][] {
        let chunks: number[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}