import Grid from "@mui/material/Grid";
import React, { useEffect } from "react";
import { Socket } from "socket.io-client";
import { getLocalStorageItem } from "../../classes/localStorage";
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
  const onMobile = getDeviceType() !== "desktop";

  return (
    <AppContainer>
      <Grid container spacing={3}>
        <ConnectToWaitingRoomComponent
          store={props.store}
          quickConnection={!onMobile}
        />
      </Grid>
    </AppContainer>
  );
};

export default ConnectToWaitingRoomContainer;
