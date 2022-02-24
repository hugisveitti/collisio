import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import React, { useState } from "react";
import { IRoomInfo } from "../classes/Game";
import { getDateFromNumber } from "../utils/utilFunctions";

interface IRoomInfoRow {
  roomInfo: IRoomInfo;
}

const RoomInfoRow = (props: IRoomInfoRow) => {
  const [open, setOpen] = useState(false);

  const keys = Object.keys(props.roomInfo);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
        <TableCell>{props.roomInfo.roomId}</TableCell>
        <TableCell>{getDateFromNumber(props.roomInfo.date)}</TableCell>
        <TableCell>{props.roomInfo.players?.length ?? "-"}</TableCell>
        <TableCell>{props.roomInfo.canceledGame ? "Yes" : "No"}</TableCell>
        <TableCell>{props.roomInfo.roomSettings?.trackName}</TableCell>
        <TableCell>{props.roomInfo.roomSettings?.numberOfLaps}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open}>
            <div>
              {props.roomInfo.players.map((p) => (
                <div key={p.id}>
                  id:{p.id} name:{p.playerName}
                </div>
              ))}
            </div>
            <List>
              {keys.map((k) => {
                if (typeof props.roomInfo[k] === "object") {
                  return null;
                }
                return (
                  <ListItem key={k}>
                    <ListItemText
                      secondary={k}
                      primary={props.roomInfo[k].toString()}
                    />
                  </ListItem>
                );
              })}
            </List>
            <Divider variant="middle" />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

interface IRoomDataTable {
  roomsInfo: IRoomInfo[];
}

const RoomDataTable = (props: IRoomDataTable) => {
  return (
    <TableContainer
      component={Paper}
      style={{
        // backgroundColor: inputBackgroundColor,
        boxShadow: "none",
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>RoomId</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Number of players</TableCell>
            <TableCell>Game cancelled</TableCell>
            <TableCell>Trackname</TableCell>
            <TableCell>Number of laps</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.roomsInfo.map((info) => (
            <RoomInfoRow roomInfo={info} key={info.roomId} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RoomDataTable;
