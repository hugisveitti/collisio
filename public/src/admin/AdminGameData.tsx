import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { IEndOfRaceInfoGame, IRoomInfo } from "../classes/Game";
import { auth } from "../firebase/firebaseInit";
import AdminGameDataTable from "./AdminGameDataTable";
import { calculateGamesDataStats } from "./statisticsFunctions";

const AdminGameData = () => {
  const [gamesData, setGamesData] = useState([] as IEndOfRaceInfoGame[]);
  const [gamesDataStats, setGamesDataStats] = useState([] as string[]);
  const [nGameEntires, setNGameEntires] = useState(5);
  const [gameCardOpen, setGameCardOpen] = useState(false);
  const [gameStatsOpen, setGameStatsOpen] = useState(false);

  const [sGamesData, setSGamesData] = useState([] as IEndOfRaceInfoGame[]);
  const [sGamesDataStats, setSGamesDataStats] = useState([] as string[]);
  const [nSGameEntires, setSNGameEntires] = useState(5);
  const [sGameCardOpen, setSGameCardOpen] = useState(false);
  const [sGameStatsOpen, setSGameStatsOpen] = useState(false);

  const [only24HourData, setOnly24HourData] = useState(false);
  const handleGetGameData = (singleplayer?: boolean) => {
    auth.currentUser.getIdToken().then((userTokenId) => {
      const options = {
        method: "GET",
      };

      fetch(
        `/game-data/${userTokenId}?n=${nGameEntires}&singleplayer=${!!singleplayer}`,
        options
      )
        .then((res) => res.json())
        .then((resData) => {
          if (resData.statusCode === 200) {
            const data = resData.data;
            const keys = Object.keys(data);
            const arr = [];
            for (let key of keys) {
              arr.push(data[key]);
            }

            arr.sort((a: IRoomInfo, b: IRoomInfo) =>
              a.date < b.date ? 1 : -1
            );

            if (!singleplayer) {
              setGamesData(arr as IEndOfRaceInfoGame[]);
              setGamesDataStats(calculateGamesDataStats(arr, only24HourData));
            } else {
              setSGamesData(arr as IEndOfRaceInfoGame[]);
              setSGamesDataStats(calculateGamesDataStats(arr, only24HourData));
            }
          } else if (resData.statusCode === 403) {
            toast.error("Unauthorized user");
            window.location.href = "/";
          }
        });
    });
  };

  return (
    <>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            header="Singleplayer Game data"
            title="Singleplayer Game data"
            subheader="See data about the singleplayer games"
            action={
              <IconButton onClick={() => setSGameCardOpen(!sGameCardOpen)}>
                {sGameCardOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />

          <CardContent>
            <Collapse in={sGameCardOpen}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography>
                    Games fetched: {sGamesData?.length ?? "-"}{" "}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={3}>
                  <Typography>
                    If not positive then will get all data
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={3}>
                  <TextField
                    type="number"
                    value={nSGameEntires ? nSGameEntires : ""}
                    onChange={(e) => setSNGameEntires(+e.target.value)}
                  />
                </Grid>
                <Grid item xs={4} sm={3}>
                  <Button
                    disableElevation
                    variant="contained"
                    onClick={() => handleGetGameData(true)}
                  >
                    Get singleplayer game data
                  </Button>
                </Grid>
                <Grid item xs={false} sm={3} />

                <Grid item xs={6} lg={3}>
                  <Button
                    variant="outlined"
                    onClick={() => setSGameStatsOpen(!sGameStatsOpen)}
                    startIcon={sGameStatsOpen ? <ExpandLess /> : <ExpandMore />}
                  >
                    Singleplayer Game data
                  </Button>
                </Grid>
                <Grid item xs={6} lg={9}>
                  <FormControlLabel
                    label="Only last 24 hours?"
                    control={
                      <Checkbox
                        checked={only24HourData}
                        onChange={() => {
                          setOnly24HourData(!only24HourData);
                          setSGamesDataStats(
                            calculateGamesDataStats(sGamesData, !only24HourData)
                          );
                        }}
                      />
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Collapse in={sGameStatsOpen}>
                    {sGamesDataStats.map((stats, i) => {
                      return (
                        <Typography key={`gamestas-${i}`}>{stats}</Typography>
                      );
                    })}
                  </Collapse>
                </Grid>

                <Grid item xs={12}>
                  <AdminGameDataTable gamesData={sGamesData} />
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            header="Game data"
            title="Game data"
            subheader="See data about the games"
            action={
              <IconButton onClick={() => setGameCardOpen(!gameCardOpen)}>
                {gameCardOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />

          <CardContent>
            <Collapse in={gameCardOpen}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography>
                    Games fetched: {gamesData?.length ?? "-"}{" "}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={3}>
                  <Typography>
                    If not positive then will get all data
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={3}>
                  <TextField
                    type="number"
                    value={nGameEntires ? nGameEntires : ""}
                    onChange={(e) => setNGameEntires(+e.target.value)}
                  />
                </Grid>
                <Grid item xs={4} sm={3}>
                  <Button
                    disableElevation
                    variant="contained"
                    onClick={() => handleGetGameData(false)}
                  >
                    Get game data
                  </Button>
                </Grid>
                <Grid item xs={false} sm={3} />

                <Grid item xs={6} lg={3}>
                  <Button
                    variant="outlined"
                    onClick={() => setGameStatsOpen(!gameStatsOpen)}
                    startIcon={gameStatsOpen ? <ExpandLess /> : <ExpandMore />}
                  >
                    Game data
                  </Button>
                </Grid>
                <Grid item xs={6} lg={9}>
                  <FormControlLabel
                    label="Only last 24 hours?"
                    control={
                      <Checkbox
                        checked={only24HourData}
                        onChange={() => {
                          setOnly24HourData(!only24HourData);
                          setGamesDataStats(
                            calculateGamesDataStats(gamesData, !only24HourData)
                          );
                        }}
                      />
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Collapse in={gameStatsOpen}>
                    {gamesDataStats.map((stats, i) => {
                      return (
                        <Typography key={`gamestas-${i}`}>{stats}</Typography>
                      );
                    })}
                  </Collapse>
                </Grid>

                <Grid item xs={12}>
                  <AdminGameDataTable gamesData={gamesData} />
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};

export default AdminGameData;
