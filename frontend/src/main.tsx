import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/geist-sans";
import "@fontsource/geist-mono";
import App from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
