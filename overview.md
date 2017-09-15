# Find Similar Workitems ![Build status](https://tschmiedlechner.visualstudio.com/_apis/public/build/definitions/4b3448f4-3eac-427c-893f-e8debddf42a6/2/badge)
An extension for Visual Studio Team Services and Team Foundation Server that adds an additional tab to the workitem edit form to search existing workitems that are semantically similar to the current one.

**Currently only supports bugs, other workitems are planned for future versions.**

## How it works
This extension compares multiple fields of the currently edited workitem with every other workitem of the same type in your project. The similarity is calculated with the [Dice Coefficient](https://www.npmjs.com/package/string-similarity) between the values of the respective fields to each other. Currently, only the fields *title* (70%) and *repro steps* (30%) are supported.

In future versions, it should be possible to select the used fields for each workitem type.

## Usage
### VSTS
Installing the extension from the marketplace should be enough. ;)

If you want to disable the tab/page for specific workitems (which may be useful, because currently only bugs are supported), you can do so by deriving from the process template you use. Further information can be found [here](https://docs.microsoft.com/de-de/vsts/work/process/customize-process-workflow).

### TFS
After installing the extension from the marketplace (or manually from the .vsix file), it has to be added to the workitem template manually. Modify the Bug.xml template and paste the following snippet at the end of the file, below the other <Page> declarations:

```xml
<PageContribution Label="Similar workitems" Id="tschmiedlechner.find-similar-workitems.find-similar-workitems-form-page" />
```

More infos on how to modify work files can be found [here](https://docs.microsoft.com/de-de/vsts/extend/develop/configure-workitemform-extensions).

