import {
  ListItemButton,
  ListItemText,
  List,
  ListItem,
  Button,
  Typography,
} from "@mui/material";
import { off } from "firebase/database";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  AvailableRoomsFirebaseObject,
  createAvailableRoomsListeners,
} from "../firebase/firebaseFunctions";
import { IStore } from "./store";

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
    const availRoomListener = createAvailableRoomsListeners(
      props.userId,
      (_availRooms) => setAvailRoomIds(_availRooms)
    );

    return () => {
      off(availRoomListener);
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
