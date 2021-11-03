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
import { waitingRoomPath } from "./Routes";

interface IAvailableRoomsComponent {
  userId: string;
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
                  history.push(waitingRoomPath + "/" + availRoom.roomId);
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
