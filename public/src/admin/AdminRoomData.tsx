import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { auth } from "../firebase/firebaseInit";
import CreatedRoomsDataTable from "./CreatedRoomsDataTable";
import SingleplayerDataTable from "./SingleplayerDataTable";

const AdminRoomData = () => {
  const [singleplayerInfo, setSingleplayerInfo] = useState([]);
  const [createdRoomsInfo, setCreatedRoomsInfo] = useState([]);
  const [nRoomEntires, setNRoomEntires] = useState(5);
  const [singleplayerCardOpen, setSingleplayerCardOpen] = useState(false);
  const [createdRoomsCardOpen, setCreatedRoomCardOpen] = useState(false);

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
            console.log("got arr, useCreatedRooms:", useCreatedRooms, arr);
            if (useCreatedRooms) {
              setCreatedRoomsInfo(arr);
            } else {
              setSingleplayerInfo(arr);
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
            header="Singleplayer data"
            title="Singleplayer data"
            subheader="See data about the started singleplayer games"
            action={
              <IconButton
                onClick={() => setSingleplayerCardOpen(!singleplayerCardOpen)}
              >
                {singleplayerCardOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />
          <CardContent>
            <Collapse in={singleplayerCardOpen}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography>
                    Rooms fetched: {singleplayerInfo?.length ?? "-"}{" "}
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
                    Get singleplayer data
                  </Button>
                </Grid>
                <Grid item xs={false} sm={3} />

                <Grid item xs={12}>
                  <SingleplayerDataTable roomsInfo={singleplayerInfo} />
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};

export default AdminRoomData;
