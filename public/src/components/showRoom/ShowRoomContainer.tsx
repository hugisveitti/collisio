import React, { useContext } from "react";
import AppContainer from "../../containers/AppContainer";
import { containerBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import ShowRoomComponent from "./ShowRoomComponent";

interface IShowRoomContainer {}

const ShowRoomContainer = (props: IShowRoomContainer) => {
  const user = useContext(UserContext);

  return (
    <AppContainer
      containerStyles={{
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0.1,
      }}
    >
      <ShowRoomComponent isPremiumUser={false} excludedVehicles={["test"]} />
    </AppContainer>
  );
};

export default ShowRoomContainer;
