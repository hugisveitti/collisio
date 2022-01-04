import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";

import { IStore } from "./store";
import {
  create10AvailableRoomsListeners,
  AvailableRoomsFirebaseObject,
  getAllAvailableRooms,
} from "../firebase/firestoreFunctions";
import { Unsubscribe } from "@firebase/firestore";
import { CircularProgress, Grid, IconButton } from "@mui/material";
import Refresh from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";

interface IAvailableRoomsComponent {
  userId: string;
  store: IStore;
  connectButtonClicked: (roomId: string) => void;
}

const AvailableRoomsComponent = (props: IAvailableRoomsComponent) => {
  const history = useHistory();
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
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Button
          onClick={() => handleGetAllAvailableRooms()}
          startIcon={<Refresh />}
          variant="contained"
          disableElevation
          disabled={gettingRooms}
        >
          Get available rooms
        </Button>
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
                      <Button variant="outlined">Join</Button>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default AvailableRoomsComponent;
