import { CircularProgress, Grid, Typography } from "@mui/material";
import React, { useContext, useEffect } from "react";
import { getLocalUid } from "../classes/localStorage";
import { UserContext } from "../providers/UserProvider";
import BackdropContainer from "./backdrop/BackdropContainer";
import BackdropButton from "./button/BackdropButton";
import ToFrontPageButton from "./inputs/ToFrontPageButton";
import { singlePlayerGameRoomPath } from "./Routes";
import RoomAndGameSettingsContainer from "./settings/RoomAndGameSettingsContainer";
import VehicleSettingsComponent from "./settings/VehicleSettingsComponent";
import { IStore } from "./store";

interface ISinglePlayerWaitingRoom {
  store: IStore;
}

const SinglePlayerWaitingRoom = (props: ISinglePlayerWaitingRoom) => {
  const user = useContext(UserContext);

  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        {user === null ? (
          <>
            <Grid item xs={12} style={{ textAlign: "center", margin: "auto" }}>
              <Typography>Loading user...</Typography>
            </Grid>
            <Grid item xs={12} style={{ textAlign: "center", margin: "auto" }}>
              <CircularProgress />
            </Grid>
          </>
        ) : (
          <React.Fragment>
            <Grid item xs={12}>
              <ToFrontPageButton />
            </Grid>
            <Grid item xs={12}>
              <Typography>Single player with keyboard</Typography>
            </Grid>
            <Grid item xs={12}>
              <BackdropButton link={singlePlayerGameRoomPath}>
                Start Game
              </BackdropButton>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Bot difficulty {props.store.gameSettings.botDifficulty}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <RoomAndGameSettingsContainer store={props.store} multiplayer />
            </Grid>
            <Grid item xs={12}>
              <VehicleSettingsComponent
                maxWidth="100%"
                store={props.store}
                user={user}
              />
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default SinglePlayerWaitingRoom;
