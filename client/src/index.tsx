import React from "react";
import ReactDOM from "react-dom";
import Routes from "./components/Routes";
import UserProvider from "./providers/UserProvider";

ReactDOM.render(
  <UserProvider>
    <Routes />
  </UserProvider>,
  document.getElementById("root")
);
