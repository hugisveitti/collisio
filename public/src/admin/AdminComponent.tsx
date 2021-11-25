import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import React from "react";
import Button from "@mui/material/Button";
import { signOut } from "../firebase/firebaseInit";
import { IRoomInfo } from "../classes/Game";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { inputBackgroundColor } from "../providers/theme";
import Paper from "@mui/material/Paper";

interface IRoomInfoRow {
  roomInfo: IRoomInfo;
}

const RoomInfoRow = (props: IRoomInfoRow) => {
  return (
    <TableRow>
      <TableCell>{props.roomInfo.roomId}</TableCell>
      <TableCell>{props.roomInfo.date}</TableCell>
      <TableCell>{props.roomInfo.players?.length ?? "-"}</TableCell>
      <TableCell>
        {props.roomInfo.players?.length > 0
          ? props.roomInfo.players[0].playerName
          : "No leader"}
      </TableCell>
      <TableCell>{props.roomInfo.canceledGame ? "Yes" : "No"}</TableCell>
    </TableRow>
  );
};

interface IAdminComponent {
  roomsInfo: IRoomInfo[];
}

const AdminComponent = (props: IAdminComponent) => {
  console.log("admin comp", props);
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography>Some admin stuff</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography>
          Total number of rooms: {props.roomsInfo?.length ?? "-"}{" "}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Button disableElevation variant="contained" onClick={() => signOut()}>
          Logout
        </Button>
      </Grid>
      <Grid item xs={12}>
        <TableContainer
          component={Paper}
          style={{
            backgroundColor: inputBackgroundColor,
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
              </TableRow>
            </TableHead>
            <TableBody>
              {props.roomsInfo.map((info) => (
                <RoomInfoRow roomInfo={info} key={info.roomId} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default AdminComponent;
