// Fetch signals only after an explicit button click; never log or persist the payload.
(function () {
  "use strict";
  function bounded(promise, phase) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error(phase + " timed out after 15000 ms"));
      }, 15000);
      Promise.resolve(promise).then(function (value) {
        clearTimeout(timer);
        resolve(value);
      }, function (error) {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  window.getSignals = async function () {
    var output = document.getElementById("signals-output");
    var reveal = document.getElementById("reveal-signals");
    if (output) output.textContent = "Checking getSignals support...";
    try {
      if (typeof window.PhonePe?.PhonePe?.prototype?.getSignals !== "function") {
        throw new Error("Loaded SDK does not expose getSignals. Load the new SDK bundle.");
      }
      if (typeof window.SwitchSignalsBridge?.getSignals !== "function") {
        throw new Error("Native SwitchSignalsBridge is unavailable. Install/configure the new native bridge first.");
      }
      var sdk = await bounded(PhonePe.PhonePe.build("web", "android"), "SDK initialization");
      if (!sdk.isMethodSupported("getSignals")) throw new Error("getSignals is unsupported.");
      var signals = await bounded(sdk.getSignals(), "getSignals");
      if (!signals || Array.isArray(signals) || typeof signals !== "object") {
        throw new Error("Expected a JSON object.");
      }
      // Only display user-specific values when the tester explicitly opts in.
      // Do not write them to console, analytics, or persistent storage.
      if (output) output.textContent = reveal && reveal.checked
        ? JSON.stringify(signals, null, 2)
        : "PASS: getSignals returned an object. Keys: " +
          Object.keys(signals).join(", ") + ". Values hidden; select 'Show values' to inspect on the next run.";
      // Return diagnostics rather than signal values so a console invocation
      // does not automatically print personal information.
      return { passed: true, keys: Object.keys(signals) };
    } catch (error) {
      // Do not include native payloads or user signal values in error logging.
      var code = error === "SIGNALS_NOT_AVAILABLE"
        ? "SIGNALS_NOT_AVAILABLE"
        : (error?.code || "TEST_FAILED");
      if (output) output.textContent = code + ": " +
        (typeof error === "string" ? code : String(error?.message || error));
      throw typeof error === "string" ? new Error(code) : error;
    }
  };

  window.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("get-signals");
    if (button) button.addEventListener("click", async function () {
      button.disabled = true;
      try { await window.getSignals(); }
      catch (_) { /* Error already displayed. */ }
      finally { button.disabled = false; }
    });
  });
})();
