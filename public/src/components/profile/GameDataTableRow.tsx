import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import React, { useState } from "react";
import { IEndOfRaceInfoPlayer } from "../../classes/Game";
import { deletePlayerGameData } from "../../firebase/firestoreGameFunctions";
import { getDateFromNumber } from "../../utils/utilFunctions";

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

  const raceDate =
    typeof playerData.date === "number"
      ? getDateFromNumber(playerData.date)
      : "-";
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
        <TableCell>{raceDate}</TableCell>
        <TableCell>{playerData.trackName}</TableCell>
        <TableCell>{playerData.numberOfLaps}</TableCell>
        <TableCell>{playerData.totalTime}</TableCell>
        <TableCell>{playerData.bestLapTime}</TableCell>
        <TableCell>
          <IconButton
            onClick={() => {
              deletePlayerGameData(props.userId, playerData.gameId);
            }}
          >
            <DeleteForeverIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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
              <div>Date of race: {raceDate}</div>
              <div>Type of vehicle: {playerData.vehicleType ?? "-"}</div>
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};
