function AddToLegend() {
    var cboxes = dojo.query("input", dojo.byId("checkboxes"));
    var cb = [];
    var defList = [];
    var html = "<table class='width100'>";

    dojo.forEach(cboxes, function (cbox) {
        var legendBody = dojo.byId("legendBody");

        legendBody.innerHTML = "";

        if (cbox.checked) {
            var id = "span" + cbox.id;
            var urlValue = "./WebHandlers/proxy.ashx?" + cbox.value + "/legend?f=pjson";
            var getImg = dojo.xhrGet({
                url: urlValue,
                handleAs: "json"
            }).then(function (result) {
                html = PassAlongImgURL(result, cbox.value, html);
            }, function (err) {
                dojo.byId("legendBody").innerHTML = err;
            });

            cb.push(dojo.byId(id).innerHTML);
            defList.push(getImg);
        }
    });

    if (cb.length === 0) {
        dojo.byId("legendBody").innerHTML = "No layers have been checked";
    }
    else {
        var dl = new dojo.DeferredList(defList).then(function (results) {
            html += "</table>";
            dojo.byId("legendBody").innerHTML = html;
        }, function (err) {
            dojo.byId("legendBody").innerHTML += err + "</table>";
        });
    }
}

function PassAlongImgURL(r, u, h) {
    var html = h;

    try {
        dojo.forEach(r.layers, function (result) {
            html += "<tr><td colspan='2'><h3>" + result.layerName + "</h3></td></tr>";

            dojo.forEach(result.legend, function (legend) {
                var legImg = u + "/" + result.layerId + "/images/" + legend.url;

                if (legend.label === "") {
                    html += "<tr><td>&nbsp;</td>";
                }
                else {
                    html += "<tr><td>" + legend.label + "</td>";
                }

                html += "<td class='right'><img src='" + legImg + "' /></td></tr>";
            });
        });
    } catch (e) {
        html += e;
    }

    return html;
}