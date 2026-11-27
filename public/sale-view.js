/* Shared by the home page and /deals. Runs in the head so the theme is set before the first paint. */
(function () {
  "use strict";
  var sale = window.JASCO_SALE, root = document.documentElement;
  var live = !!sale && Date.now() < Date.parse(sale.ends);
  if (live) {
    root.classList.add("sale");
    if (sale.theme) root.classList.add("theme-" + sale.theme);
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
    if (item.tax) { cost.append(" "); cost.appendChild(el("span", "deal-tax", "Tax included")); }
    li.append(what, " ", cost);
    return li;
  }

  /* The same deal on /deals, as a flyer cell: big price, name, size, yellow tab, bottle picture. */
  function card(item) {
    var li = el("li", "card"), text = el("div", "card-text"), cost = el("p", "card-cost"), price = el("b", "card-price"), cents = el("small"), p = item.price.split(".");
    if (item.pic) {
      var img = el("img", "card-pic");
      img.src = "/images/deals/" + item.pic + ".webp";
      img.alt = "";
      li.appendChild(img);
    }
    if (item.qty) { cost.appendChild(el("span", "card-qty", item.qty + " for")); cost.append(" "); }
    cents.append(el("span", "sr", "."), p[1] || "00");
    price.append(el("small", "", "$"), p[0], cents);
    cost.appendChild(price);
    text.appendChild(cost);
    text.appendChild(el("h3", "card-name", item.name));
    if (item.size) text.appendChild(el("p", "card-size", item.size));
    if (item.tax) text.appendChild(el("p", "card-tax", "Tax included"));
    li.appendChild(text);
    return li;
  }

  window.JascoSale = { live: live, sale: sale, row: row, card: card, el: el };
})();
