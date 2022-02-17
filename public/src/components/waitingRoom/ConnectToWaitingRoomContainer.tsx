import { CircularProgress, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useContext, useEffect } from "react";
import { useHistory, useParams } from "react-router";
import { UserContext } from "../../providers/UserProvider";
import { getDeviceType } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import { connectPagePath, waitingRoomPath } from "../Routes";
import { IStore } from "../store";
import ConnectToWaitingRoomComponent from "./ConnectToWaitingRoomComponent";

interface IConnectToWaitingRoomContainer {
  store: IStore;
}

interface WaitParamType {
  roomId: string;
}

const ConnectToWaitingRoomContainer = (
  props: IConnectToWaitingRoomContainer
) => {
  const onMobile = getDeviceType() !== "desktop";
  const history = useHistory();

  const params = useParams<WaitParamType>();
  const roomId = params?.roomId;
  const user = useContext(UserContext);

  useEffect(() => {
    // if (props.store.previousPage === waitingRoomPath) {
    //   history.goBack();
    // } else {
    props.store.setPreviousPage(connectPagePath);
    // }

    // any case we would not want this?
    if (roomId) {
      props.store.setRoomId(roomId);
    }
  }, []);

  console.log("param roomId", roomId);

  const quickConnection =
    (onMobile && !!roomId && !!user?.displayName) ||
    (!onMobile && props.store.previousPage !== waitingRoomPath);
  return (
    <BackdropContainer store={props.store} autoEnter>
      <Grid container spacing={3}>
        {user === null ? (
          <>
            <Grid item xs={12} style={{ textAlign: "center" }}>
              <CircularProgress />
            </Grid>
            <Grid item xs={12} style={{ textAlign: "center" }}>
              <Typography>Loading user...</Typography>
            </Grid>
          </>
        ) : (
          <ConnectToWaitingRoomComponent
            store={props.store}
            quickConnection={quickConnection}
            roomId={roomId}
            user={user}
          />
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default ConnectToWaitingRoomContainer;
