import { Collapse, Icon, IconButton, TableCell, TableRow } from "@mui/material";
import React, { useState } from "react";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { IEndOfRaceInfoPlayer } from "../../classes/Game";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { deletePlayerGameData, IUser } from "../../firebase/firebaseFunctions";

interface IProps {
  playerData: IEndOfRaceInfoPlayer;
  userId: string;
}

export default (props: IProps) => {
  const [open, setOpen] = useState(false);
  // let open = false;
  const { playerData } = props;
  // console.log("props in gamedata row", props);
  if (!props.playerData) return null;

  return (
    <React.Fragment>
      <TableRow onClick={() => {}} sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => {
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{playerData.date}</TableCell>
        <TableCell>{playerData.trackName}</TableCell>
        <TableCell>{playerData.numberOfLaps}</TableCell>
        <TableCell>{playerData.totalTime}</TableCell>
        <TableCell>{playerData.bestLapTime}</TableCell>
        <TableCell>
          <IconButton
            onClick={() => {
              deletePlayerGameData(
                props.userId,
                playerData.gameId,
                playerData.trackName,
                playerData.numberOfLaps
              );
            }}
          >
            <DeleteForeverIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <div
              style={{
                margin: 10,
                padding: 5,
              }}
            >
              Lap times:
              {playerData.lapTimes.map((lap, i) => {
                return (
                  <span
                    key={`${playerData.gameId}-${playerData.playerName}-lap${i}`}
                    style={{
                      marginLeft: 15,
                    }}
                  >
                    {lap}
                  </span>
                );
              })}
              <div>Date of race: {playerData.date}</div>
              <div>Type of vehicle: {playerData.vehicleType ?? "-"}</div>
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};
