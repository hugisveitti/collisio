import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { useHistory, useParams } from "react-router";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import { getTrophyRoomPath } from "../Routes";
import { IStore } from "../store";
import MyTextField from "../textField/MyTextField";
import TrophyRoomComponent from "./TrophyRoomComponent";

interface TrophyRoomParams {
  id: string | undefined;
}

interface ITrophyRoomContainer {
  store: IStore;
}

const TrophyRoomContainer = (props: ITrophyRoomContainer) => {
  const history = useHistory();
  const { id } = useParams<TrophyRoomParams>();

  const [searchId, setSearchId] = useState("");

  return (
    <BackdropContainer backgroundContainer store={props.store}>
      <Grid container spacing={3}>
        {id ? (
          <Grid item xs={12}>
            <TrophyRoomComponent id={id} />
          </Grid>
        ) : (
          <>
            <Grid item xs={12}>
              <MyTextField
                label="Trophy id"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <BackdropButton
                onClick={() => history.push(getTrophyRoomPath(searchId))}
              >
                Go
              </BackdropButton>
            </Grid>
          </>
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default TrophyRoomContainer;
