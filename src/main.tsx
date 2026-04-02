import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore dark mode preference
if (localStorage.getItem("tukio_dark_mode") === "true") {
  document.documentElement.classList.add("dark");
}
// Restore text size preference
const savedTextSize = localStorage.getItem("tukio_text_size");
if (savedTextSize === "small") document.documentElement.classList.add("text-size-small");
else if (savedTextSize === "large") document.documentElement.classList.add("text-size-large");

// PWA: Unregister service workers in preview/iframe contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
