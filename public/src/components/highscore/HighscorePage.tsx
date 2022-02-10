import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TablePagination from "@mui/material/TablePagination";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import {
  IEndOfRaceInfoPlayer,
  nonActiveTrackNames,
  numberOfLapsPossibilities,
} from "../../classes/Game";
import { getBestScoresOnTrackAndLap } from "../../firebase/firestoreGameFunctions";
import { getStyledColors } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import { TrackName } from "../../shared-backend/shared-stuff";
import "../../styles/main.css";
import BackdropContainer from "../backdrop/BackdropContainer";
import NumberSelect from "../inputs/NumberSelect";
import "../inputs/select.css";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import TrackSelect from "../trackSelectContainer/TrackSelect";
import HighscoreTable from "./HighscoreTable";

interface IHighscorePage {}

let nextStartTotalTime = 0;
let startTotalTimes = [];
const HighscorePage = (props: IHighscorePage) => {
  // const [numberOfLapsKeys, setNumberOfLapsKeys] = useState([]);
  const [numberOfLapsKey, setNumberOfLapsKey] = useState(2);
  const [trackKey, setTrackKey] = useState("");

  const [highscoreHasLoaded, setHighscoreHasLoaded] = useState(false);

  const [highscoreList, setHighscoreList] = useState(
    [] as IEndOfRaceInfoPlayer[]
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const user = useContext(UserContext);

  useEffect(() => {
    const storageTrackKey = window.localStorage.getItem("highscoreTrackKey");
    const storageNumberOfLapsKey =
      window.localStorage.getItem("numberOfLapsKey");
    if (storageTrackKey) {
      setTrackKey(storageTrackKey as TrackName);
    }
    if (storageNumberOfLapsKey && !isNaN(+storageNumberOfLapsKey)) {
      setNumberOfLapsKey(+storageNumberOfLapsKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("highscoreTrackKey", trackKey);

    setHighscoreHasLoaded(false);
    setPage(0);
    const startTotalTime = 0;

    getBestScoresOnTrackAndLap(
      trackKey,
      numberOfLapsKey,
      startTotalTime,
      rowsPerPage
    ).then((data) => {
      setHighscoreHasLoaded(true);

      setHighscoreList(data);
      if (data?.length) {
        startTotalTimes = [0];
        nextStartTotalTime = data[data.length - 1].totalTime + 0.01;
      }
    });
  }, [trackKey, numberOfLapsKey]);

  const handleChangePage = (
    event: unknown,
    newPage: number,
    _rowsPerPage?: number
  ) => {
    let rpp = _rowsPerPage ?? rowsPerPage;

    let startTime = 0;
    if (newPage > page) {
      startTime = nextStartTotalTime + 0.01;
    } else {
      const newStartTotalTimes = startTotalTimes;
      startTime = startTotalTimes[newPage];
    }

    setPage(newPage);

    getBestScoresOnTrackAndLap(trackKey, numberOfLapsKey, startTime, rpp).then(
      (data) => {
        setHighscoreList(data);
        if (data?.length) {
          if (newPage > page) {
            startTotalTimes[newPage] = data[0].totalTime;
          }
          nextStartTotalTime = data[data.length - 1].totalTime + 0.01;
        }
      }
    );
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRpp = parseInt(event.target.value, 10);
    setRowsPerPage(newRpp);
    setPage(0);
    handleChangePage(null, 0, newRpp);
  };

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
                simpleSelect
              />
            </Grid>

            <Grid item xs={9} sm={3}>
              <NumberSelect
                title="No. of laps"
                value={numberOfLapsKey}
                numbers={numberOfLapsPossibilities}
                onChange={(val) => {
                  setNumberOfLapsKey(val);
                }}
                style={{
                  backgroundColor,
                }}
              />
              {/* <span style={{ display: "block", color: backgroundColor }}>
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
              </FormControl> */}
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
              <TablePagination
                page={page}
                count={-1}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[1, 2, 5, 10, 15, 25, 50]}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                component="div"
                nextIconButtonProps={{
                  disabled: highscoreList?.length === 0,
                }}
                style={{
                  color,
                  backgroundColor,
                }}
              />
              <HighscoreTable
                data={highscoreList}
                noDataText="No one has recorded with the combination of this
                track and these number of laps"
                user={user}
                page={page}
                rowsPerPage={rowsPerPage}
              />
            </Grid>
          </>
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default HighscorePage;
