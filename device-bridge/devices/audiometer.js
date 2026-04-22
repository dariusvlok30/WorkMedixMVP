"use strict";

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const normalizer = require("../normalizer");

function start(portPath, onData, onError) {
  const port = new SerialPort({ path: portPath, baudRate: 9600 }, (err) => {
    if (err) { onError(err); return; }
    console.log(`[audiometer] connected on ${portPath}`);
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
  let buffer = "";

  parser.on("data", (line) => {
    buffer += line + ",";
    // Interacoustics sends all frequency data then a terminator line
    if (/DONE|END|8000/i.test(line)) {
      const normalized = normalizer.audiometer(buffer);
      onData({ device_type: "audiometer", data: normalized });
      buffer = "";
    }
  });

  port.on("error", onError);
  return port;
}

module.exports = { start };
