import React from "react";
import ReactDOM from "react-dom";
import Routes from "./components/Routes";
import UserProvider from "./providers/UserProvider";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import { themeOptions } from "./providers/theme";
import { ToastContainer } from "react-toastify";
import CookiePrompt from "./components/monitary/CookiePrompt";

ReactDOM.render(
  <UserProvider>
    <ThemeProvider theme={themeOptions}>
      <Routes />
      <CookiePrompt />
      <ToastContainer />
    </ThemeProvider>
  </UserProvider>,
  document.getElementById("root")
);
