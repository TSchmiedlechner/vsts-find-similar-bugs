export class WorkItemTypeInfo {
    public static getFieldsForType(workItemType: string): string[] {
        switch (workItemType) {
            case "Bug":
                return [Fields.Title, Fields.ReproSteps];
            case "Epic":
            case "Feature":
            case "Impediment":
            case "Product Backlog Item":
            case "User Story":
            case "Issue":
            case "Task":
                return [Fields.Title, Fields.Description];
            default:
                console.warn(`Workitem type ${workItemType} is currently not supported. Title and description are used, but this may fail, depending on your process configuration.`);
                return [Fields.Title, Fields.Description];
        }
    }
}

class Fields {
    static readonly Title: string = "System.Title";
    static readonly ReproSteps: string = "Microsoft.VSTS.TCM.ReproSteps";
    static readonly Description: string = "System.Description";
}
