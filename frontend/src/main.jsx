import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { DiscountProvider } from "./contexts/DiscountContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DiscountProvider>
      <App />
    </DiscountProvider>
  </React.StrictMode>
);
