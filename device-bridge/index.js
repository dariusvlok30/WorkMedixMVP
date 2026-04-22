"use strict";

require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const spirometer = require("./devices/spirometer");
const audiometer = require("./devices/audiometer");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const WS_PORT = parseInt(process.env.WS_PORT ?? "3001");
const API_URL = process.env.WORKMEDIX_API_URL ?? "http://localhost:3000";
const BRIDGE_SECRET = process.env.BRIDGE_SECRET ?? "";

// Track active clinic sessions: appointmentId per connected WS client
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[ws] client connected (total: ${clients.size})`);

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[ws] client disconnected (total: ${clients.size})`);
  });
});

// Broadcast device data to all connected clinic pages
function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

// Push data to WorkMedix API and broadcast to clinic page
async function handleDeviceData(appointmentId, deviceType, data) {
  // Broadcast immediately so the clinic page fills in real time
  broadcast({ device_type: deviceType, data });

  if (!appointmentId) return; // No appointment selected yet

  try {
    const res = await fetch(`${API_URL}/api/devices/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-token": BRIDGE_SECRET,
      },
      body: JSON.stringify({ appointment_id: appointmentId, device_type: deviceType, normalized: data }),
    });
    if (!res.ok) console.error(`[api] POST failed: ${res.status}`);
    else console.log(`[api] saved ${deviceType} result for appointment ${appointmentId}`);
  } catch (err) {
    console.error("[api] error:", err.message);
  }
}

// REST endpoint: clinic page tells bridge which appointment is active
let currentAppointmentId = null;
app.post("/appointment", (req, res) => {
  currentAppointmentId = req.body.appointment_id ?? null;
  console.log(`[bridge] active appointment: ${currentAppointmentId}`);
  res.json({ ok: true });
});

app.get("/status", (_req, res) => {
  res.json({ status: "running", clients: clients.size, appointment: currentAppointmentId });
});

// Start device listeners
const onData = ({ device_type, data }) => handleDeviceData(currentAppointmentId, device_type, data);
const onError = (err) => console.error(`[device] error:`, err.message);

if (process.env.SPIROMETER_PORT) {
  spirometer.start(process.env.SPIROMETER_PORT, onData, onError);
}
if (process.env.AUDIOMETER_PORT) {
  audiometer.start(process.env.AUDIOMETER_PORT, onData, onError);
}

server.listen(WS_PORT, () => {
  console.log(`\nWorkMedix Device Bridge running on ws://localhost:${WS_PORT}`);
  console.log(`API target: ${API_URL}`);
  console.log(`Devices: spiro=${process.env.SPIROMETER_PORT ?? "none"} audio=${process.env.AUDIOMETER_PORT ?? "none"}\n`);
});
