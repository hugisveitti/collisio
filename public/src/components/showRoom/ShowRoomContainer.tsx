import React, { useContext } from "react";
import AppContainer from "../../containers/AppContainer";
import { containerBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import ShowRoomComponent from "./ShowRoomComponent";

interface IShowRoomContainer {}

const ShowRoomContainer = (props: IShowRoomContainer) => {
  const user = useContext(UserContext);

  return (
    <AppContainer>
      <div
        style={{
          backgroundColor: containerBackgroundColor,
          paddingTop: 1,
        }}
      >
        <ShowRoomComponent isPremiumUser={user?.isPremium} />
      </div>
    </AppContainer>
  );
};

export default ShowRoomContainer;
