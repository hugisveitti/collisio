import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import {
  activeRaceTrackNames,
  getTrackNameFromType,
  IEndOfRaceInfoPlayer,
} from "../../classes/Game";
import AppContainer from "../../containers/AppContainer";
import { inputBackgroundColor } from "../../providers/theme";
import AdSense from "../monitary/AdSense";
import "../../styles/main.css";
import HighscoreTable from "./HighscoreTable";
import {
  BestTrackScore,
  getBestScoresOnTrack,
} from "../../firebase/firestoreGameFunctions";
import { TrackName } from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";

interface IHighscorePage {}

const HighscorePage = (props: IHighscorePage) => {
  const [numberOfLapsKeys, setNumberOfLapsKeys] = useState([]);
  const [numberOfLapsKey, setNumberOfLapsKey] = useState("");
  const [trackKey, setTrackKey] = useState("");

  const [highscoreHasLoaded, setHighscoreHasLoaded] = useState(false);

  const [bestTrackScores, setBestTrackScores] = useState({} as BestTrackScore);
  const [highscoreList, setHighscoreList] = useState(
    [] as IEndOfRaceInfoPlayer[]
  );

  useEffect(() => {
    if (bestTrackScores[numberOfLapsKey]) {
      setHighscoreList(bestTrackScores[numberOfLapsKey]);
    } else {
      setHighscoreList([]);
    }
  }, [numberOfLapsKey]);

  useEffect(() => {
    const storageTrackKey = window.localStorage.getItem("highscoreTrackKey");
    if (storageTrackKey) {
      setTrackKey(storageTrackKey as TrackName);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("highscoreTrackKey", trackKey);

    setHighscoreHasLoaded(false);
    getBestScoresOnTrack(trackKey, (data) => {
      setHighscoreHasLoaded(true);

      setBestTrackScores(data);
      const nolKeys = Object.keys(data);
      setNumberOfLapsKeys(nolKeys);

      if (!itemInArray(numberOfLapsKey, numberOfLapsKeys)) {
        if (nolKeys.length > 0) {
          setNumberOfLapsKey(nolKeys[0]);
        } else {
          setNumberOfLapsKey("");
        }
      } else {
        setHighscoreList(data[numberOfLapsKey]);
      }
    });
  }, [trackKey]);

  /** use window.localStorage to remember what user was looking at */
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography component="div" variant="h3">
            Highscores
          </Typography>
        </Grid>
        {!highscoreHasLoaded ? (
          <Grid
            item
            xs={12}
            style={{
              marginTop: 25,
              textAlign: "center",
            }}
          >
            <CircularProgress />
          </Grid>
        ) : (
          <>
            <Grid item xs={12} sm={3}>
              <Grid item xs={12}>
                <AdSense slotId="7059022973" />
              </Grid>

              <FormControl fullWidth>
                <InputLabel>Track name</InputLabel>
                <Select
                  label="    Track name"
                  onChange={(e) => {
                    const newTrackKey = e.target.value;
                    setTrackKey(newTrackKey as TrackName);
                  }}
                  style={{
                    minWidth: 100,
                    backgroundColor: inputBackgroundColor,
                  }}
                  value={trackKey}
                >
                  {activeRaceTrackNames.map((key) => (
                    <MenuItem key={key} value={key}>
                      {getTrackNameFromType(key)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={9} sm={3}>
              <FormControl fullWidth>
                <InputLabel>No. laps</InputLabel>
                <Select
                  label="No. laps"
                  style={{
                    minWidth: 100,
                    backgroundColor: inputBackgroundColor,
                  }}
                  value={
                    itemInArray(numberOfLapsKey, numberOfLapsKeys)
                      ? numberOfLapsKey
                      : ""
                  }
                  onChange={(e) => {
                    setNumberOfLapsKey(e.target.value);
                  }}
                >
                  {numberOfLapsKeys.map((key) => (
                    <MenuItem key={key} value={key}>
                      {key}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3} sm={1}>
              <Tooltip title="Each track and number of laps combination has its own highscore table.">
                <IconButton>
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
            </Grid>

            <Grid item xs={false} sm={4} />

            <Grid item xs={12}>
              <HighscoreTable
                data={highscoreList}
                noDataText="No one has recorded with the combination of this
                track and these number of laps"
              />
            </Grid>
          </>
        )}
      </Grid>
    </AppContainer>
  );
};

export default HighscorePage;
