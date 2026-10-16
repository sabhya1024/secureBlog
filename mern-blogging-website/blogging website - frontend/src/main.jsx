import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// Production Log Manager: Keep the browser console completely clean like modern web apps
window.__APP_LOGS__ = window.__APP_LOGS__ || [];

const captureInternalLog = (type, args) => {
  try {
    const formatted = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
      .join(" ");

    window.__APP_LOGS__.push({
      time: new Date().toISOString(),
      type,
      message: formatted,
    });

    if (window.__APP_LOGS__.length > 200) {
      window.__APP_LOGS__.shift();
    }
  } catch (e) {}
};

// Known third-party library noise to completely suppress from developer tools
const isSuppressedNotice = (args) => {
  const fullText = args.map((a) => (a ? String(a.message || a) : "")).join(" ");
  return (
    fullText.includes("Cross-Origin-Opener-Policy") ||
    fullText.includes("window.close") ||
    fullText.includes("addRange()") ||
    fullText.includes("stretchBlock()") ||
    fullText.includes("Editor.js") ||
    fullText.includes("[Editor.js saving]")
  );
};

// Silence logs in production, and silence library noise in all environments
const originalWarn = console.warn;
const originalError = console.error;

if (import.meta.env.PROD) {
  console.log = (...args) => captureInternalLog("log", args);
  console.info = (...args) => captureInternalLog("info", args);
  console.debug = (...args) => captureInternalLog("debug", args);
  console.warn = (...args) => captureInternalLog("warn", args);
  console.error = (...args) => {
    captureInternalLog("error", args);
    if (isSuppressedNotice(args)) return;
    // Only pass through critical application failures
  };
} else {
  // Even in dev, filter out noisy third-party notices
  console.warn = (...args) => {
    captureInternalLog("warn", args);
    if (isSuppressedNotice(args)) return;
    originalWarn(...args);
  };
  console.error = (...args) => {
    captureInternalLog("error", args);
    if (isSuppressedNotice(args)) return;
    originalError(...args);
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>

);