# WorkMedix Device Bridge

Runs on the **clinic laptop** (Windows). Reads spirometer + audiometer via USB/serial and streams results to the WorkMedix web app in real time.

## Setup

```bash
cd device-bridge
npm install
cp .env.example .env
# Edit .env: set WORKMEDIX_API_URL, BRIDGE_SECRET, COM ports
npm start
```

## How it works

1. Clinic laptop has spirometer on e.g. COM3, audiometer on COM4
2. Bridge opens those serial ports and listens for measurements
3. When a test result arrives, it:
   - Broadcasts via WebSocket to any open clinic page (`ws://localhost:3001`)
   - POSTs to the WorkMedix API (`/api/devices/data`) to save in Supabase
4. Clinic page auto-fills the form with device data

## Tell the bridge which appointment is active

From the clinic page, when a worker is selected, POST to the bridge:

```js
fetch("http://localhost:3001/appointment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ appointment_id: "uuid-here" })
});
```

## COM port discovery

Open Device Manager → Ports (COM & LPT) while the device is plugged in to find the COM number.
