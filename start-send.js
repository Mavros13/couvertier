(function () {
  var form = document.getElementById("consult");
  if (!form) return;
  var ENDPOINT = "/.netlify/functions/lead";
  var SOURCE = "Website floater";
  var CONSENT_VERSION = "floater-v1-2026-11-08";
  var err = document.getElementById("form-err");
  var held = document.getElementById("held");
  var submitted = false;
  var submitting = false;
  var lastSent = "";
  var timer = null;

  function sessionId() {
    var key = "cpa_floater_session";
    var id = "";
    try { id = sessionStorage.getItem(key) || ""; } catch (e) { id = ""; }
    if (!/^[A-Za-z0-9-]{8,80}$/.test(id)) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("floater-" + Date.now().toString(36));
      try { sessionStorage.setItem(key, id); } catch (e) {}
    }
    return id;
  }

  function digits(v) {
    var d = String(v || "").replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    return d;
  }

  function splitName(full) {
    var parts = String(full || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { first: "", last: "" };
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts[0], last: parts.slice(1).join(" ") };
  }

  function collect(status) {
    var names = splitName(form.full.value);
    var consent = !!(form.consent && form.consent.checked);
    return {
      session_id: sessionId(),
      status: status,
      source: SOURCE,
      submitted_at: new Date().toISOString(),
      page: location.href,
      lang: document.documentElement.lang || "en",
      first_name: names.first,
      last_name: names.last,
      phone: digits(form.phone.value),
      zip: "",
      email: (form.email.value || "").trim(),
      contact_pref: "asap",
      slot_day: "",
      slot_time: "",
      income_range: "",
      consent_contact: status === "submitted" ? consent : false,
      consent_text_version: CONSENT_VERSION,
      estimator: null,
      honeypot: (form.company_site && form.company_site.value) || ""
    };
  }

  function showError(message) {
    err.hidden = false;
    err.textContent = message;
  }

  function post(data) {
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok || body.ok === false) {
          throw new Error((body && body.error) || "We could not send your request. Please call us at (954) 892-0550.");
        }
        return body;
      });
    });
  }

  function sendAbandoned(useBeacon) {
    if (submitted || submitting) return;
    var data = collect("abandoned");
    if (!(data.first_name && data.last_name && data.phone.length === 10)) return;
    var sig = [data.first_name, data.last_name, data.phone, data.email].join("|");
    if (sig === lastSent) return;
    lastSent = sig;
    var body = JSON.stringify(data);
    if (useBeacon && navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }))) return;
      } catch (e) {}
    }
    post(data).catch(function () {
      if (lastSent === sig) lastSent = "";
    });
  }

  function queueAbandoned() {
    if (submitted || submitting) return;
    clearTimeout(timer);
    timer = setTimeout(function () { sendAbandoned(false); }, 450);
  }

  form.addEventListener("input", queueAbandoned);
  form.addEventListener("change", queueAbandoned);
  window.addEventListener("pagehide", function () { sendAbandoned(true); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    err.hidden = true;
    var data = collect("submitted");
    if (data.honeypot) return;
    if (!data.first_name || !data.last_name) {
      showError("Enter a first and last name.");
      form.full.focus();
      return;
    }
    if (data.phone.length !== 10) {
      showError("Enter a 10-digit phone number.");
      form.phone.focus();
      return;
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showError("Enter a valid email, or leave it blank.");
      form.email.focus();
      return;
    }
    if (!form.consent.checked) {
      showError("Consent is required to send the request.");
      form.consent.focus();
      return;
    }
    submitting = true;
    clearTimeout(timer);
    var button = form.querySelector("button[type=submit]");
    button.disabled = true;
    post(data).then(function () {
      submitted = true;
      form.hidden = true;
      held.hidden = false;
    }).catch(function (error) {
      submitting = false;
      button.disabled = false;
      var message = (error && error.message) || "";
      if (!message || message === "Failed to fetch") {
        message = "We could not send your request. Please call us at (954) 892-0550.";
      }
      showError(message);
    });
  });
})();
