/* Shared by the home page and /deals. Runs in the head so the theme is set before the first paint. */
(function () {
  "use strict";
  var sale = window.JASCO_SALE, root = document.documentElement;
  var live = !!sale && Date.now() < Date.parse(sale.ends);
  if (live) {
    root.classList.add("sale", "theme-" + sale.theme);
    // A page left open past the end goes back to normal.
    setInterval(function () { if (Date.now() >= Date.parse(sale.ends)) location.reload(); }, 20000);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function row(item) {
    var li = el("li", "deal"), what = el("span", "deal-what"), cost = el("span", "deal-cost"), line = el("span", "deal-line");
    what.appendChild(el("span", "deal-name", item.name));
    if (item.size) { what.append(" "); what.appendChild(el("span", "deal-size", item.size)); }
    if (item.qty) { line.appendChild(el("span", "deal-qty", item.qty + " for")); line.append(" "); }
    line.appendChild(el("b", "deal-price", "$" + item.price));
    cost.appendChild(line);
    if (item.tax) { cost.append(" "); cost.appendChild(el("span", "deal-tax", "No tax")); }
    li.append(what, " ", cost);
    return li;
  }

  /* The same deal on /deals: bottle picture, name, big price. */
  function card(item) {
    var li = el("li", "card"), text = el("div", "card-text"), cost = el("p", "card-cost"), price = el("b", "card-price"), p = item.price.split(".");
    if (item.pic) {
      var img = el("img", "card-pic");
      img.src = "/images/deals/" + item.pic + ".webp";
      img.alt = "";
      li.appendChild(img);
    }
    text.appendChild(el("h3", "card-name", item.name));
    if (item.size) text.appendChild(el("p", "card-size", item.size));
    if (item.qty) { cost.appendChild(el("span", "card-qty", item.qty + " for")); cost.append(" "); }
    price.append(el("small", "", "$"), p[0], el("small", "", "." + (p[1] || "00")));
    cost.appendChild(price);
    if (item.tax) { cost.append(" "); cost.appendChild(el("span", "card-tax", "No tax")); }
    text.appendChild(cost);
    li.appendChild(text);
    return li;
  }

  /* A turkey's tail: three rows of feathers fanned about the foot of the bottle.
     --open (0 to 1) folds and unfolds it. */
  var FEATHER = "M0 0C-3 -28 -13.5 -58 -13 -80C-12.6 -93 -6 -100 0 -100C6 -100 12.6 -93 13 -80C13.5 -58 3 -28 0 0Z";
  var TIP = "M-12.6 -86C-10.5 -95.5 -5 -100 0 -100C5 -100 10.5 -95.5 12.6 -86C6 -91 -6 -91 -12.6 -86Z";
  function tail(svg) {
    var NS = "http://www.w3.org/2000/svg";
    svg.setAttribute("viewBox", "-104 -104 208 108");
    // Feathers, half spread in degrees, length, class.
    [[13, 84, 1, "out"], [12, 77, .8, "mid"], [11, 70, .58, "in"]].forEach(function (r) {
      for (var i = 0; i < r[0]; i++) {
        var g = document.createElementNS(NS, "g");
        g.setAttribute("class", "feather " + r[3]);
        g.style.setProperty("--a", (-r[1] + 2 * r[1] * i / (r[0] - 1)).toFixed(2) + "deg");
        g.style.setProperty("--k", r[2]);
        [FEATHER, TIP].forEach(function (d, t) {
          var p = document.createElementNS(NS, "path");
          p.setAttribute("d", d);
          p.setAttribute("class", t ? "tip" : "vane");
          g.appendChild(p);
        });
        svg.appendChild(g);
      }
    });
  }
  window.JascoSale = { live: live, sale: sale, row: row, card: card, tail: tail, el: el };
})();
