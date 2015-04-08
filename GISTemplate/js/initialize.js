require([
    "esri/config",
    "esri/map",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-construct",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/geometry/Extent",
    "esri/geometry/Circle",
    "esri/SpatialReference",
    "dojo/dnd/Moveable",
    "dojo/query",
    "dojo/window",
    "esri/toolbars/draw",
    "esri/tasks/locator",
    "esri/dijit/Print",
    "esri/tasks/PrintTemplate",
    "esri/tasks/PrintParameters",
    "esri/tasks/PrintTask",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/DeferredList",
    "dijit/registry",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/form/CheckBox",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "esri/tasks/GeometryService",
    "esri/dijit/Measurement",
    "esri/units",
    "dojox/xml/parser",
    "dojox/xml/DomParser",
    "dojo/domReady!"
], function (
        esriConfig,
        Map,
        on,
        dom,
        domConstruct,
        ArcGISDynamicMapServiceLayer,
        Extent,
        Circle,
        SpatialReference,
        Moveable,
        query,
        win,
        Draw,
        Locator,
        Print,
        PrintTemplate,
        PrintParameters,
        PrintTask,
        IdentifyTask,
        IdentifyParameters,
        Query,
        QueryTask,
        DeferredList,
        registry,
        TabContainer,
        ContentPane,
        CheckBox,
        HorizontalSlider,
        HorizontalRule,
        HorizontalRuleLabels,
        GeometryService,
        Measurement,
        Units,
        Parser,
        DomParse,
        domReady
    ) {
    esri.config.defaults.io.proxyUrl = "./WebHandlers/proxy.ashx";

    gvInitExtent = new Extent({
        "xmin": -10878648.827654503,
        "ymin": 3833793.209004922,
        "xmax": -10780809.43144961,
        "ymax": 3896471.5721986815,
        "spatialReference": new SpatialReference(102100)
    });

    map = new esri.Map("map", {
        basemap: "streets",
        extent: gvInitExtent,
        displayGraphicsOnPan: false
    });//zoom: 11,showInfoWindowOnClick: false,
    
    dojo.parser.parse(); // Because dojoConfig = { parseOnLoad:false } in index.html

    gvTabContainer = registry.byId("tc");
    gvTabContainer.watch("selectedChildWidget", TabChanged);

    var dnd = new dojo.dnd.Moveable(dojo.byId("divDragPanel"), { handle: "dragPanelID", skip: true });
    var dndPrint = new dojo.dnd.Moveable(dojo.byId("divPrintMe"), { handle: "printDrag", skip: true });
    var dndLegend = new dojo.dnd.Moveable(dojo.byId("divLegend"), { handle: "legendDrag", skip: true });

    dojo.connect(window, "resize", resize);
    dojo.connect(map, "onLoad", InitializeMapOnLoad);
    dojo.connect(map, "onLayerAdd", LayerHasBeenAdded); //"addLayer"
    dnd.on("Move", panelMove);
    dnd.on("MoveStop", CheckDragPanelOnResize);
    dndPrint.on("Move", panelMove);
    dndPrint.on("MoveStop", CheckDragPanelOnResize);
    dndLegend.on("Move", panelMove);
    dndLegend.on("MoveStop", CheckDragPanelOnResize);
    on(dojo.byId("imgMin"), "click", function () { HideShowPanel("divContent", this); });
    on(dojo.byId("imgImagery"), "click", function () { ManageBaseMap(this); });
    on(dojo.byId("imgIdentify"), "click", function () { alert("Right Click On Map For Identify"); });
    on(dojo.byId("imgPrint"), "click", function () { ToggleVisibility("divPrintMe"); });
    on(dojo.byId("imgPrintMeClose"), "click", function () { ToggleVisibility("divPrintMe"); });
    on(dojo.byId("imgLegendClose"), "click", function () { ToggleVisibility("divLegend"); });
    on(dojo.byId("aLegend"), "click", function () { ToggleVisibility("divLegend"); });
    on(dojo.byId("btnPrint"), "click", PrintMe);
    on(dojo.byId("btnResetMeasure"), "click", ResetMeasurement);
    on(dojo.byId("btnURL"), "click", ParseURL);
    
    loadCheckboxes();
    printParams = new PrintParameters();
    printParams.map = map;
    printTask = new PrintTask(GetSiteSetting("printtaskurl"), printParams, { async: true });
    resize();
});

var panelMove = function (e) {
    if (parseInt(e.node.style.top, 10) <= 69) {
        e.node.style.top = "69px";
    }

    if (parseInt(e.node.style.left, 10) <= 0) {
        e.node.style.left = "0px";
    }
};

var resize = function () {
    var ctr = map.extent.getCenter();

    dojo.byId("map").style.height = (dojo.window.getBox().h - 70) + 'px';
    setTimeout(function () { map.centerAt(ctr); }, 500);
    map.resize();
    CheckDragPanelOnResize(dojo.byId("divDragPanel"));
};

