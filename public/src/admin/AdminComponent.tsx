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
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { IEndOfRaceInfoGame, IRoomInfo } from "../classes/Game";
import { auth, signOut } from "../firebase/firebaseInit";
import RoomDataTable from "./RoomDataTable";
import GameDataTable from "./GameDataTable";
import StressTestComponent from "../testMode/StressTestComponent";

interface IAdminComponent {
  userTokenId: string;
}

const AdminComponent = (props: IAdminComponent) => {
  const [roomsInfo, setRoomsInfo] = useState([]);
  const [nRoomEntires, setNRoomEntires] = useState(0);
  const [roomCardOpen, setRoomCardOpen] = useState(false);

  const [gamesData, setGamesData] = useState([]);
  const [nGameEntires, setNGameEntires] = useState(0);
  const [gameCardOpen, setGameCardOpen] = useState(false);

  const [stressCardOpen, setStressCardOpen] = useState(false);

  const handleGetRoomData = () => {
    auth.currentUser.getIdToken().then((userTokenId) => {
      const options = {
        method: "GET",
      };

      fetch(`/room-data/${userTokenId}?n=${nRoomEntires}`, options)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.statusCode === 200) {
            const data = resData.data;
            console.log("res data", data);
            const keys = Object.keys(data);
            const arr = [];
            for (let key of keys) {
              arr.push(data[key]);
            }

            arr.sort((a: IEndOfRaceInfoGame, b: IEndOfRaceInfoGame) =>
              a.date < b.date ? 1 : -1
            );
            setRoomsInfo(arr);
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
            setGamesData(arr);
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
                    onClick={handleGetRoomData}
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

                <Grid item xs={12}>
                  <GameDataTable gamesData={gamesData} />
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
