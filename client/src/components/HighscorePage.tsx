import {
  CircularProgress,
  Collapse,
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
} from "@mui/material";
import React, { useEffect, useState } from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Link } from "react-router-dom";
import { getHighscore } from "../firebase/firebaseFunctions";
import HighscorePageTableRow from "./HighscorePageTableRow";
import { frontPagePath } from "./Routes";
import AppContainer from "../containers/AppContainer";
import "../styles/main.css";

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
    <AppContainer>
      <div style={{}} className="container">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h1>Highscores</h1>
          </Grid>
          <Grid item xs={12}>
            <Link to={frontPagePath}>Back to front page</Link>
          </Grid>
          {!highscoreHasLoaded || highscoreDict === undefined ? (
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
              <Grid item xs={5} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>No. laps</InputLabel>
                  <Select
                    label="Number of laps"
                    style={{
                      minWidth: 100,
                      backgroundColor: "wheat",
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
              </Grid>
              <Grid item xs={5} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Track name</InputLabel>
                  <Select
                    label="Track name"
                    onChange={(e) => {
                      setTrackKey(e.target.value);
                    }}
                    style={{
                      minWidth: 100,
                      marginLeft: 15,
                      backgroundColor: "wheat",
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
              </Grid>
              <Grid item xs={2} sm={2}>
                <Tooltip title="Each track and number of laps combination has its own highscore table.">
                  <IconButton>
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Grid>

              <Grid item xs={false} sm={4} />

              <Grid item xs={12}>
                <TableContainer component={Paper} style={{}}>
                  <Table
                    style={{
                      backgroundColor: "wheat",
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
              </Grid>
            </>
          )}
        </Grid>
      </div>
    </AppContainer>
  );
};

export default HighscorePage;
