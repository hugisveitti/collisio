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
  roomInfo: any;
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

        <TableCell>
          {getDateFromNumber(props.roomInfo.date.seconds * 1000)}
        </TableCell>
        <TableCell>{props.roomInfo.player?.id ?? "-"}</TableCell>
        <TableCell>{props.roomInfo.roomSettings?.trackName}</TableCell>
        <TableCell>{props.roomInfo.roomSettings?.numberOfLaps}</TableCell>
        <TableCell>{props.roomInfo.country}</TableCell>
        <TableCell>
          {props.roomInfo.mobileOnly ? "Mobile only" : "Keyboard"}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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

interface ISingleplayerDataTable {
  roomsInfo: IRoomInfo[];
}

const SingleplayerDataTable = (props: ISingleplayerDataTable) => {
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
            <TableCell component="th">Date</TableCell>
            <TableCell component="th">player id</TableCell>
            <TableCell component="th">Trackname</TableCell>
            <TableCell component="th">Number of laps</TableCell>
            <TableCell component="th">Country</TableCell>
            <TableCell component="th">Mobile only</TableCell>
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

export default SingleplayerDataTable;
