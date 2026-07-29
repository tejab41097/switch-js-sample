import { useRef, useState } from 'react'
import useConsoleLogger from './useConsoleLogger'
import {
  seekLocationPermission,
  getCurrentLocation,
  startUpdatingLocation,
  stopUpdatingLocation,
} from './locationBridge'
import {
  fetchAuthToken,
  fetchAuthTokenIfConsentRecorded,
  isConsentGranted,
} from './authBridge'
import './App.css'

function App() {
  const loggerRef = useRef(null)
  const [authOutput, setAuthOutput] = useState('')
  useConsoleLogger(loggerRef)

  async function handleFetchAuthToken() {
    const result = await fetchAuthToken()
    setAuthOutput(result)
  }

  async function handleFetchAuthTokenIfConsentRecorded() {
    const result = await fetchAuthTokenIfConsentRecorded()
    setAuthOutput(result)
  }

  async function handleIsConsentGranted() {
    const result = await isConsentGranted()
    setAuthOutput(result)
  }

  return (
    <div className="container">
      <div className="section">
        <h2>Permission Bridges</h2>
        <div className="button-group">
          <button onClick={() => seekLocationPermission()}>Location Permission</button>
          <button onClick={() => getCurrentLocation()}>Get Current Location</button>
          <button onClick={() => startUpdatingLocation()}>Start Location Update</button>
          <button onClick={() => stopUpdatingLocation()}>Stop Location Update</button>
        </div>
      </div>

      <div className="section">
        <h2>Auth Bridge</h2>
        <div className="button-group">
          <button onClick={handleFetchAuthToken}>Fetch Auth Token</button>
          <button onClick={handleFetchAuthTokenIfConsentRecorded}>Fetch Auth Token If Consent Recorded</button>
          <button onClick={handleIsConsentGranted}>Check Consent Status</button>
        </div>
        <h3>Auth Token Output:</h3>
        <pre id="authTokenOutput">{authOutput}</pre>
      </div>

      <pre id="logger" ref={loggerRef}></pre>
    </div>
  )
}

export default App
