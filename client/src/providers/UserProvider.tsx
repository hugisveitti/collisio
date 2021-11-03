import { User } from "@firebase/auth";
import { ref, set } from "@firebase/database";
import { off } from "firebase/database";

import React, { createContext, useEffect, useState } from "react";
import { createDBUser, getDBUser, IUser } from "../firebase/firebaseFunctions";

import { auth, database, usersRefPath } from "../firebase/firebaseInit";

interface IUserProvider {
  children: any;
}

interface MyUser extends User {
  idToken: string;
}

export const UserContext = createContext(null as null | IUser);

const UserProvider = (props: IUserProvider) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const authListener = auth.onAuthStateChanged((userAuth) => {
      console.log("auth change", userAuth);

      if (auth.currentUser && !user) {
        const userInfo = {
          displayName: auth.currentUser.displayName,
          uid: auth.currentUser.uid,
          photoURL: auth.currentUser.photoURL,
          email: auth.currentUser.email,
        };
        setUser(userInfo);
        createDBUser(userInfo);
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
