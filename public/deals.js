(function () {
  "use strict";
  var S = window.JascoSale, sale = S.sale, $ = function (s) { return document.querySelector(s); };
  if (!S.live) {
    $("#ended").hidden = false;
    return;
  }
  $("meta[name=theme-color]").content = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  document.title = sale.name + " | Jasco Liquor & Wine";
  $("#sale-name").textContent = sale.name;
  $("#sale-until").textContent = sale.until;
  $("#sale-hours").textContent = sale.hours;
  S.tail($("#tail"));
  sale.groups.forEach(function (g) {
    var sec = S.el("section", "group"), ul = S.el("ul");
    sec.appendChild(S.el("h2", "", g.title));
    g.items.forEach(function (item) { ul.appendChild(S.row(item)); });
    sec.appendChild(ul);
    $("#groups").appendChild(sec);
  });
  if (sale.flyer) {
    $("#flyer-link").href = $("#flyer-open").href = $("#flyer-img").src = sale.flyer;
    $("#flyer-img").alt = sale.name + " flyer. Its prices are listed above.";
    $("#flyer").hidden = false;
  }
  $("#live").hidden = false;
})();
