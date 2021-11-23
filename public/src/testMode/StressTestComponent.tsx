import { DeleteForever } from "@mui/icons-material";
import {
  Button,
  Divider,
  Grid,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import AppContainer from "../containers/AppContainer";
import { createSocketTest, removeSockets } from "./socketTests";
import StressTestRow, { IRoomConnection } from "./StressTestRow";

interface IStressTestComponent {
  socket: Socket;
}

export const StressTestComponent = (props: IStressTestComponent) => {
  const [numberOfMobiles, setNumberOfMobiles] = useState(1);
  const [roomConnections, setRoomConnections] = useState(
    [] as IRoomConnection[]
  );

  useEffect(() => {
    props.socket.disconnect();
  }, []);

  const removeRoom = (conenction: IRoomConnection) => {
    const idx = roomConnections.indexOf(conenction);
    removeSockets(
      roomConnections[idx].desktopSocket,
      roomConnections[idx].mobileSockets
    );

    const left = roomConnections.slice(0, idx);
    const right = roomConnections.slice(idx + 1);
    setRoomConnections(left.concat(right));
  };

  const playingSockets = () => {
    let count = 0;
    for (let c of roomConnections) {
      if (c.isPlaying) {
        count += 1 + c.mobileSockets.length;
      }
    }
    return count;
  };

  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <h2>Socket and server stress test</h2>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            onClick={() =>
              createSocketTest(
                numberOfMobiles,
                (roomId, desktopSocket, mobileSockets) => {
                  setRoomConnections(
                    roomConnections.concat([
                      { roomId, desktopSocket, mobileSockets },
                    ])
                  );
                }
              )
            }
          >
            Create Test
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            value={numberOfMobiles}
            type="number"
            onChange={(e) => setNumberOfMobiles(+e.target.value)}
            label="Number of mobiles"
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider variant="middle" />
        </Grid>
        <Grid item xs={12}>
          <Typography>
            Total number of rooms: {roomConnections.length}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Number of playing sockets: {playingSockets()}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Room id</TableCell>
                <TableCell>Number of mobiles</TableCell>
                <TableCell>Ping (ms)</TableCell>
                <TableCell>Max ping (ms)</TableCell>
                <TableCell>Avg ping (ms) over last 100</TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {roomConnections.map((connection) => (
                <StressTestRow
                  key={connection.roomId}
                  connection={connection}
                  removeRoom={removeRoom}
                />
              ))}
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default StressTestComponent;
