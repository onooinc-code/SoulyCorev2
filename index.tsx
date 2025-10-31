import React from "react";
import { createRoot } from "react-dom/client";
import HomePage from "./app/page";
// FIX: The RootLayout component is designed for Next.js App Router and cannot be rendered directly by createRoot into a div.
// It has been removed from this entrypoint to fix the rendering error.
// import RootLayout from "./app/layout";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
);