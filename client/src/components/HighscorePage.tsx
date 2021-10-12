import {
  CircularProgress,
  Collapse,
  FormControl,
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
} from "@mui/material";
import React, { useEffect, useState } from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Link } from "react-router-dom";
import { getHighscore } from "../firebase/firebaseFunctions";
import HighscorePageTableRow from "./HighscorePageTableRow";
import { frontPagePath } from "./Routes";

interface IHighscorePage {}

const HighscorePage = (props: IHighscorePage) => {
  const [numberOfLapsKeys, setNumberOfLapsKeys] = useState([]);
  const [trackKeys, setTrackKeys] = useState([]);
  const [numberOfLapsKey, setNumberOfLapsKey] = useState("");
  const [trackKey, setTrackKey] = useState("");

  const [highscoreDict, setHighscoreDict] = useState(undefined);
  const [highscoreHasLoaded, setHighscoreHasLoaded] = useState(false);

  useEffect(() => {
    getHighscore((_highscoreDict, _trackKeys, _numberOfLapsKeys) => {
      setNumberOfLapsKey(_numberOfLapsKeys[0]);
      setTrackKey(_trackKeys[0]);

      setHighscoreDict(_highscoreDict);
      setNumberOfLapsKeys(_numberOfLapsKeys);
      setTrackKeys(_trackKeys);

      setHighscoreHasLoaded(true);
    });
  }, []);

  return (
    <div
      style={{
        width: "80%",
        margin: "auto",
        marginTop: 15,
        padding: 15,
      }}
    >
      <h1>Highscores</h1>
      <Link to={frontPagePath}>Back to front page</Link>

      {!highscoreHasLoaded || highscoreDict === undefined ? (
        <div
          style={{
            marginTop: 25,
            textAlign: "center",
          }}
        >
          <CircularProgress />
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: 25,
              marginBottom: 15,
            }}
          >
            <FormControl>
              <InputLabel>No. laps</InputLabel>
              <Select
                label="Number of laps"
                style={{
                  minWidth: 100,
                }}
                defaultValue={numberOfLapsKeys[0]}
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
            <FormControl>
              <InputLabel>Track name</InputLabel>
              <Select
                label="Track name"
                onChange={(e) => {
                  setTrackKey(e.target.value);
                }}
                style={{
                  minWidth: 100,
                  marginLeft: 15,
                }}
                defaultValue={trackKeys[0]}
              >
                {trackKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Each track and number of laps has its own highscore table">
              <IconButton>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          </div>

          <TableContainer component={Paper} style={{}}>
            <Table>
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
                      No one has recorded with the combination of this track and
                      these number of laps
                    </TableCell>
                  </TableRow>
                ) : (
                  highscoreDict[trackKey][numberOfLapsKey].map(
                    (playerData, i) => (
                      <HighscorePageTableRow
                        key={`${playerData.gameId}-${playerData.playerName}-${i}`}
                        playerData={playerData}
                      />
                    )
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
};

export default HighscorePage;
