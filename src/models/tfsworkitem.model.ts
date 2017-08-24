import { Field } from "./field.model";

export class TfsWorkItem {

    constructor(public id: number, public fields: Field[]) { }
}