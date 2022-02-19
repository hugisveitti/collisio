import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { IEndOfRaceInfoGame, IRoomInfo } from "../classes/Game";
import { auth, signOut } from "../firebase/firebaseInit";
import RoomDataTable from "./RoomDataTable";
import AdminGameDataTable from "./AdminGameDataTable";
import StressTestComponent from "../testMode/StressTestComponent";
import { calculateGamesDataStats } from "./statisticsFunctions";
import CreatedRoomsDataTable from "./CreatedRoomsDataTable";

interface IAdminComponent {
  userTokenId: string;
  connectionData: { [key: string]: any };
}

const AdminComponent = (props: IAdminComponent) => {
  const [roomsInfo, setRoomsInfo] = useState([]);
  const [createdRoomsInfo, setCreatedRoomsInfo] = useState([]);
  const [nRoomEntires, setNRoomEntires] = useState(5);
  const [roomCardOpen, setRoomCardOpen] = useState(false);
  const [createdRoomsCardOpen, setCreatedRoomCardOpen] = useState(false);

  const [gamesData, setGamesData] = useState([] as IEndOfRaceInfoGame[]);
  const [gamesDataStats, setGamesDataStats] = useState([] as string[]);
  const [nGameEntires, setNGameEntires] = useState(5);
  const [gameCardOpen, setGameCardOpen] = useState(false);
  const [gameStatsOpen, setGameStatsOpen] = useState(false);

  const [stressCardOpen, setStressCardOpen] = useState(false);

  const [only24HourData, setOnly24HourData] = useState(false);

  const handleGetRoomData = (useCreatedRooms?: boolean) => {
    auth.currentUser.getIdToken().then((userTokenId) => {
      const options = {
        method: "GET",
      };

      let url = `/room-data/${userTokenId}?n=${nRoomEntires}&useCreatedRooms=${!!useCreatedRooms}`;

      fetch(url, options)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.statusCode === 200) {
            const data = resData.data;

            const keys = Object.keys(data);
            const arr = [];
            for (let key of keys) {
              arr.push(data[key]);
            }

            // arr.sort((a: IEndOfRaceInfoGame, b: IEndOfRaceInfoGame) =>
            //   a.date < b.date ? 1 : -1
            // );
            if (useCreatedRooms) {
              setCreatedRoomsInfo(arr);
            } else {
              setRoomsInfo(arr);
            }
          } else if (resData.statusCode === 403) {
            toast.error("Unauthorized user");
            window.location.href = "/";
          }
        });
    });
  };

  const handleGetGameData = () => {
    auth.currentUser.getIdToken().then((userTokenId) => {
      const options = {
        method: "GET",
      };

      fetch(`/game-data/${userTokenId}?n=${nGameEntires}`, options)
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
            setGamesData(arr as IEndOfRaceInfoGame[]);
            setGamesDataStats(calculateGamesDataStats(arr, only24HourData));
          } else if (resData.statusCode === 403) {
            toast.error("Unauthorized user");
            window.location.href = "/";
          }
        });
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Button
          disableElevation
          variant="contained"
          onClick={() =>
            signOut(() => {
              window.location.href = "/";
            })
          }
        >
          Logout
        </Button>
      </Grid>
      <Grid item xs={12}>
        <ul>
          {Object.keys(props.connectionData).map((key) => {
            return (
              <ul key={key}>
                <span>{key}:</span> <span>{props.connectionData[key]}</span>
              </ul>
            );
          })}
        </ul>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            header="Room data"
            title="Room data"
            subheader="See data about the rooms"
            action={
              <IconButton onClick={() => setRoomCardOpen(!roomCardOpen)}>
                {roomCardOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />

          <CardContent>
            <Collapse in={roomCardOpen}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography>
                    Rooms fetched: {roomsInfo?.length ?? "-"}{" "}
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
                    value={nRoomEntires ? nRoomEntires : ""}
                    onChange={(e) => setNRoomEntires(+e.target.value)}
                  />
                </Grid>
                <Grid item xs={4} sm={3}>
                  <Button
                    disableElevation
                    variant="contained"
                    onClick={() => handleGetRoomData(false)}
                  >
                    Get room data
                  </Button>
                </Grid>
                <Grid item xs={false} sm={3} />

                <Grid item xs={12}>
                  <RoomDataTable roomsInfo={roomsInfo} />
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            header="Created Rooms data"
            title="Created Rooms data"
            subheader="See data about the rooms"
            action={
              <IconButton
                onClick={() => setCreatedRoomCardOpen(!createdRoomsCardOpen)}
              >
                {createdRoomsCardOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />

          <CardContent>
            <Collapse in={createdRoomsCardOpen}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography>
                    Created Rooms fetched: {createdRoomsInfo?.length ?? "-"}{" "}
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
                    value={nRoomEntires ? nRoomEntires : ""}
                    onChange={(e) => setNRoomEntires(+e.target.value)}
                  />
                </Grid>
                <Grid item xs={4} sm={3}>
                  <Button
                    disableElevation
                    variant="contained"
                    onClick={() => handleGetRoomData(true)}
                  >
                    Created rooms data
                  </Button>
                </Grid>
                <Grid item xs={false} sm={3} />

                <Grid item xs={12}>
                  <CreatedRoomsDataTable roomsInfo={createdRoomsInfo} />
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
                    onClick={handleGetGameData}
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

      <Grid item xs={12}>
        <Card>
          <CardHeader
            header="Stress test"
            title="Stress test"
            subheader="Do a stress test"
            action={
              <IconButton onClick={() => setStressCardOpen(!gameCardOpen)}>
                {stressCardOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />

          <CardContent>
            <Collapse in={stressCardOpen}>
              <StressTestComponent />
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AdminComponent;
