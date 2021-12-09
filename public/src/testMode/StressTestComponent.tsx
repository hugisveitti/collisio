import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { createSocketTest, removeSockets } from "./socketTests";
import StressTestRow, { IRoomConnection } from "./StressTestRow";

interface IStressTestComponent {}

export const StressTestComponent = (props: IStressTestComponent) => {
  const [numberOfMobiles, setNumberOfMobiles] = useState(1);
  const [roomConnections, setRoomConnections] = useState(
    [] as IRoomConnection[]
  );

  useEffect(() => {}, []);

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
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">Socket and server stress test</Typography>
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
          value={numberOfMobiles ? numberOfMobiles : ""}
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
        <Typography>Total number of rooms: {roomConnections.length}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography>Number of playing sockets: {playingSockets()}</Typography>
      </Grid>
      <Grid item xs={12}>
        <TableContainer>
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
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default StressTestComponent;
