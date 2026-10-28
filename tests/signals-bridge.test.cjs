const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')
const root = path.resolve(__dirname, '..')

function setup() {
  const ready = []
  const output = { textContent: '' }
  const button = { disabled: false, addEventListener(event, callback) { this[event] = callback } }
  const appOutput = { textContent: '' }
  const appButton = { disabled: false, addEventListener(event, callback) { this[event] = callback } }
  const elements = { 'signals-output': output, 'get-signals': button,
    'app-info-output': appOutput, 'get-app-info': appButton }
  const sandbox = { setTimeout, clearTimeout, console,
    navigator: { userAgent: 'Android' },
    document: { readyState: 'loading', getElementById: id => elements[id] || null },
    addEventListener(event, callback) { if (event === 'DOMContentLoaded') ready.push(callback) }
  }
  sandbox.window = sandbox
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'lib/bundle.js'), 'utf8'), sandbox)
  vm.runInContext(fs.readFileSync(path.join(root, 'signals.js'), 'utf8'), sandbox)
  sandbox.MetadataBridge = { getSupportedWebSDKVersion(request) {
    const { callbackId } = JSON.parse(request)
    queueMicrotask(() => sandbox.PhonePe.MessagingHandler.callback(callbackId, '1', '1'))
  } }
  ready.forEach(callback => callback())
  return { sandbox, output, button, appOutput, appButton }
}

function respond(sandbox, data, error) {
  let calls = 0
  sandbox.SignalBridge = { getSignals(request) {
    calls++
    const { callbackId } = JSON.parse(request)
    queueMicrotask(() => sandbox.PhonePe.MessagingHandler.callback(callbackId, error ? '0' : '1', data, error))
  } }
  return () => calls
}

test('shipped SDK calls the actual Android SignalBridge and preserves the JSON string', async () => {
  const { sandbox } = setup()
  const raw = ' {"test":"TEST", "offers": [{"value":"keep nested"}]} '
  const calls = respond(sandbox, raw)
  const sdk = await sandbox.PhonePe.PhonePe.build('web', 'android')
  assert.equal(sdk.isMethodSupported('getSignals'), true)
  assert.equal(await sdk.getSignals(), raw)
  assert.equal(calls(), 1)
})

test('button parses the JSON string for display, supports retries, and does not fetch on page load', async () => {
  const { sandbox, output, button } = setup()
  const expected = { tier: 'GOLD', enabled: false, offers: [{ label: 'हिन्दी' }] }
  const calls = respond(sandbox, JSON.stringify(expected))
  assert.equal(calls(), 0)
  const request = button.click()
  assert.equal(button.disabled, true)
  await request
  assert.deepEqual(JSON.parse(output.textContent), expected)
  assert.equal(button.disabled, false)
  await button.click()
  assert.equal(calls(), 2)
})

test('old bridge names do not falsely count as the renamed native bridge', async () => {
  const { sandbox, output, button } = setup()
  sandbox.SwitchSignalsBridge = { getSignals() { throw new Error('must not call old bridge') } }
  sandbox.SignalsBridge = sandbox.SwitchSignalsBridge
  await button.click()
  assert.match(output.textContent, /Native SignalBridge is unavailable/)
  assert.equal(button.disabled, false)
})

test('unavailable native signals are shown without falling back to defaults or network', async () => {
  const { sandbox, output, button } = setup()
  const calls = respond(sandbox, null, 'SIGNALS_NOT_AVAILABLE')
  await button.click()
  assert.equal(output.textContent, 'SIGNALS_NOT_AVAILABLE: SIGNALS_NOT_AVAILABLE')
  assert.equal(calls(), 1)
  assert.equal(button.disabled, false)
})

test('invalid JSON and non-object signal responses are handled by the sample', async () => {
  for (const raw of ['{broken', 'null', '[]', '1', '"text"']) {
    const { sandbox, output, button } = setup()
    respond(sandbox, raw)
    await button.click()
    assert.match(output.textContent, /^TEST_FAILED:/)
    assert.equal(button.disabled, false)
  }
})

test('app-info button still works with the regenerated SDK bundle', async () => {
  const { sandbox, appOutput, appButton } = setup()
  const expected = { app_version: 30010100, language: 'en', platform: 'Android' }
  sandbox.JsHandler = { getAppInfo(context, data, callback) {
    assert.equal(data, '{}')
    queueMicrotask(() => sandbox[callback]('null', 'null', context,
      Buffer.from(JSON.stringify({data:expected})).toString('base64')))
  } }
  await appButton.click()
  assert.deepEqual(JSON.parse(appOutput.textContent), expected)
  assert.equal(appButton.disabled, false)
})

test('both deployed script URLs use hashes matching their current contents', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 12)
  assert.ok(html.includes(`src="./lib/bundle.js?v=signals-${hash('lib/bundle.js')}"`))
  assert.ok(html.includes(`src="./signals.js?v=${hash('signals.js')}"`))
})
