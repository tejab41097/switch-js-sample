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
      // Display the response for this explicit request without logging or persisting it.
      if (output) output.textContent = JSON.stringify(signals, null, 2);
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

// Fetch app information only after an explicit request, matching the Signals UI.
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

  window.getAppInfo = async function () {
    var output = document.getElementById("app-info-output");
    if (output) output.textContent = "Checking getAppInfo support...";
    try {
      if (typeof window.PhonePe?.PhonePe?.prototype?.getAppInfo !== "function") {
        throw new Error("Loaded SDK does not expose getAppInfo. Load the new SDK bundle.");
      }
      if (typeof window.JsHandler?.getAppInfo !== "function") {
        var unavailable = new Error("Native JsHandler.getAppInfo is unavailable. Open this page inside a supported PhonePe app or add the bridge to the simulator.");
        unavailable.code = "APP_INFO_NOT_AVAILABLE";
        throw unavailable;
      }
      var sdk = await bounded(PhonePe.PhonePe.build(PhonePe.Constants.Species.web), "SDK initialization");
      if (!sdk.isMethodSupported("getAppInfo")) {
        throw new Error("getAppInfo is not supported in this environment.");
      }
      var appInfo = await sdk.getAppInfo();
      if (output) output.textContent = JSON.stringify(appInfo, null, 2);
      return { passed: true, keys: Object.keys(appInfo) };
    } catch (error) {
      var message = typeof error === "string" ? error : String(error?.message || error);
      var code = typeof error === "string" ? error : (error?.code || "TEST_FAILED");
      if (output) output.textContent = code + ": " + message;
      throw typeof error === "string" ? new Error(message) : error;
    }
  };

  function bindAppInfoButton() {
    var button = document.getElementById("get-app-info");
    if (button) button.addEventListener("click", async function () {
      button.disabled = true;
      try { await window.getAppInfo(); }
      catch (_) { /* Error already displayed. */ }
      finally { button.disabled = false; }
    });
  }
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", bindAppInfoButton);
  } else {
    bindAppInfoButton();
  }
})();
