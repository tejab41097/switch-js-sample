// Auth-related PhonePe bridge functions, ported from index.html.
// Covers: fetchAuthToken, fetchAuthTokenIfConsentRecorded, isConsentGranted.
//
// `window.PhonePe` is assigned after load so native Android/iOS callbacks
// that reference the bare global `PhonePe` continue to work.

// --- Option A: shared loader (window.PhonePe assigned once across all bridge files) ---
import { loadPhonePe } from './phonepeSdk';

// --- Option B: local loader (self-contained, no shared module needed) ---
// async function loadPhonePe() {
//   const { default: PhonePe } = await import('@phonepe-limited-official/phonepe-js-sdk');
//   window.PhonePe = PhonePe;
//   return PhonePe;
// }

export async function fetchAuthToken() {
  const PhonePe = await loadPhonePe();
  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);
    const res = sdk.isMethodSupported('fetchAuthToken');
    console.log('fetchAuthToken method supported = ' + res);
    try {
      const res2 = await sdk.fetchAuthToken();
      console.log('fetchAuthToken result = ' + JSON.stringify(res2));
      return JSON.stringify(res2);
    } catch (err) {
      console.log('fetchAuthToken error = ' + err);
      return String(err);
    }
  } catch (err) {
    console.log('Failed to build SDK = ' + err);
    return String(err);
  }
}

export async function fetchAuthTokenIfConsentRecorded() {
  const PhonePe = await loadPhonePe();
  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);
    const res = sdk.isMethodSupported('fetchAuthTokenIfConsentRecorded');
    console.log('fetchAuthTokenIfConsentRecorded method supported = ' + res);
    if (!res) {
      console.log('fetchAuthTokenIfConsentRecorded not supported, falling back to fetchAuthToken');
      return await fetchAuthToken();
    }
    const consentMessage = 'Implicit Consent Message';
    try {
      const res2 = await sdk.fetchAuthTokenIfConsentRecorded(consentMessage);
      console.log('fetchAuthTokenIfConsentRecorded result = ' + JSON.stringify(res2));
      return JSON.stringify(res2);
    } catch (err) {
      console.log('fetchAuthTokenIfConsentRecorded error = ' + err + ', falling back to fetchAuthToken');
      return await fetchAuthToken();
    }
  } catch (err) {
    console.log('Failed to build SDK = ' + err);
    return String(err);
  }
}

export async function isConsentGranted() {
  const PhonePe = await loadPhonePe();
  try {
    const sdk = await PhonePe.PhonePe.build(PhonePe.Constants.Species.web);
    const supported = sdk.isMethodSupported('isConsentGranted');
    console.log('isConsentGranted method supported = ' + supported);
    if (!supported) {
      console.log('isConsentGranted not supported, falling back to fetchAuthToken');
      return await fetchAuthToken();
    }
    try {
      const res2 = await sdk.isConsentGranted();
      console.log('isConsentGranted result = ' + JSON.stringify(res2));
      return JSON.stringify(res2);
    } catch (err) {
      console.log('isConsentGranted error = ' + err + ', falling back to fetchAuthToken');
      return await fetchAuthToken();
    }
  } catch (err) {
    console.log('Failed to build SDK = ' + err);
    return String(err);
  }
}
