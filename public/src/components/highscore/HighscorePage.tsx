import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { IEndOfRaceInfoPlayer, nonActiveTrackNames } from "../../classes/Game";
import {
  BestTrackScore,
  getBestScoresOnTrack,
} from "../../firebase/firestoreGameFunctions";
import { getStyledColors } from "../../providers/theme";
import { TrackName } from "../../shared-backend/shared-stuff";
import "../../styles/main.css";
import { itemInArray } from "../../utils/utilFunctions";
import BackdropContainer from "../backdrop/BackdropContainer";
import "../inputs/select.css";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import TrackSelect from "../inputs/TrackSelect";
import HighscoreTable from "./HighscoreTable";

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
        if (nolKeys?.length > 0) {
          setNumberOfLapsKey(nolKeys[0]);
        } else {
          setNumberOfLapsKey("");
        }
      } else {
        setHighscoreList(data[numberOfLapsKey]);
      }
    });
  }, [trackKey]);

  const { color, backgroundColor } = getStyledColors("white");

  /** use window.localStorage to remember what user was looking at */
  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ToFrontPageButton color="white" />
        </Grid>
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
              <TrackSelect
                excludedTracks={nonActiveTrackNames}
                fullWidth
                onChange={(newTrackKey) => {
                  setTrackKey(newTrackKey);
                }}
                gameType="race"
                value={trackKey as TrackName}
                showMapPreview={false}
              />
            </Grid>

            <Grid item xs={9} sm={3}>
              <span style={{ display: "block", color: backgroundColor }}>
                Track
              </span>
              <FormControl fullWidth>
                <Select
                  className="select"
                  label="No. laps"
                  style={{
                    minWidth: 100,
                    backgroundColor,
                    color,
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
              <Tooltip
                style={{ color: backgroundColor }}
                title="Each track and number of laps combination has its own highscore table."
              >
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
    </BackdropContainer>
  );
};

export default HighscorePage;
