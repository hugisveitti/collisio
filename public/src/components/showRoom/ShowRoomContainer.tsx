import React, { useContext } from "react";
import { UserContext } from "../../providers/UserProvider";
import BackdropContainer from "../backdrop/BackdropContainer";
import ShowRoomComponent from "./ShowRoomComponent";

interface IShowRoomContainer {}

const ShowRoomContainer = (props: IShowRoomContainer) => {
  const user = useContext(UserContext);

  return (
    <BackdropContainer backgroundContainer>
      <ShowRoomComponent isPremiumUser={false} excludedVehicles={["test"]} />
    </BackdropContainer>
  );
};

export default ShowRoomContainer;
