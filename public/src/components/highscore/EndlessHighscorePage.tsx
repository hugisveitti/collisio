import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import {
  getEndlessRunData,
  IEndlessRunData,
} from "../../firebase/firestoreGameFunctions";
import BackdropContainer from "../backdrop/BackdropContainer";
import EndlessHighscoreTable from "./EndlessHighscoreTable";

interface IEndlessHighscorePage {}

const EndlessHighscorePage = (props: IEndlessHighscorePage) => {
  const [data, setData] = useState([] as IEndlessRunData[]);

  useEffect(() => {
    getEndlessRunData(0, 25).then((_data) => {
      setData(_data);
    });
  }, []);

  return (
    <BackdropContainer backgroundContainer autoEnter>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography>Endless leaderboard</Typography>
        </Grid>
        <Grid item xs={12}>
          <EndlessHighscoreTable data={data} />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default EndlessHighscorePage;
