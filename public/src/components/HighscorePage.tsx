import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrackNameFromType, IEndOfRaceInfoPlayer } from "../classes/Game";
import AppContainer from "../containers/AppContainer";
import {
  getUniqueHighscore,
  UniqueHighscoreDict,
} from "../firebase/firebaseFunctions";
import { cardBackgroundColor, inputBackgroundColor } from "../providers/theme";
import "../styles/main.css";
import HighscorePageTableRow from "./HighscorePageTableRow";
import { frontPagePath } from "./Routes";

const stringInList = (s: string, sList: string[]) => {
  for (let i = 0; i < sList.length; i++) {
    if (s === sList[i]) {
      return true;
    }
  }
  return false;
};

/** only display each player once */
const filterHighscoreList = (highscoreList: IEndOfRaceInfoPlayer[]) => {
  const uniquePlayerIds: string[] = [];
  const uniqueList: IEndOfRaceInfoPlayer[] = [];
  for (let item of highscoreList) {
    if (!stringInList(item.playerId, uniquePlayerIds)) {
      uniqueList.push(item);
      uniquePlayerIds.push(item.playerId);
    }
  }
  return uniqueList;
};

interface IHighscorePage {}

const HighscorePage = (props: IHighscorePage) => {
  const [numberOfLapsKeys, setNumberOfLapsKeys] = useState([]);
  const [trackKeys, setTrackKeys] = useState([]);
  const [numberOfLapsKey, setNumberOfLapsKey] = useState("");
  const [trackKey, setTrackKey] = useState("");

  const [highscoreDict, setHighscoreDict] = useState(
    undefined as UniqueHighscoreDict | undefined
  );
  const [highscoreHasLoaded, setHighscoreHasLoaded] = useState(false);

  useEffect(() => {
    getUniqueHighscore((_highscoreDict) => {
      const _trackKeys = Object.keys(_highscoreDict);
      if (_trackKeys.length === 0) {
        setHighscoreHasLoaded(true);
        return;
      }
      console.log("track keys", trackKeys);
      const storageTrackKey = window.localStorage.getItem("highscoreTrackKey");
      let cTrackKey =
        storageTrackKey && storageTrackKey in _highscoreDict
          ? storageTrackKey
          : _trackKeys[0];
      console.log("ctrack key", cTrackKey);

      setTrackKey(cTrackKey);
      _highscoreDict[cTrackKey];
      const newNumberOfLapKeys = _highscoreDict[cTrackKey]
        ? Object.keys(_highscoreDict[cTrackKey])
        : [];

      const storageNumberOfLapsKey = window.localStorage.getItem(
        "highscoreNumberOfLapsKey"
      );

      const cNumberOfLapsKey =
        storageNumberOfLapsKey &&
        _highscoreDict[cTrackKey] &&
        storageNumberOfLapsKey in _highscoreDict[cTrackKey]
          ? storageNumberOfLapsKey
          : newNumberOfLapKeys[0];

      setNumberOfLapsKey(cNumberOfLapsKey);

      setNumberOfLapsKeys(newNumberOfLapKeys);

      setHighscoreDict(_highscoreDict);
      setTrackKeys(_trackKeys);

      setHighscoreHasLoaded(true);
    });
  }, []);

  const getOrderedArrayFromDict = (): IEndOfRaceInfoPlayer[] => {
    if (highscoreDict === undefined) return [];
    console.log("highscore dict", highscoreDict);
    const d: { [userId: string]: IEndOfRaceInfoPlayer } =
      highscoreDict[trackKey][numberOfLapsKey];
    const arr: IEndOfRaceInfoPlayer[] = [];
    const userIds = Object.keys(d);
    for (let id of userIds) {
      arr.push(d[id]);
    }

    arr.sort((a, b) => a.totalTime - b.totalTime);
    return arr;
  };

  /** use window.localStorage to remember what user was looking at */
  console.log("highscore dict", highscoreDict);
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography component="div" variant="h3">
            Highscores
          </Typography>
        </Grid>
        {/* <Grid item xs={12}>
          <Link to={frontPagePath}>Back to front page</Link>
        </Grid> */}
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
              <FormControl fullWidth>
                <InputLabel>Track name</InputLabel>
                <Select
                  label="    Track name"
                  onChange={(e) => {
                    const newTrackKey = e.target.value;
                    setTrackKey(newTrackKey);

                    const newNumberOfLapKeys = Object.keys(
                      highscoreDict[newTrackKey]
                    );

                    if (!(numberOfLapsKey in highscoreDict[newTrackKey])) {
                      setNumberOfLapsKey(newNumberOfLapKeys[0]);
                    }
                    setNumberOfLapsKeys(newNumberOfLapKeys);
                    window.localStorage.setItem(
                      "highscoreTrackKey",
                      newTrackKey
                    );
                  }}
                  style={{
                    minWidth: 100,

                    backgroundColor: inputBackgroundColor,
                  }}
                  value={trackKey}
                >
                  {trackKeys.map((key) => (
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
                  value={numberOfLapsKey}
                  onChange={(e) => {
                    setNumberOfLapsKey(e.target.value);
                    window.localStorage.setItem(
                      "highscoreNumberOfLapsKey",
                      e.target.value
                    );
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

            {highscoreDict ? (
              <Grid item xs={12}>
                <TableContainer>
                  <Table
                    style={{
                      backgroundColor: cardBackgroundColor,
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        <TableCell component="th">Player name</TableCell>
                        <TableCell component="th">Total time</TableCell>
                        <TableCell component="th">Best lap time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!(numberOfLapsKey in highscoreDict[trackKey]) ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            No one has recorded with the combination of this
                            track and these number of laps
                          </TableCell>
                        </TableRow>
                      ) : (
                        getOrderedArrayFromDict().map((playerData, i) => {
                          return (
                            <HighscorePageTableRow
                              key={`${playerData.gameId}-${playerData.playerName}-${i}`}
                              playerData={playerData}
                            />
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Typography>No highscores available</Typography>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </AppContainer>
  );
};

export default HighscorePage;
