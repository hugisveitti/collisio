import React from "react";
import ReactDOM from "react-dom";
import UserProvider from "../providers/UserProvider";
import AdminComponent from "./AdminComponent";

const AdminApp = () => {
  return (
    // <UserProvider>
    <AdminComponent />
    // </UserProvider>
  );
};

ReactDOM.render(<AdminApp />, document.getElementById("root"));