var CheckDragPanelOnResize = function (e) {
    var viewPort = dojo.window.getBox();

    if (e) {
        if (e.node) {
            var obj = dojo.position(e.node);

            if (!isNaN(parseInt(e.node.style.left, 10))) {
                var Ix = viewPort.w - parseInt(e.node.style.left, 10);

                if (Ix < obj.w) {
                    e.node.style.left = (viewPort.w - obj.w - 10) + "px";
                }
            }
        }
        else if (e.style) {
            var obj = dojo.position(e);

            if (!isNaN(parseInt(e.style.left, 10))) {
                var Ix = viewPort.w - parseInt(e.style.left, 10);

                if (Ix < obj.w) {
                    e.style.left = (viewPort.w - obj.w - 10) + "px";
                }
            }
        }
    }
}

function InitializeMapOnLoad(e) {
    try {
        // Add Home button to Zoom Slider Bar
        dojo.create("div", {
            className: "esriSimpleSliderHomeButton",
            onclick: function () {
                map.setExtent(gvInitExtent);
            }
        }, dojo.query(".esriSimpleSliderIncrementButton")[0], "after");

        // Create Measurement tool
        measurement = new esri.dijit.Measurement({
            map: map,
            defaultAreaUnit: esri.Units.SQUARE_MILES,
            defaultLengthUnit: esri.Units.MILES
        }, dojo.byId("divMeasure"));
        measurement.startup();
        measurement.hideTool("location");
        measurement.on("measure-end", MeasureEnd);

        // Override default browser right-click context menu
        var ctxMenuForMap = new dijit.Menu({
            id: "ctxMenuForMap",
            contextMenuForWindow: false,
            targetNodeIds: ["map"],
            onOpen: function (e) {
                // Lets calculate the map coordinates where user right clicked.
                // We'll use this to create the graphic
                var currentLocation = getMapPointFromMenuPosition(e);
                var convertLocation = esri.geometry.webMercatorToGeographic(currentLocation);

                map.graphics.clear(); // Clear the graphics layer first before continuing            
                //removeEventHandler(gvRevGeoOnMouseOver);

                map.infoWindow.setTitle("One moment...");
                map.infoWindow.setContent("<table class='center'><tr><td>Nothing to see...<img src='./images/loading_small.gif' alt='' /></td></tr></table>");
                map.infoWindow.show(currentLocation); // Immediately show the infoWindow

                //PerformSearch(currentLocation); //Uncomment this to do something
            }
        });
        ctxMenuForMap.startup();
    } catch (e) {
        alert(e);
    }
}

function getMapPointFromMenuPosition(box) {
    var x = box.x, y = box.y;

    switch (box.corner) {
        case "TR":
            x += box.w;
            break;
        case "BL":
            y += box.h;
            break;
        case "BR":
            x += box.w;
            y += box.h;
            break;
    }

    var screenPoint = new esri.geometry.Point(x - map.position.x, y - map.position.y);

    return map.toMap(screenPoint);
}

function ParseURL(e) {
	var rest = dojo.byId("url");
	var url = "./WebHandlers/proxy.ashx?" + rest.value + "?f=pjson";
	var getService = dojo.xhrGet({
		url: url,
		handleAs: "json"
	}).then(function (result) {
		var folders = result.folders;

		dojo.forEach(folders, function (folder, i) {
			//var cbx = "<input id='" + i + "' type='checkbox' />&nbsp;";
			//dojo.byId("urlResults").innerHTML += cbx + folder.toString() + "<br />";
			var label = dojo.create("label", {
				innerHTML: folder.toString()
			});
			var checkbox = dojo.create("input", {
				type: "checkbox",
				value: folder.toString()
			});
			dojo.place(checkbox, "urlResults");
			dojo.place(label, "urlResults");
			dojo.place("<br />", "urlResults");
			dojo.connect(checkbox, "onchange", function () {
				if (this.checked) {
					ParseService(this.value);
				}
				else {
					dojo.destroy(this.value);
				}
			});
		});
		
	}, function (err) {
		dojo.byId("urlResults").innerHTML = err;
	});
}

function ParseService(serviceURL) {
	var rest = dojo.byId("url");
	var url = "./WebHandlers/proxy.ashx?" + rest.value + "/" + serviceURL + "?f=pjson";
	var getService = dojo.xhrGet({
		url: url,
		handleAs: "json"
	}).then(function (result) {
		var services = result.services;
		var newdiv = dojo.create("div", {
			id: serviceURL,
			innerHTML: ""
		});

		dojo.forEach(services, function (service, i) {
			var n = service.name;
			var t = service.type;

			if (t === "MapServer") {
				var label = dojo.create("p", {
					innerHTML: rest.value + "/" + service.name
				});
				dojo.place(label, newdiv);
			}
		});

		dojo.place(newdiv, "urlResults");
	}, function (err) {
		dojo.byId("urlResults").innerHTML = err;
	});
}