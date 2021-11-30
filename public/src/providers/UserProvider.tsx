import React, { createContext, useEffect, useState } from "react";
import { IPublicUser, IUser } from "../classes/User";
import { createDBUser, getIsPremiumUser } from "../firebase/firebaseFunctions";
import { auth } from "../firebase/firebaseInit";
import { setFirestorePublicUser } from "../firebase/firestoreFunctions";
import { getDateNow } from "../utils/utilFunctions";

interface IUserProvider {
  children: any;
}

export const UserContext = createContext(null as null | IUser);

const UserProvider = (props: IUserProvider) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const authListener = auth.onAuthStateChanged((userAuth) => {
      if (auth.currentUser && !user) {
        const userInfo = {
          displayName: auth.currentUser.displayName,
          uid: auth.currentUser.uid,
          photoURL: auth.currentUser.photoURL ?? "",
          email: auth.currentUser.email,
          latestLogin: getDateNow(),
        };
        setUser(userInfo);
        createDBUser(userInfo);
        const publicUser: IPublicUser = {
          displayName: auth.currentUser.displayName,
          uid: auth.currentUser.uid,
          photoURL: auth.currentUser.photoURL ?? "",
          latestLogin: getDateNow(),
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
