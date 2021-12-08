import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginComponent from "../components/LoginComponent";
import { auth } from "../firebase/firebaseInit";
import { UserContext } from "../providers/UserProvider";
import AdminComponent from "./AdminComponent";

const AdminContainer = () => {
  const user = useContext(UserContext);
  const [userTokenId, setUserTokenId] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      auth.currentUser.getIdToken().then((_userTokenId) => {
        setUserTokenId(_userTokenId);

        fetch(`/role/${_userTokenId}`)
          .then((res) => res.json())
          .then((data: any) => {
            if (data.status === "success") {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
              toast.error("Unauthorized");
              window.location.href = "/";
            }
          });
      });
    }
  }, [user]);

  return (
    <div style={{ margin: 15 }}>
      <h1>Welcome to the Admin tool {user?.displayName}</h1>

      <div>
        {!user ? (
          <LoginComponent onClose={() => {}} signInWithPopup />
        ) : (
          <>{isAdmin && <AdminComponent userTokenId={userTokenId} />}</>
        )}
      </div>
    </div>
  );
};

export default AdminContainer;
