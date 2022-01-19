import Refresh from "@mui/icons-material/Refresh";
import { CardContent } from "@mui/material";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import {
  AvailableRoomsFirebaseObject,
  getAllAvailableRooms,
} from "../firebase/firestoreFunctions";
import BackdropButton from "./button/BackdropButton";
import MyCard from "./card/MyCard";
import { IStore } from "./store";

interface IAvailableRoomsComponent {
  userId: string;
  store: IStore;
  connectButtonClicked: (roomId: string) => void;
}

const AvailableRoomsComponent = (props: IAvailableRoomsComponent) => {
  const [availRoomIds, setAvailRoomIds] = useState(
    [] as AvailableRoomsFirebaseObject[]
  );

  const [gettingRooms, setGettingRooms] = useState(true);

  const handleGetAllAvailableRooms = async () => {
    setGettingRooms(true);
    const p = getAllAvailableRooms(props.userId)
      .then((allRooms) => {
        setAvailRoomIds(allRooms);
        setGettingRooms(false);
      })
      .catch(() => {
        setGettingRooms(false);
        toast.error("Error getting rooms");
      });
  };

  useEffect(() => {
    if (!props.userId) return;
    handleGetAllAvailableRooms();
  }, [props.userId]);

  return (
    <MyCard>
      <CardContent>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <BackdropButton
              onClick={() => handleGetAllAvailableRooms()}
              startIcon={<Refresh />}
              disabled={gettingRooms}
            >
              Get available rooms
            </BackdropButton>
          </Grid>
          {gettingRooms ? (
            <>
              <Grid item xs={12}>
                <CircularProgress />
              </Grid>
            </>
          ) : (
            <>
              {availRoomIds.length > 0 ? (
                <Grid item xs={12}>
                  <Typography color="textInfo">Available rooms</Typography>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Typography color="textInfo">No rooms available</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <List>
                  {availRoomIds.map((availRoom) => {
                    return (
                      <ListItem key={availRoom.roomId}>
                        <ListItemText
                          style={{ textAlign: "center" }}
                          primary={availRoom.displayName}
                        />
                        <ListItemText
                          style={{ textAlign: "center" }}
                          primary={availRoom.roomId}
                        />
                        <ListItemButton
                          style={{ textAlign: "center" }}
                          onClick={() => {
                            props.store.setRoomId(availRoom.roomId);
                            props.connectButtonClicked(availRoom.roomId);
                          }}
                        >
                          <BackdropButton>Join</BackdropButton>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </MyCard>
  );
};

export default AvailableRoomsComponent;
