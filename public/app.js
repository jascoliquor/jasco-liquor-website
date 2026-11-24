(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var calm = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Sale. While one is running, its prices sit beside the matching bottle. ---- */
  var deals = window.JascoSale, tail = null;
  var bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  if (deals.live) {
    $("meta[name=theme-color]").content = bg;
    $("#sale-name").textContent = deals.sale.name;
    $("#sale-short").textContent = deals.sale.short + " " + deals.sale.hours;
    $("#shelves-title").textContent = "Sale prices, before tax unless marked";
    tail = $("#tail");
    deals.tail(tail);
    $$(".kind").forEach(function (li) {
      var ul = deals.el("ul", "picks");
      deals.sale.groups.forEach(function (g) {
        g.items.forEach(function (item) { if (item.shelf === li.dataset.shelf) ul.appendChild(deals.row(item)); });
      });
      if (!ul.children.length) return;
      li.classList.add("has-picks");
      li.appendChild(ul);
    });
  }

  /* ---- Copy address ---- */
  var copy = $("#copy");
  if (navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener("click", function () {
      navigator.clipboard.writeText("2014 Terry Rd, Jackson, MS 39204").then(function () {
        copy.textContent = "Address copied";
        $("#say").textContent = "Address copied";
      }, function () {
        copy.textContent = "Couldn’t copy";
        $("#say").textContent = "Couldn’t copy the address";
      }).then(function () {
        setTimeout(function () { copy.textContent = "Copy address"; $("#say").textContent = ""; }, 2200);
      });
    });
  }

  /* ---- Scroll ---- */
  var bar = $("#bar"), dock = $("#dock"), hero = $("#top"), scene = $("#scene"), visit = $("#visit"), panel = $(".panel");
  var heroActions = $("#hero-actions"), kinds = $$(".kind"), index = $$(".index a");
  var canvas = $("#stage"), stage = null;
  try { stage = window.JascoStage(canvas, bg); } catch (e) { console.error(e); }
  if (stage) root.classList.add("gl");
  // Phones drop the WebGL context in the background. Draw again when it comes back.
  canvas.addEventListener("webglcontextrestored", function () { measure(); });

  var lineup = $("#shelves"), goal = -1, goalTimer = 0;
  var step = 1, target = 0, f = 0, active = -1, queued = false, raf = 0, prev = 0;
  var mouse = 0, lean = 0, slosh = 0, sloshV = 0, show = calm.matches ? 1 : 0;

  // Holds on each bottle for most of a step, then moves to the next.
  function sceneAt(s) {
    var t = s - .35, i = Math.floor(t), k = Math.min(1, Math.max(0, (t - i) / .62));
    return Math.max(0, Math.min(5, i + k * k * (3 - 2 * k)));
  }

  function showKind(i) {
    if (i === active) return;
    active = i;
    kinds.forEach(function (el, k) {
      el.classList.toggle("is-on", k === i);
      el.classList.toggle("is-past", k < i);
    });
    index.forEach(function (a, k) {
      if (k === i) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    var strip = index[0].parentNode;
    if (strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: index[i].offsetLeft - strip.offsetLeft - 20, behavior: calm.matches ? "auto" : "smooth" });
    }
  }

  function pageTop(el) { return el.getBoundingClientRect().top + scrollY; }

  /* Links within the page. The browser's own jump ignores a second click while the
     first is still scrolling, so scroll here. A clicked bottle shows straight away. */
  function letGo() {
    clearTimeout(goalTimer);
    if (goal < 0) return;
    goal = -1;
    queue();
  }
  function holdGoal(ms) { clearTimeout(goalTimer); goalTimer = setTimeout(letGo, ms); }
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]:not(.skip)');
    if (!link || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var hash = link.getAttribute("href"), el = $(hash);
    if (!el) return;
    e.preventDefault();
    clearTimeout(goalTimer);
    goal = stage ? index.indexOf(link) : -1;
    var top = pageTop(el) - bar.offsetHeight;
    if (goal >= 0) top = pageTop(lineup) + goal * step;
    else if (el === lineup && stage) top = pageTop(lineup);
    else if (el === hero) top = 0;
    if (goal >= 0) holdGoal(600);
    if (location.hash !== hash) history.pushState(null, "", hash);
    scrollTo({ top: Math.max(0, Math.round(top)), behavior: calm.matches ? "instant" : "smooth" });
    if (goal < 0) {
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
    }
    queue();
  });
  ["wheel", "touchmove", "keydown"].forEach(function (type) { addEventListener(type, letGo, { passive: true }); });

  function onScroll() {
    queued = false;
    target = goal < 0 ? sceneAt((scrollY - pageTop(lineup)) / step) : goal;
    if (calm.matches) target = Math.round(target);
    // The tail folds up behind the bottle on the way to the shelves.
    if (tail) {
      var open = Math.max(0, 1 - Math.max(0, scrollY) / (innerHeight * .7));
      tail.style.setProperty("--open", open.toFixed(3));
      tail.style.opacity = Math.min(1, open * 5).toFixed(2);
    }
    bar.classList.toggle("is-scrolled", scrollY > 8);
    showKind(Math.round(target));
    var up = heroActions.getBoundingClientRect().bottom < 0 && visit.getBoundingClientRect().top > innerHeight * .6;
    dock.classList.toggle("is-up", up);
    dock.inert = !up;
    wake();
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }

  function measure() {
    step = panel.offsetHeight * .8 || 1;
    if (stage) stage.resize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio || 1);
    onScroll();
  }

  /* Frames are drawn only while something is moving and the bottle is in view. */
  function wake() {
    if (!stage || raf || scene.getBoundingClientRect().bottom < 0) return;
    prev = 0;
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    var real = prev ? now - prev : 16, dt = Math.min(.05, real / 1000), before = f;
    raf = 0; prev = now;
    f += (target - f) * (calm.matches ? 1 : 1 - Math.exp(-dt * 7));
    if (Math.abs(target - f) < .0004) f = target;
    show = Math.min(1, show + Math.min(.12, real / 1000) / .7);
    lean += (mouse - lean) * (1 - Math.exp(-dt * 3));

    // The bottle barely tips; the liquid is a spring that lags behind it.
    var speed = Math.max(-2.5, Math.min(2.5, (f - before) / dt)), roll = 0;
    if (!calm.matches) {
      roll = -lean * .018 - speed * .012;
      sloshV += (-slosh * 60 - sloshV * 5 + speed * 2.6 + (mouse - lean) * 1.1) * dt;
      slosh = Math.max(-.22, Math.min(.22, slosh + sloshV * dt));
    }
    stage.draw({ f: f, roll: roll, slosh: slosh, show: show });

    var moving = f !== target || f !== before || show < 1 || Math.abs(slosh) > .0006 || Math.abs(sloshV) > .003 || Math.abs(mouse - lean) > .003;
    if (moving && root.classList.contains("gl")) raf = requestAnimationFrame(frame);
  }

  addEventListener("scroll", function () { if (goal >= 0) holdGoal(200); queue(); }, { passive: true });
  addEventListener("resize", measure);
  if (!calm.matches) {
    addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mouse = e.clientX / innerWidth * 2 - 1;
      wake();
    }, { passive: true });
  }
  measure();
  f = target;
})();
