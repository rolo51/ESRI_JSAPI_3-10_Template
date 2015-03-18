function loadCheckboxes() {
    var cks = dojo.byId("checkboxes");
    cks.innerHTML = "";

    var gotLayers = dojo.xhrGet({
        url: "./XML/LayerMGT.xml",
        handleAs: "text",
        load: function (result) {
            var dom = dojox.xml.DomParser.parse(result);
            var layers = dom.byName("Layer");
            var tbl = dojo.create("table", { id: "checklist", class: "width100" }, cks);

            dojo.forEach(layers, function (layer, index) {
                var n = dojox.xml.parser.textContent(layer.byName("Name")[0]);
                var s = dojox.xml.parser.textContent(layer.byName("LayerPath")[0]);
                var nParsed = n.split(" ").join("_");
                var ix = "cbox" + index;
                var cbox = new dijit.form.CheckBox({
                    id: ix,
                    value: s,
                    style: "float:left;",
                    onChange: function (b) { toggleLayers(n, s, b); }
                });

                var tr = dojo.create("tr", {}, tbl);
                var td1 = dojo.create("td", { style:"width:65%;" }, tr);
                cbox.placeAt(td1, "last");
                var cboxLabel = dojo.create("span", { id: "span" + ix, innerHTML: n }, td1);
                var cboxImage = dojo.create("img", { id: nParsed + "Img", src: "./images/loading_small.gif" }, td1);
                dojo.addClass(cboxImage, "hide");

                var td2 = dojo.create("td", { style: "width:35%;" }, tr);
                var hr = new dijit.form.HorizontalRule({
                    container: "bottomDecoration",
                    count: 5,
                    style: "height:5px; float:right; width:100%;"
                });
                var hrl = new dijit.form.HorizontalRuleLabels({
                    container: "topDecoration",
                    style: "height:2em; font-style:monospace; font-size:75%; width:100%;",
                    labels: [0,25,50,75,100]
                });
                var hs = new dijit.form.HorizontalSlider({
                    name: (nParsed + "Slider"),
                    minimum: 0,
                    maximum: 100,
                    value: 100,
                    discreteValues: 101,
                    pageIncrement: 1,
                    showButtons: false,
                    style: "width:100%; margin: 15px 0px 0px 0px;",
                    onChange: function (value) {
                        OnTimeLineChange(n, value);
                    }
                });

                hs.placeAt(td2, "last");
                hr.placeAt(hs, "last");
                hrl.placeAt(hr, "after");
            });
        },
        error: function (err) {
            cks.innerHTML = err;
        }
    });
}

function toggleLayers(layerName, layerURL, isChecked) {
    var addedLayer = null;
    var lnParsed = layerName.split(" ").join("_") + "Img";

    if (isChecked) {
        dojo.removeClass(lnParsed, "hide");
        addedLayer = AddLayerToEntityCollection(layerName, layerURL, 100);
        AddToLegend();
    }
    else {
        RemoveLayerFromEntityCollection(layerName);
        AddToLegend();
    }
}

function LayerHasBeenAdded(e) {
    var nm = e.id.split(" ").join("_") + "Img";
    var l = dojo.byId(nm);

    if (l) {
        dojo.addClass(nm, "hide");
    }
}

function OnTimeLineChange(layerName, opacity) {
    var m = map;
    var eCount = m.layerIds.length;
    var AlreadyFound = false;
    var lyr = null;

    for (var i = 0; i < eCount; i++) {
        lyr = m.getLayer(m.layerIds[i]);

        if (lyr.id === layerName) {
            AlreadyFound = true;
            break;
        }
    }

    if (AlreadyFound) {
        if (lyr) {
            lyr.setOpacity(opacity / 100);
        }
    }
}