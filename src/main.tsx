import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { AuthWithOTP } from "./components/AuthWithOTP";

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthWithOTP>
      <App />
    </AuthWithOTP>
  </React.StrictMode>
);
