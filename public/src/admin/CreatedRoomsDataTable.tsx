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
  extraData: any;
}

interface IRoomInfoRow {
  roomInfo: ICreatedRoomInfo;
}

const RoomInfoRow = (props: IRoomInfoRow) => {
  const [open, setOpen] = useState(false);

  const extraData = props.roomInfo?.extraData ?? {};
  const keys = Object.keys(extraData);
  const multiplayer = extraData?.multiplayer;
  const players = extraData?.players ?? [];
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
          {multiplayer
            ? extraData.players?.[0]?.geo?.country ?? "unknown country"
            : extraData.geoIp?.geo?.country ?? "unknown country"}
        </TableCell>
        <TableCell>{extraData.players?.length ?? 0}</TableCell>
        <TableCell>{multiplayer ? "Multiplayer" : "Split screen"}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open}>
            <List>
              {keys.map((k) => {
                if (typeof extraData[k] === "object") {
                  return null;
                }
                return (
                  <ListItem key={k}>
                    <ListItemText
                      secondary={k}
                      primary={extraData[k].toString()}
                    />
                  </ListItem>
                );
              })}
            </List>
            <Divider variant="middle" />
            {players.map((p: any) => {
              const pKeys = Object.keys(p);
              return (
                <React.Fragment key={p.id}>
                  <div>
                    {pKeys.map((k) => {
                      if (typeof p[k] === "object") {
                        return null;
                      }
                      return (
                        <span key={k}>
                          <strong> {k}:</strong>{" "}
                          <span style={{ marginRight: 15 }}>
                            {p[k].toString()}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  <Divider variant="middle" />
                </React.Fragment>
              );
            })}
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
  console.log("props", props);
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
            <TableCell>Number of player</TableCell>
            <TableCell>Mutliplayer</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.roomsInfo.map((info, i) => (
            <RoomInfoRow roomInfo={info} key={`${info.roomId}-${i}`} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CreatedRoomsDataTable;
