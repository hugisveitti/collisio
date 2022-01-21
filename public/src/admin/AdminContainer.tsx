import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginComponent from "../components/LoginComponent";
import { auth } from "../firebase/firebaseInit";
import { UserContext } from "../providers/UserProvider";
import {
  mdts_number_connected,
  stmd_number_connected,
} from "../shared-backend/shared-stuff";
import { createSocket } from "../utils/connectSocket";
import { getDeviceType } from "../utils/settings";
import AdminComponent from "./AdminComponent";

const AdminContainer = () => {
  const user = useContext(UserContext);
  const [userTokenId, setUserTokenId] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  const [socket, setSocket] = useState(undefined);

  const [connectionData, setConnectionData] = useState({});

  useEffect(() => {
    if (user) {
      auth.currentUser.getIdToken().then((_userTokenId) => {
        setUserTokenId(_userTokenId);

        fetch(`/role/${_userTokenId}`)
          .then((res) => res.json())
          .then((data: any) => {
            if (data.status === "success") {
              setIsAdmin(true);
              createSocket(getDeviceType()).then((_s) => {
                setSocket(_s);
              });
            } else {
              setIsAdmin(false);
              toast.error("Unauthorized");
              window.location.href = "/";
            }
          });
      });
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.emit(mdts_number_connected);
      socket.once(stmd_number_connected, (res) => {
        setConnectionData(res.data);
      });
    }
  }, [socket]);

  return (
    <div style={{ margin: 15 }}>
      <h1>Welcome to the Admin tool {user?.displayName}</h1>

      <div>
        {!user ? (
          <LoginComponent onClose={() => {}} signInWithPopup />
        ) : (
          <>
            {isAdmin && (
              <AdminComponent
                userTokenId={userTokenId}
                connectionData={connectionData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminContainer;
