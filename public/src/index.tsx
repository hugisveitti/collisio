import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import React from "react";
import ReactDOM from "react-dom";
import { ToastContainer } from "react-toastify";
import Routes from "./components/Routes";
import { themeOptions } from "./providers/theme";
import UserProvider from "./providers/UserProvider";

ReactDOM.render(
  <UserProvider>
    <ThemeProvider theme={themeOptions}>
      <Routes />

      <ToastContainer limit={3} pauseOnFocusLoss={false} />
    </ThemeProvider>
  </UserProvider>,
  document.getElementById("root")
);
