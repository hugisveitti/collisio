import DeleteForever from "@mui/icons-material/DeleteForever";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import LinePlotComponent from "../data/LinePlotComponent";
import { startSocketTest } from "./socketTests";
import { std_room_created_callback } from "../shared-backend/shared-stuff";

export interface IRoomConnection {
  roomId: string;
  desktopSocket: Socket;
  mobileSockets: Socket[];
  isPlaying?: boolean;
}

interface IStressTestRow {
  connection: IRoomConnection;
  removeRoom: (connection: IRoomConnection) => void;
}

const maxPingsLength = 100;
const StressTestRow = (props: IStressTestRow) => {
  const [ping, setPing] = useState(0);
  const [maxPing, setMaxPing] = useState(0);
  const [avgPing, setAvgPing] = useState(0);
  const [pings, setPings] = useState(
    new Array(maxPingsLength).fill(0) as number[]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let sumP = 0;
    let count = 0;
    for (let p of pings) {
      if (p !== 0) {
        sumP += p;
        count += 1;
      }
    }
    if (count !== 0) {
      setAvgPing(sumP / count);
    }

    setMaxPing(Math.max(maxPing, ping));
    if (pings.length >= maxPingsLength) {
      const newPings = [ping].concat(pings);
      newPings.splice(maxPingsLength, 1);
      setPings(newPings);
    } else {
      const newPings = pings;
      newPings.unshift(ping);
      setPings(newPings);
    }
  }, [ping]);

  useEffect(() => {
    props.connection.desktopSocket.on("disconnect", () => {
      console.log("socket disconencted", props.connection.roomId);
    });
  }, []);

  return (
    <>
      <TableRow key={props.connection.roomId}>
        <TableCell>
          <IconButton onClick={() => setOpen(!open)}>
            {!open ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </TableCell>
        <TableCell>
          <ListItemText primary={props.connection.roomId} />
        </TableCell>
        <TableCell>{props.connection.mobileSockets.length}</TableCell>
        <TableCell>{ping}</TableCell>
        <TableCell>{maxPing}</TableCell>
        <TableCell>{avgPing.toFixed(1)}</TableCell>
        <TableCell>
          <Button
            variant="outlined"
            // disabled={isPlaying}
            onClick={() => {
              if (!isPlaying) {
                setIsPlaying(true);
                props.connection.isPlaying = true;
                startSocketTest(
                  props.connection.desktopSocket,
                  props.connection.mobileSockets,
                  (_ping) => {
                    setPing(_ping);
                  }
                );
              }
            }}
          >
            Start test
          </Button>
        </TableCell>
        <TableCell>
          <IconButton
            onClick={() => {
              props.removeRoom(props.connection);
            }}
          >
            <DeleteForever />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open}>
            <LinePlotComponent
            // yMin={0}
            // yMax={150}
            // values={pings}
            // width={400}
            // height={200}
            // id={`${props.connection.roomId}_ping_plot`}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default StressTestRow;
