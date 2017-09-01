import { Field } from "./field.model";

export class TfsWorkItem {

    constructor(public id: number, public fields: Field[], public resourceUrl?: string) { }
}