"use strict";

/**
 * Normalizes raw device output into WorkMedix JSON schema.
 * Each device parser calls normalizer.spirometer(rawLines) etc.
 */

function spirometer(raw) {
  // Parses typical MIR/Vitalograph ASCII output lines like:
  // FVC: 4.12 L  FEV1: 3.45 L  FEV1%: 83.7%  PEF: 8.20 L/s
  const extract = (pattern) => {
    const m = raw.match(pattern);
    return m ? parseFloat(m[1]) : null;
  };
  const fvc = extract(/FVC[:\s]+([0-9.]+)/i);
  const fev1 = extract(/FEV1[:\s]+([0-9.]+)/i);
  const fev1pct = extract(/FEV1%[:\s]+([0-9.]+)/i);
  const pef = extract(/PEF[:\s]+([0-9.]+)/i);
  const ratio = fvc && fev1 ? Math.round((fev1 / fvc) * 1000) / 1000 : null;
  return {
    fvc_actual: fvc,
    fev1_actual: fev1,
    fev1_percent: fev1pct,
    fev1_fvc_ratio: ratio,
    pef_actual: pef,
    raw,
  };
}

function audiometer(raw) {
  // Parses Interacoustics/Madsen CSV-style output:
  // L,500,20  L,1000,25  R,500,15 ...
  const result = {};
  const lines = raw.split(/[\r\n,]+/).filter(Boolean);
  for (let i = 0; i < lines.length - 2; i += 3) {
    const ear = lines[i].trim().toLowerCase();
    const freq = lines[i + 1].trim();
    const threshold = parseFloat(lines[i + 2].trim());
    if ((ear === "l" || ear === "r") && freq && !isNaN(threshold)) {
      const side = ear === "l" ? "left" : "right";
      result[`${side}_${freq}`] = threshold;
    }
  }
  return { ...result, raw };
}

function bloodPressure(raw) {
  // Parses typical BP monitor serial output: SYS/DIA PULSE
  // e.g. "120/80 72" or "SYS:120 DIA:80 PUL:72"
  const sys = raw.match(/(?:SYS[:\s]+)?(\d{2,3})\s*\//) || raw.match(/SYS[:\s]+(\d+)/i);
  const dia = raw.match(/\/\s*(\d{2,3})/) || raw.match(/DIA[:\s]+(\d+)/i);
  const pul = raw.match(/(?:PUL|PULSE)[:\s]+(\d+)/i) || raw.match(/\d+\/\d+\s+(\d+)/);
  return {
    systolic: sys ? parseInt(sys[1]) : null,
    diastolic: dia ? parseInt(dia[1]) : null,
    pulse: pul ? parseInt(pul[1]) : null,
    raw,
  };
}

module.exports = { spirometer, audiometer, bloodPressure };
