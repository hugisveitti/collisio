import { User } from "@firebase/auth";
import React, { createContext, useEffect, useState } from "react";

import { auth } from "../firebase/firebaseFunctions";

interface IUserProvider {
  children: any;
}

interface MyUser extends User {
  idToken: string;
}

export const UserContext = createContext(null as null | MyUser);

const UserProvider = (props: IUserProvider) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    auth.onAuthStateChanged((userAuth) => {
      console.log("auth stated changed", userAuth);
      if (auth.currentUser) {
        auth.currentUser.getIdToken(true).then((userIdToken) => {
          const newUser = { ...userAuth, idToken: userIdToken } as MyUser;
          setUser(newUser);
        });
      } else {
        setUser(null);
      }
    });
  }, []);

  return (
    <UserContext.Provider value={user}>{props.children}</UserContext.Provider>
  );
};

export default UserProvider;
