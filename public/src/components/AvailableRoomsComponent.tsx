import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { off } from "firebase/database";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";

import { IStore } from "./store";
import {
  createAvailableRoomsListeners,
  AvailableRoomsFirebaseObject,
} from "../firebase/firestoreFunctions";
import { Unsubscribe } from "@firebase/firestore";

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

  useEffect(() => {
    let unsubRoomListener: Unsubscribe;
    createAvailableRoomsListeners(props.userId, (_availRooms) =>
      setAvailRoomIds(_availRooms)
    ).then((sub) => {
      unsubRoomListener = sub;
    });

    return () => {
      if (unsubRoomListener) {
        unsubRoomListener();
      }
    };
  }, [props.userId]);

  return (
    <React.Fragment>
      {availRoomIds.length > 0 && (
        <Typography color="textInfo">Available rooms</Typography>
      )}
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
    </React.Fragment>
  );
};

export default AvailableRoomsComponent;
