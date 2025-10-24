import React from "react";
import { createRoot } from "react-dom/client";
import HomePage from "./app/page";
import RootLayout from "./app/layout";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <RootLayout>
      <HomePage />
    </RootLayout>
  </React.StrictMode>
);