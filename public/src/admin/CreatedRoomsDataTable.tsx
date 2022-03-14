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

interface IObjectDivDisplay {
  obj: any;
}

const ObjectDivDisplay = (props: IObjectDivDisplay) => {
  const pKeys = Object.keys(props.obj);
  return (
    <React.Fragment>
      <div>
        {pKeys.map((k) => {
          if (typeof props.obj[k] === "object") {
            return null;
          }
          return (
            <span key={k + props.obj[k].toString()}>
              <strong> {k}:</strong>{" "}
              <span style={{ marginRight: 15 }}>{props.obj[k].toString()}</span>
            </span>
          );
        })}
      </div>
    </React.Fragment>
  );
};

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
  const dataCollection = extraData.dataCollection ?? {};
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
          {getDateFromNumber(extraData?.roomCreatedDate ?? 0)}
        </TableCell>
        <TableCell>
          {getDateFromNumber(extraData?.roomDeletedDate ?? 0)}
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
            <ObjectDivDisplay obj={dataCollection} />
            <List>
              {keys.map((k) => {
                if (typeof extraData[k] === "object") {
                  return null;
                }
                return (
                  <ListItem key={k}>
                    <ListItemText
                      secondary={extraData[k].toString()}
                      primary={k}
                    />
                  </ListItem>
                );
              })}
            </List>
            <Divider variant="middle" />
            {players.map((p: any) => {
              const pColl = { ...p.dataCollection, ...p.geo };
              return (
                <React.Fragment>
                  <ObjectDivDisplay obj={p} key={p.id} />
                  <div>Data collected</div>
                  <ObjectDivDisplay obj={pColl} key={p.id + "coll"} />
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
            <TableCell>Date created</TableCell>
            <TableCell>Date ended</TableCell>
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
