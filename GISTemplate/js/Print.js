function PrintMe() {
    var Title = dojo.byId("txtMapTitle").value;
    var MapSize = dojo.byId("ddlMapSize")
    var MapFormat = dojo.byId("ddlMapFormat").value;

    if (MapSize.value === "-1") {
        alert("Map Layout is required");
        MapSize.focus();
    }
    else {
        var template = new esri.tasks.PrintTemplate();

        template.layoutOptions = {
            titleText: Title,
            scalebarUnit: "Miles",
            legendLayers: [],
            authorText: GetSiteSetting("MapDisclaimerStart"),
            copyrightText: GetSiteSetting("MapDisclaimerEnd")
        };

        template.format = MapFormat;
        template.layout = MapSize.value;
        template.showAttribution = true;
        template.preserveScale = false;
        printParams.template = template;

        ToggleVisibility("btnPrint");
        ToggleVisibility("imgPrintLoading");

        printTask.execute(printParams, printResult, printError);
    }
}

function printResult(res) {
    ToggleVisibility("imgPrintLoading");
    ToggleVisibility("btnPrint");
    window.open(res.url);
}

function printError(printerr) {
    ToggleVisibility("imgPrintLoading");
    ToggleVisibility("btnPrint");
    alert(printerr.message.toString());
}