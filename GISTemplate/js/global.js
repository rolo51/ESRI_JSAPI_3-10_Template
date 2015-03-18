var map = null;
var gvInitExtent = null;
var gvTabContainer = null;
var printParams = null;
var measurement = null;

function GetSiteSetting(SettingName) {
    var SettingValue = null;
    var arr = null;
    var xmlDoc = GetResponseText("./XML/Settings.xml", false);

    try {
        var xD = dojox.xml.parser.parse(xmlDoc);
        arr = dojo.query("Site", xD);
        // This fills arr with the settings urls in the Settings.xml file

        var sURL = "";
        dojo.some(arr, function (a) {
            var b = dojo.query("Name", a)[0].textContent;

            if (b === SettingName) {
                sURL = dojo.query("Setting", a)[0].textContent;
                return false;
            }
        });
        return sURL;
    } catch (e) {
        alert(e.message);
    }
}

function AddLayerToEntityCollection(lyrname, URL, opacityVal) {
    var m = map;
    var eCount = m.layerIds.length;
    var gCount = m.graphicsLayerIds.length;
    var AlreadyFound = false;

    for (var i = 0; i < eCount; i++) {
        var lyr = m.getLayer(m.layerIds[i]);

        if (lyr.id == lyrname) {
            AlreadyFound = true;
            return lyr;
            break;
        }
    }

    for (var k = 0; k < gCount; k++) {
        var lyr2 = m.getLayer(m.graphicsLayerIds[k]);

        if (lyr2.id == lyrname) {
            AlreadyFound = true;
            return lyr2;
            break;
        }
    }

    if (AlreadyFound == false) {
        try {
            var dLayer = new esri.layers.ArcGISDynamicMapServiceLayer(URL);

            dLayer.showAttribution = true;
            dLayer.id = lyrname;
            dLayer.setOpacity(opacityVal / 100);
            m.addLayer(dLayer);
            return dLayer;
        } catch (e) {
            alert(e);
        }
    }
}

function RemoveLayerFromEntityCollection(lyrname) {
    var m = map;
    var eCount = m.layerIds.length;
    var gCount = m.graphicsLayerIds.length;

    for (var i = 0; i < eCount; i++) {
        var lyr = m.getLayer(m.layerIds[i]);

        if (lyr.id == lyrname) {
            try {
                m.removeLayer(lyr);
                break;
            }
            catch (e) {
                alert(e);
            }
        }
    }

    for (var k = 0; k < gCount; k++) {
        var lyr2 = m.getLayer(m.graphicsLayerIds[k]);

        if (lyr2.id == lyrname) {
            try {
                m.removeLayer(lyr2);
                break;
            }
            catch (e2) {
                alert(e2);
            }
        }
    }
}

function GetResponseText(url, useProxy) {
    var http = null;
    var respText = null;
    var u = "";

    if (useProxy) {
        u = "./WebHandlers/proxy.ashx?" + url;
    }
    else {
        u = url;
    }

    if (window.XMLHttpRequest) {    // code for IE7+, Firefox, Chrome, Opera, Safari
        http = new XMLHttpRequest();
    }
    else {      // code for IE6, IE5
        http = new ActiveXObject("Microsoft.XMLHTTP");
    }

    try {
        http.open("GET", u, false);
        http.send(null);

        respText = http.responseText;

        return respText;
    } catch (e) {

    }
}

function ManageBaseMap(ImageSource) {
    if (ImageSource.title == "View Streets") {
        ImageSource.src = "images/SatelliteMap.png";
        ImageSource.title = "View Imagery";
        ImageSource.alt = "View Imagery";
        map.setBasemap("streets");
    }
    else {
        ImageSource.src = "images/RoadMap.png";
        ImageSource.title = "View Streets";
        ImageSource.alt = "View Streets";
        map.setBasemap("hybrid");
    }
}

function HidePanel(pnlName) {
    dojo.fx.wipeOut({
        node: pnlName
    }).play();
}

function ShowPanel(pnlName) {
    dojo.fx.wipeIn({
        node: pnlName
    }).play();
}

function HideShowPanel(pnlName, sender) {
    var caller = dojo.byId(sender);
    var pnl = dojo.byId(pnlName);

    if (caller && pnl) {
        if (caller.alt == "Minimize") {
            caller.alt = "Maximize";
            caller.src = "./images/MaxSmall.png";
            HidePanel(pnlName);
        }
        else {
            caller.alt = "Minimize";
            caller.src = "./images/MinSmall.png";
            ShowPanel(pnlName);
        }
    }
}

function TabChanged(name, oval, nval) {
    switch (nval.id) {
        case "cpLayers":
            break;
        default:
            break;
    }
}

function ToggleVisibility(byID) {
    dojo.toggleClass(byID, "hide");
}