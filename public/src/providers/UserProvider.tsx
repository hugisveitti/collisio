import { updateProfile } from "firebase/auth";
import React, { createContext, useEffect, useState } from "react";
import { IPublicUser, IUser } from "../classes/User";
import { auth } from "../firebase/firebaseInit";
import {
  setFirestorePrivateUser,
  setFirestorePublicUser,
} from "../firebase/firestoreFunctions";
import { getDateNow } from "../utils/utilFunctions";

interface IUserProvider {
  children: any;
}

export const UserContext = createContext(null as null | IUser);

const vehiclePhotos = [
  "https://i.imgur.com/Q5RMplj.png", // f1
  "https://i.imgur.com/DliTGT2.png", // future
  "https://i.imgur.com/13u44E5.png", // goKart
  "https://i.imgur.com/llTq0wI.png", // norm2
  "https://i.imgur.com/fk4J2PG.png", // big girl sal
  "https://i.imgur.com/zjSr8Am.png", // round bet
  "https://i.imgur.com/oITpz4k.png", // sports
  "https://i.imgur.com/2hWtdNH.png", // tractor
];

const UserProvider = (props: IUserProvider) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const authListener = auth.onAuthStateChanged((userAuth) => {
      if (auth.currentUser && !user) {
        let photoURL = auth.currentUser.photoURL ?? "";

        let displayName = auth.currentUser.displayName;
        const create = new Date(auth.currentUser.metadata.creationTime);

        // if created less than 20 secs
        // then set profile pic and photo
        if (
          Math.abs(create.getTime() - new Date().getTime()) < 20 * 1000 &&
          auth.currentUser.providerData?.[0].providerId === "google.com"
        ) {
          const r = Math.floor(Math.random() * vehiclePhotos.length);
          photoURL = vehiclePhotos[r]; // "https://i.imgur.com/YHGSEpE.jpg";
          console.log("Photo", photoURL);
          // new user
          displayName = auth.currentUser.displayName.split(" ")[0];
          updateProfile(auth.currentUser, { displayName, photoURL });
        }

        const userInfo = {
          displayName,
          uid: auth.currentUser.uid,
          photoURL,
          email: auth.currentUser.email,
          creationDate: getDateNow(),
          latestLogin: getDateNow(),
        };
        setUser(userInfo);
        //   createDBUser(userInfo);
        setFirestorePrivateUser(userInfo);
        const publicUser: IPublicUser = {
          displayName: auth.currentUser.displayName,
          uid: auth.currentUser.uid,
          photoURL: auth.currentUser.photoURL ?? "",
          latestLogin: getDateNow(),
          creationDate: getDateNow(),
        };
        setFirestorePublicUser(publicUser);
      } else {
        // change from null to undefined triggers useEffect in LoginComponent
        setUser(undefined);
      }
    });

    return () => {};
  }, []);

  return (
    <UserContext.Provider value={user}>{props.children}</UserContext.Provider>
  );
};

export default UserProvider;
