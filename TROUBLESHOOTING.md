# WhatsApp Initialization Timeout Fix

## Problem
The WhatsApp client initialization was hanging indefinitely when users clicked "Run Campaign", showing the "Initializing WhatsApp Client..." loading screen without any error messages or way to recover.

## Root Cause
The `client.initialize()` function from the whatsapp-web.js library had no timeout mechanism. If the Chromium browser process failed to start, hung during WhatsApp Web loading, or encountered connectivity issues, the initialization would wait forever without providing feedback to the user.

## Solutions Applied

### 1. **Added Initialization Timeout (120 seconds)**
- Added `INITIALIZE_TIMEOUT_MS = 120000` constant
- Implemented `withTimeout()` helper function to wrap async operations with a timeout
- If initialization doesn't complete within 120 seconds, a clear error message is shown

**File Modified:** `services/whatsappService.js`

```javascript
const INITIALIZE_TIMEOUT_MS = 120000; // 2 minutes timeout for initialization

function withTimeout(promise, timeoutMs, errorMessage) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
}
```

### 2. **Enhanced Logging for Debugging**
Added detailed console logging to track initialization progress:
- When initialization starts
- When browser executable path is resolved
- Protocol timeout configuration
- Attempt number and step
- QR code generation and event firing
- Success/failure messages with timestamps

This helps diagnose issues when initialization fails.

## Expected Behavior After Fix

### Success Path
1. User clicks "Run Campaign"
2. Server initializes WhatsApp client
3. Browser process starts and loads WhatsApp Web
4. QR code is generated and displayed
5. User scans QR code with their phone
6. Client authenticates
7. Messages are sent

### Failure Path (Previously Would Hang)
1. User clicks "Run Campaign"
2. Server initializes WhatsApp client
3. Browser fails to start OR
4. WhatsApp Web fails to load OR
5. Network connectivity issues
6. **Now:** After 120 seconds, user sees clear error message instead of indefinite loading
7. Error is logged to console with details

## Testing
To verify the fix is working:

1. Start the application: `npm start`
2. Open the browser UI at `http://localhost:3000`
3. Click "Run Campaign"
4. Monitor the server terminal for `[WhatsApp]` prefixed log messages
5. If there are issues:
   - After 120 seconds, an error will appear in the UI
   - Server logs will show exactly where initialization failed
   - Look for messages like:
     - `[WhatsApp] Creating client with executablePath: ...`
     - `[WhatsApp] Calling client.initialize() with 120000ms timeout...`
     - `[WhatsApp] Initialization failed on attempt 1: ...`

## Configuration

To adjust the timeout if needed:

```javascript
// In services/whatsappService.js, line 8:
const INITIALIZE_TIMEOUT_MS = 120000; // Change 120000 to desired milliseconds
```

Default is 2 minutes (120,000 ms). Increase if running on slower hardware, decrease for faster feedback.

## Additional Notes

- The fix includes automatic retry logic (2 attempts by default)
- Each attempt has the full 120-second timeout
- Transient errors are retried automatically
- The browser cleanup is properly handled even on timeout
- Windows-specific issues (file locking, OneDrive sync) are handled with warnings

## Browser Requirements

Ensure your system has:
- Google Chrome installed at default location, OR
- Microsoft Edge installed, OR
- Set `PUPPETEER_EXECUTABLE_PATH` environment variable pointing to Chrome/Edge

Chrome/Edge can be found at:
- Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Windows: `C:\Program Files\Microsoft\Edge\Application\msedge.exe`
