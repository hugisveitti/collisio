import { Timestamp } from "@firebase/firestore";
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

interface ICreatedRoomInfo {
  userId: string;
  geo: {
    country: string;
  };
  date: Timestamp;
  roomId: string;
}

interface IRoomInfoRow {
  roomInfo: ICreatedRoomInfo;
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
        <TableCell>
          {getDateFromNumber(props.roomInfo.date.seconds * 1000)}
        </TableCell>
        <TableCell>{props.roomInfo.userId}</TableCell>
        <TableCell>
          {props.roomInfo.geo?.country ?? "unknown country"}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open}>
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

interface ICreatedRoomsDataTable {
  roomsInfo: ICreatedRoomInfo[];
}

const CreatedRoomsDataTable = (props: ICreatedRoomsDataTable) => {
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
            <TableCell>UserId</TableCell>
            <TableCell>Country</TableCell>
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

export default CreatedRoomsDataTable;
