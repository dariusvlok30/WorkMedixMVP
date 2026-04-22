"use strict";

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const normalizer = require("../normalizer");

/**
 * Opens the spirometer serial port and calls onData({ device_type, data })
 * whenever a complete measurement arrives.
 */
function start(portPath, onData, onError) {
  const port = new SerialPort({ path: portPath, baudRate: 9600 }, (err) => {
    if (err) { onError(err); return; }
    console.log(`[spirometer] connected on ${portPath}`);
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
  let buffer = "";

  parser.on("data", (line) => {
    buffer += line + "\n";
    // Most spirometers send a block ending with "END" or a blank line after results
    if (/END|FEV1/i.test(line)) {
      const normalized = normalizer.spirometer(buffer);
      onData({ device_type: "spirometer", data: normalized });
      buffer = "";
    }
  });

  port.on("error", onError);
  return port;
}

module.exports = { start };
