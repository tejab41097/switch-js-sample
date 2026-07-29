// Location-related PhonePe bridge functions, ported from index.html.
// Only the location bridge is in scope for this phase.
// The SDK is dynamically imported (async/await) inside each function that
// needs it, and used directly from that import.
//
// NOTE: the native Android/iOS host resolves pending bridge calls by
// injecting a raw script that references the bare global `PhonePe`
// (e.g. `PhonePe.MessagingHandler.callback(...)`), not via any module
// import. Since `PhonePe` inside the SDK's ES module is module-scoped, it
// never becomes a page global on its own, so we still assign it to
// `window.PhonePe` once it's loaded - otherwise native callbacks fail with
// "ReferenceError: Can't find variable: PhonePe".

// --- Option A: shared loader (window.PhonePe assigned once across all bridge files) ---
import { loadPhonePe } from './phonepeSdk';

// --- Option B: local loader (self-contained, no shared module needed) ---
// async function loadPhonePe() {
//   const { default: PhonePe } = await import('@phonepe-limited-official/phonepe-js-sdk');
//   window.PhonePe = PhonePe;
//   return PhonePe;
// }

export function isAndroidDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/android/i.test(userAgent)) {
    return true;
  }
  return false;
}

export async function seekLocationPermission() {
  const PhonePe = await loadPhonePe();
  let env = PhonePe.Constants.Species.web;
  let location = PhonePe.Constants.Permission.LOCATION;

  try {
    const sdk = await PhonePe.PhonePe.build(env);

    // Verify method support
    if (!sdk.isMethodSupported('seekPermission')) {
      console.log('seekPermission not supported. Fallback to browser permissions.');
      return false;
    }

    try {
      const data = await sdk.seekPermission([location]);
      console.log('Received response from seekPermission: ' + JSON.stringify(data));
      let permissionData = data[0];
      return permissionData.permissionGranted;
    } catch (err) {
      console.log('Failed to fetch permission with error = ', err);
      return false;
    }
  } catch (err) {
    console.log('Failed to build SDK = ', err);
    return false;
  }
}

export async function registerLocationUpdateSuccessCallback() {
  const PhonePe = await loadPhonePe();
  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);
    sdk.registerLocationUpdateSuccessCallback('callbackName', (response) => {
      console.log('Location success response = ' + JSON.stringify(response));
    });
  } catch (err) {
    console.log('Error caught when initializing PhonePe = ' + err);
  }
}

export async function registerLocationUpdateFailureCallback() {
  const PhonePe = await loadPhonePe();
  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);
    sdk.registerLocationUpdateFailureCallback('callbackName', (response) => {
      console.log('Location failure response = ' + JSON.stringify(response));
    });
  } catch (err) {
    console.log('Error caught when initializing PhonePe = ' + err);
  }
}

export async function startUpdatingLocation() {
  const PhonePe = await loadPhonePe();
  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);
    let res = sdk.isMethodSupported('startUpdatingLocation');
    console.log('startUpdatingLocation method supported = ' + res);
    sdk.startUpdatingLocation();
    await registerLocationUpdateSuccessCallback();
    await registerLocationUpdateFailureCallback();
  } catch (err) {
    console.log('Error caught when initializing PhonePe = ' + err);
  }
}

export async function stopUpdatingLocation() {
  const PhonePe = await loadPhonePe();
  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);
    let res = sdk.isMethodSupported('stopUpdatingLocation');
    console.log('stopUpdatingLocation method supported = ' + res);
    sdk.stopUpdatingLocation();
    sdk.closeApp();
  } catch (err) {
    console.log('Error caught when initializing PhonePe = ' + err);
  }
}

export async function getCurrentLocation() {
  console.log('Trying to get current location');
  const PhonePe = await loadPhonePe();

  // 1. Wait for permission check
  let hasPermission = await seekLocationPermission();

  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);

    // 2. Handle Denied Permission Flow
    if (!hasPermission) {
      console.log('Location permission denied or not granted yet.');

      if (isAndroidDevice()) {
        // Android: Open settings page
        if (sdk.isMethodSupported('openSettingsPageForPermission')) {
          await sdk.openSettingsPageForPermission();
          console.log('Opened native settings page for Android.');
        }
      } else {
        // iOS: Call getCurrentLocation directly to force Settings redirect
        console.log('iOS detected. Forcing Settings redirect via getCurrentLocation.');
        try {
          await sdk.getCurrentLocation();
        } catch (err) {
          if (err && err.error_code === 'LOCATION_FETCH_FAILURE') {
            alert('Location permission required. If you just enabled it in Settings, please click fetch again.');
          }
        }
      }
      return; // Exit here, don't try to fetch actual location
    }

    // 3. Handle Granted Permission Flow
    if (!sdk.isMethodSupported('getCurrentLocation')) {
      console.log('getCurrentLocation method supported = false');
      return;
    }

    try {
      const location = await sdk.getCurrentLocation();
      console.log('location received on js side = ', location);
      alert('Location: ' + JSON.stringify(location, null, 2));
    } catch (err) {
      console.log('Error found when fetching location = ', err);
      if (err && err.error_code === 'LOCATION_FETCH_FAILURE') {
        alert('Location fetch failed. Try again.');
      } else {
        alert('Error found when fetching location: ' + JSON.stringify(err));
      }
    }
  } catch (err) {
    console.log('Error caught when initializing PhonePe = ', err);
  }
}
