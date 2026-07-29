// Shared PhonePe SDK loader — imports and assigns window.PhonePe exactly
// once per page load. The cached promise is shared across all importers
// since ES modules are singletons.
let sdkPromise = null;

export function loadPhonePe() {
  if (!sdkPromise) {
    sdkPromise = import('@phonepe-limited-official/phonepe-js-sdk').then(
      ({ default: PhonePe }) => {
        window.PhonePe = PhonePe;
        return PhonePe;
      }
    );
  }
  return sdkPromise;
}
