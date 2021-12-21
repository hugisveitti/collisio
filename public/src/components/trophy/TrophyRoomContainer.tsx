import { Button, TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { useHistory, useParams } from "react-router";
import AppContainer from "../../containers/AppContainer";
import { getTrophyRoomPath } from "../Routes";
import TrophyRoomComponent from "./TrophyRoomComponent";

interface TrophyRoomParams {
  id: string | undefined;
}

interface ITrophyRoomContainer {}

const TrophyRoomContainer = (props: ITrophyRoomContainer) => {
  const history = useHistory();
  const { id } = useParams<TrophyRoomParams>();

  const [searchId, setSearchId] = useState("");

  return (
    <AppContainer>
      <Grid container spacing={3}>
        {id ? (
          <Grid item xs={12}>
            <TrophyRoomComponent id={id} />
          </Grid>
        ) : (
          <>
            <Grid item xs={12}>
              <TextField
                label="Trophy id"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={() => history.push(getTrophyRoomPath(searchId))}
              >
                Go
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </AppContainer>
  );
};

export default TrophyRoomContainer;
