import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import React from "react";
import { IRoomInfo } from "../classes/Game";
import { inputBackgroundColor } from "../providers/theme";
import { getDateFromNumber } from "../utils/utilFunctions";

interface IRoomInfoRow {
  roomInfo: IRoomInfo;
}

const RoomInfoRow = (props: IRoomInfoRow) => {
  return (
    <TableRow>
      <TableCell>{props.roomInfo.roomId}</TableCell>
      <TableCell>{getDateFromNumber(props.roomInfo.date)}</TableCell>
      <TableCell>{props.roomInfo.players?.length ?? "-"}</TableCell>
      <TableCell>
        {props.roomInfo.players?.length > 0
          ? props.roomInfo.players[0].playerName
          : "No leader"}
      </TableCell>
      <TableCell>{props.roomInfo.canceledGame ? "Yes" : "No"}</TableCell>
      <TableCell>{props.roomInfo.gameSettings.trackName}</TableCell>
      <TableCell>{props.roomInfo.gameSettings.numberOfLaps}</TableCell>
    </TableRow>
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
            <TableCell>RoomId</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Number of players</TableCell>
            <TableCell>Leader</TableCell>
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
