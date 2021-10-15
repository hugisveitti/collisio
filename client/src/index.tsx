import React from "react";
import ReactDOM from "react-dom";
import Routes from "./components/Routes";
import UserProvider from "./providers/UserProvider";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

ReactDOM.render(
  <UserProvider>
    <Routes />
  </UserProvider>,
  document.getElementById("root")
);
