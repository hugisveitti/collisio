import Grid from "@mui/material/Grid";
import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { getDeviceType } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import { connectPagePath, waitingRoomPath } from "../Routes";
import { IStore } from "../store";
import ConnectToWaitingRoomComponent from "./ConnectToWaitingRoomComponent";

interface IConnectToWaitingRoomContainer {
  store: IStore;
}

const ConnectToWaitingRoomContainer = (
  props: IConnectToWaitingRoomContainer
) => {
  const onMobile = getDeviceType() !== "desktop";
  const history = useHistory();

  useEffect(() => {
    if (props.store.previousPage === waitingRoomPath) {
      history.goBack();
    } else {
      props.store.setPreviousPage(connectPagePath);
    }
  }, []);

  const quickConnection =
    !onMobile && props.store.previousPage !== waitingRoomPath;
  return (
    <BackdropContainer store={props.store}>
      <Grid container spacing={3}>
        <ConnectToWaitingRoomComponent
          store={props.store}
          quickConnection={quickConnection}
        />
      </Grid>
    </BackdropContainer>
  );
};

export default ConnectToWaitingRoomContainer;
