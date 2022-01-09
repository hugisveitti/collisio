import Grid from "@mui/material/Grid";
import React, { useEffect } from "react";
import { useHistory } from "react-router";
import AppContainer from "../../containers/AppContainer";
import { getDeviceType } from "../../utils/settings";
import { waitingRoomPath } from "../Routes";
import { IStore } from "../store";
import ConnectToWaitingRoomComponent from "./ConnectToWaitingRoomComponent";

interface IConnectToWaitingRoomContainer {
  store: IStore;
}

const ConnectToWaitingRoomContainer = (
  props: IConnectToWaitingRoomContainer
) => {
  const onMobile = getDeviceType() !== "desktop";
  console.log("Store in connect to wait room", props.store);
  const history = useHistory();

  useEffect(() => {
    if (props.store.previousPage === waitingRoomPath) {
      console.log("go bacl");
      history.goBack();
    }
  }, []);

  const quickConnection =
    !onMobile && props.store.previousPage !== waitingRoomPath;
  console.log("quick conn", quickConnection);
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <ConnectToWaitingRoomComponent
          store={props.store}
          quickConnection={quickConnection}
        />
      </Grid>
    </AppContainer>
  );
};

export default ConnectToWaitingRoomContainer;
