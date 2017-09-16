import { Page } from "./page";

const page = new Page();
const extensionContext = VSS.getExtensionContext();

$("#btnReload").on("click", async () => {
    await page.reload();
});

// >= TFS 2017
VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.find-similar-workitems-form-page`, page);
// <= TFS 2015
VSS.register("find-similar-workitems-form-page", page);
