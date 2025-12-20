import React from "react";
import { createRoot } from "react-dom/client";
import HomePage from "./app/page";
// Import global styles to ensure Tailwind and custom styles are applied
import "./app/globals.css";

const container = document.getElementById("root");

if (!container) {
    throw new Error("Target container 'root' not found in the DOM.");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
);