import React, { createContext, useEffect, useState } from "react";
import {
  createDBUser,
  getIsPremiumUser,
  IUser,
} from "../firebase/firebaseFunctions";
import { auth } from "../firebase/firebaseInit";

interface IUserProvider {
  children: any;
}

export const UserContext = createContext(null as null | IUser);

const UserProvider = (props: IUserProvider) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const authListener = auth.onAuthStateChanged((userAuth) => {
      if (auth.currentUser && !user) {
        getIsPremiumUser(auth.currentUser.uid, (isPremium) => {
          const userInfo = {
            displayName: auth.currentUser.displayName,
            uid: auth.currentUser.uid,
            photoURL: auth.currentUser.photoURL,
            email: auth.currentUser.email,
            isPremium: isPremium,
          };
          setUser(userInfo);
          createDBUser(userInfo);
        });
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
