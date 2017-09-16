    /// <reference types="vss-web-extension-sdk" />

import WorkItemRestClient = require("TFS/WorkItemTracking/RestClient");
import WorkItemServices = require("TFS/WorkItemTracking/Services");
import { TfsWorkItem } from "./models/tfsworkitem.model";
import { Field } from "./models/field.model";
import { IWorkItemFormService } from "TFS/WorkItemTracking/Services";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";

const striptags = require("striptags");
const decode = require("decode-html");

export class WorkItemClient {
    private readonly chunkSize: number = 100;
    private readonly workItemTypeId: string = "System.WorkItemType";

    async getCurrentWorkItemTypeAsync(): Promise<string> {
        const service = await WorkItemServices.WorkItemFormService.getService();
        return await service.getFieldValue(this.workItemTypeId) as string;
    }

    async getCurrentWorkItemAsync(fieldsToLoad: string[]): Promise<TfsWorkItem> {
        const service = await WorkItemServices.WorkItemFormService.getService();
        const id = await service.getId();
        const fields = await service.getFieldValues(fieldsToLoad);
        for (let key of fieldsToLoad) {
            if (fields[key]) {
                fields[key] = striptags(decode(fields[key]));
            }
            else {
                fields[key] = "";
            }
        }

        return new TfsWorkItem(id, fieldsToLoad.map(x => new Field(x, fields[x])));
    }

    async getAllWorkItems(workItemType: string, fieldsToLoad: string[]): Promise<TfsWorkItem[]> {
        const client = WorkItemRestClient.getClient();
        const queryResult = await client.queryByWiql({
            query: `Select ${fieldsToLoad.join(",")} FROM WorkItems Where [System.WorkItemType] = '${workItemType}'`
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
                .map(x => new TfsWorkItem(x.id, this.mapFields(fieldsToLoad, x.fields), x.url));
        }
        else {
            return [];
        }
    }

    private mapFields(fieldsToLoad: string[], inputFields: any): Field[] {
        let fields: Field[] = [];
        for (let key of fieldsToLoad) {
            if (inputFields[key]) {
                fields.push(new Field(key, striptags(decode(inputFields[key]))));
            }
            else {
                fields.push(new Field(key, ""));
            }
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