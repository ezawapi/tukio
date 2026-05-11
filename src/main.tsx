import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare global {
  interface Window {
    __tukioDomMutationGuardInstalled?: boolean;
  }
}

if (!window.__tukioDomMutationGuardInstalled && typeof Node !== "undefined" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function removeChildGuard<T extends Node>(child: T) {
    if (child && child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  Node.prototype.insertBefore = function insertBeforeGuard<T extends Node>(newNode: T, referenceNode: Node | null) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  window.__tukioDomMutationGuardInstalled = true;
}

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

document.documentElement.classList.add("notranslate");
document.body.classList.add("notranslate");

createRoot(document.getElementById("root")!).render(<App />);
