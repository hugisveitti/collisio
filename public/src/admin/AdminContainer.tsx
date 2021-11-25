import React, { useContext, useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import LoginComponent from "../components/LoginComponent";
import { auth } from "../firebase/firebaseInit";
import { UserContext } from "../providers/UserProvider";
import AdminComponent from "./AdminComponent";
import "react-toastify/dist/ReactToastify.css";

const AdminContainer = () => {
  const user = useContext(UserContext);

  const [roomsInfo, setRoomsInfo] = useState([]);

  useEffect(() => {
    if (user) {
      auth.currentUser.getIdToken().then((userTokenId) => {
        const options = {
          method: "GET",
          // body: JSON.stringify(data),
        };

        fetch(`/admin-data/${userTokenId}`, options)
          .then((res) => res.json())
          .then((resData) => {
            if (resData.statusCode === 200) {
              console.log(resData);
              toast.success(resData.message);
              const data = resData.data;
              const keys = Object.keys(data);
              const arr = [];
              for (let key of keys) {
                arr.push(data[key]);
              }
              setRoomsInfo(arr);
            } else if (resData.statusCode === 403) {
              toast.error("Unauthorized user");
            }
          });
      });
    }
  }, [user]);

  return (
    <div style={{ margin: 15 }}>
      <h1>Admin tool</h1>
      <h3>{user?.displayName}</h3>
      <div>
        {!user ? (
          <LoginComponent
            onClose={() => console.log("close")}
            signInWithPopup
          />
        ) : (
          <AdminComponent roomsInfo={roomsInfo} />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AdminContainer;
