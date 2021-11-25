import React from "react";
import ReactDOM from "react-dom";
import UserProvider from "../providers/UserProvider";
import AdminContainer from "./AdminContainer";

const AdminApp = () => {
  return (
    <UserProvider>
      <AdminContainer />
    </UserProvider>
  );
};

ReactDOM.render(<AdminApp />, document.getElementById("root"));
