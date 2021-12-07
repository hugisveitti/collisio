import Grid from "@mui/material/Grid";
import React from "react";
import { Socket } from "socket.io-client";
import AppContainer from "../../containers/AppContainer";
import { getDeviceType } from "../../utils/settings";
import { IStore } from "../store";
import ConnectToWaitingRoomComponent from "./ConnectToWaitingRoomComponent";

interface IConnectToWaitingRoomContainer {
  store: IStore;
}

const ConnectToWaitingRoomContainer = (
  props: IConnectToWaitingRoomContainer
) => {
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <ConnectToWaitingRoomComponent
          store={props.store}
          quickConnection={getDeviceType() === "desktop"}
        />
      </Grid>
    </AppContainer>
  );
};

export default ConnectToWaitingRoomContainer;
