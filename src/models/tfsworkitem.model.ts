import { Field } from "./field.model";

export class TfsWorkItem {

    constructor(public id: number, public fields: Field[], public resourceUrl?: string) { }

    getFieldValue(fieldName: string): string {
        return this.fields.filter(x => x.name === fieldName)[0].value;
    }
}