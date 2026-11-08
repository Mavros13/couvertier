(function () {
  var script = document.currentScript;
  var base = (script && script.getAttribute("data-base")) || "";
  var autoUsed = false;
  var root = document.createElement("div");
  root.innerHTML =
    '<button type="button" class="cpa-float" data-cpa-open>' +
      '<span class="cpa-float-kicker">Free consultation</span>' +
      '<span class="cpa-float-title">A quiet place to start</span>' +
      '<span class="cpa-float-note">Under 65. No obligation.</span>' +
    '</button>' +
    '<div class="cpa-modal" id="cpa-modal" hidden>' +
      '<div class="cpa-modal-backdrop" data-cpa-close></div>' +
      '<div class="cpa-modal-panel" role="dialog" aria-modal="true" aria-labelledby="cpa-q-title">' +
        '<button type="button" class="cpa-close" data-cpa-close aria-label="Close">×</button>' +
        '<p class="cpa-invite">Free consultation</p>' +
        '<div data-cpa-step="who">' +
          '<h2 class="cpa-q" id="cpa-q-who" tabindex="-1">Is this for yourself?</h2>' +
          '<p class="cpa-quiet">A consultation request. Not a bindable quote, and not a price.</p>' +
          '<div class="cpa-grid">' +
            '<button type="button" class="cpa-choice" data-cpa-kind="family">Family coverage</button>' +
            '<button type="button" class="cpa-choice" data-cpa-kind="individual">Individual coverage</button>' +
            '<button type="button" class="cpa-choice" data-cpa-kind="business">Small Business</button>' +
            '<button type="button" class="cpa-choice" data-cpa-kind="medicare">Someone Over 65+</button>' +
          '</div>' +
        '</div>' +
        '<div data-cpa-step="why" hidden>' +
          '<h2 class="cpa-q" id="cpa-q-why" tabindex="-1">What has you shopping around?</h2>' +
          '<div class="cpa-stack">' +
            '<button type="button" class="cpa-choice" data-cpa-why="lost">Did you lose your coverage?</button>' +
            '<button type="button" class="cpa-choice" data-cpa-why="rates">Were your rates increasing?</button>' +
            '<button type="button" class="cpa-choice" data-cpa-why="none">Haven\'t had any?</button>' +
          '</div>' +
          '<button type="button" class="cpa-back" data-cpa-back>Back</button>' +
        '</div>' +
        '<div data-cpa-step="medicare" hidden>' +
          '<h2 class="cpa-q" id="cpa-q-med" tabindex="-1">Medicare is a separate conversation</h2>' +
          '<p class="cpa-quiet">This consultation is for coverage under 65. A licensed agent can explain Medicare separately. This screen does not ask for a name, phone, email, or ZIP, and it does not describe a plan, a price, or whether someone qualifies.</p>' +
          '<button type="button" class="cpa-done" data-cpa-close>Close</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  var modal = document.getElementById("cpa-modal");
  var steps = {};
  root.querySelectorAll("[data-cpa-step]").forEach(function (node) {
    steps[node.getAttribute("data-cpa-step")] = node;
  });
  var title = document.getElementById("cpa-q-title");

  function show(name) {
    Object.keys(steps).forEach(function (key) { steps[key].hidden = key !== name; });
    var heading = steps[name].querySelector(".cpa-q");
    if (heading) {
      modal.querySelector("[role='dialog']").setAttribute("aria-labelledby", heading.id);
      heading.focus();
    }
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var closing = false;

  function placeOrigin(panel) {
    var floatEl = root.querySelector(".cpa-float");
    var pr = panel.getBoundingClientRect();
    var fr = floatEl.getBoundingClientRect();
    var scale = fr.width / Math.max(pr.width, 1);
    scale = Math.max(0.22, Math.min(scale, 0.7));
    panel.style.setProperty("--cpa-s", scale.toFixed(4));
    panel.style.setProperty("--cpa-ox", ((fr.left + fr.width / 2) - pr.left).toFixed(1) + "px");
    panel.style.setProperty("--cpa-oy", ((fr.top + fr.height / 2) - pr.top).toFixed(1) + "px");
  }

  function openModal(fromAuto) {
    if (fromAuto && autoUsed) return;
    if (modal.classList.contains("is-open") && !closing) return;
    if (fromAuto) autoUsed = true;
    closing = false;
    show("who");
    var panel = modal.querySelector(".cpa-modal-panel");
    modal.classList.remove("is-open", "is-closing");
    modal.hidden = false;
    if (reduceMotion) {
      modal.classList.add("is-open");
      return;
    }
    panel.style.transition = "none";
    panel.style.transform = "none";
    placeOrigin(panel);
    panel.style.transform = "";
    void panel.offsetWidth;
    panel.style.transition = "";
    window.requestAnimationFrame(function () {
      if (!closing) modal.classList.add("is-open");
    });
  }

  function closeModal() {
    if (modal.hidden || closing) return;
    autoUsed = true;
    var panel = modal.querySelector(".cpa-modal-panel");
    if (reduceMotion) {
      modal.classList.remove("is-open", "is-closing");
      modal.hidden = true;
      return;
    }
    placeOrigin(panel);
    void panel.offsetWidth;
    closing = true;
    modal.classList.remove("is-open");
    modal.classList.add("is-closing");
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      closing = false;
      modal.classList.remove("is-closing");
      modal.hidden = true;
    }
    function onEnd(event) {
      if (event.target !== panel || event.propertyName !== "transform") return;
      panel.removeEventListener("transitionend", onEnd);
      finish();
    }
    panel.addEventListener("transitionend", onEnd);
    window.setTimeout(finish, 480);
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-cpa-open]")) {
      event.preventDefault();
      autoUsed = true;
      if (modal.hidden || closing) openModal(false);
      else show("who");
      return;
    }
    if (event.target.closest("[data-cpa-close]")) {
      closeModal();
      return;
    }
    var kind = event.target.closest("[data-cpa-kind]");
    if (kind && modal.contains(kind)) {
      if (kind.getAttribute("data-cpa-kind") === "medicare") {
        show("medicare");
        return;
      }
      modal.dataset.kind = kind.getAttribute("data-cpa-kind");
      show("why");
      return;
    }
    var why = event.target.closest("[data-cpa-why]");
    if (why && modal.contains(why)) {
      var page = "start-" + modal.dataset.kind + "-" + why.getAttribute("data-cpa-why") + ".html";
      window.location.href = base + page;
      return;
    }
    if (event.target.closest("[data-cpa-back]")) show("who");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  window.setTimeout(function () { openModal(true); }, 20000);

  document.addEventListener("mouseout", function (event) {
    if (event.clientY > 8) return;
    if (event.relatedTarget || event.toElement) return;
    openModal(true);
  });

  document.querySelectorAll("video.cpa-hero-motion").forEach(function (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    function kick() {
      var pending = video.play();
      if (pending && pending.catch) pending.catch(function () {});
    }
    if (video.readyState >= 2) kick();
    else video.addEventListener("canplay", kick, { once: true });
    kick();
  });
})();
