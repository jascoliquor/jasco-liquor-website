/* Open or closed. Store time is always Jackson time, wherever the visitor is. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var OPEN = 10 * 60, CLOSE = 22 * 60;
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function jackson(date) {
    var p = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23"
    }).formatToParts(date).forEach(function (x) { p[x.type] = Number(x.value); });
    return { day: new Date(Date.UTC(p.year, p.month - 1, p.day)), minute: p.hour * 60 + p.minute };
  }
  function christmas(day) { return day.getUTCMonth() === 11 && day.getUTCDate() === 25; }
  function closedOn(day) { return day.getUTCDay() === 0 || christmas(day); }
  function storeStatus(date) {
    var now = jackson(date), closed = closedOn(now.day);
    if (!closed && now.minute >= OPEN && now.minute < CLOSE) {
      var left = CLOSE - now.minute;
      return { now: now, closed: closed, open: true, text: left <= 60 ? "Open, closes in " + left + " min" : "Open until 10 PM" };
    }
    if (!closed && now.minute < OPEN) return { now: now, closed: closed, open: false, text: "Opens today at 10 AM" };
    for (var i = 1; i < 8; i++) {
      var d = new Date(now.day.getTime() + i * 864e5);
      if (!closedOn(d)) return { now: now, closed: closed, open: false, text: "Opens " + (i === 1 ? "tomorrow" : DAYS[d.getUTCDay()]) + " at 10 AM" };
    }
  }
  function showStatus() {
    var s = storeStatus(new Date());
    $$("[data-status]").forEach(function (el) {
      if (el.textContent !== s.text) el.textContent = s.text;
      el.classList.toggle("is-open", s.open);
    });
    var day = $("#day");
    if (!day) return;
    day.hidden = s.closed;
    day.style.setProperty("--now", (s.now.minute / 14.4).toFixed(2) + "%");
    $$(".hours > div").forEach(function (row) {
      var today = christmas(s.now.day) ? "christmas" in row.dataset
        : (row.dataset.days || "").split(" ").indexOf(String(s.now.day.getUTCDay())) >= 0;
      row.classList.toggle("is-today", today);
      if (today) row.setAttribute("aria-current", "date"); else row.removeAttribute("aria-current");
    });
  }
  showStatus();
  setInterval(showStatus, 20000);
})();
