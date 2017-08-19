/// <reference types="vss-web-extension-sdk" />

import TFS_Wit_Contracts = require("TFS/WorkItemTracking/Contracts");
import TFS_Wit_Client = require("TFS/WorkItemTracking/RestClient");
import TFS_Wit_Services = require("TFS/WorkItemTracking/Services");
import StringSimilarity = require("string-similarity");

class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;

    constructor(element: HTMLElement) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement("span");
        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500);
    }

    stop() {
        clearTimeout(this.timerToken);
    }

}

let el = document.getElementById("content");
let greeter = new Greeter(el);
greeter.start();

const extensionContext = VSS.getExtensionContext();
let menuAction = {
    execute: (actionContext) => {
        console.log(actionContext);

        TFS_Wit_Services.WorkItemFormService.getService().then(wi => {
            (<IPromise<string>>wi.getFieldValue("System.Title")).then(title => {
                console.log("Title: " + title);
            });
        });
        TFS_Wit_Services.WorkItemFormService.getService().then(wi => {
            (<IPromise<string>>wi.getFieldValue("Microsoft.VSTS.TCM.ReproSteps")).then(repro => {
                console.log("Repro Steps: " + repro);
            });
        });

        let similarity = StringSimilarity.compareTwoStrings("healed", "sealed");
        let matches = StringSimilarity.findBestMatch("healed", ["edward", "sealed", "theatre"]);
        console.log(similarity);
        console.log(matches);
    }
};

try {
    VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.find-similar-workitems-menu`, menuAction);
} catch (error) {
    // Can be ignored - dependent on the TFS version, this may occur.
}
try {
    VSS.register("find-similar-workitems-menu", menuAction);
} catch (error) {
    // Can be ignored - dependent on the TFS version, this may occur.
}
