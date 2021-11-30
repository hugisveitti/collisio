import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import React, { useState } from "react";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { IEndOfRaceInfoPlayer } from "../classes/Game";
import { getVehicleNameFromType } from "../vehicles/VehicleConfigs";
import { getUserPagePath } from "./Routes";

interface IProps {
  playerData: IEndOfRaceInfoPlayer;
}

export default (props: IProps) => {
  const [open, setOpen] = useState(false);
  // let open = false;
  const { playerData } = props;
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
        <TableCell>
          <a
            style={{ color: "inherit" }}
            href={getUserPagePath(playerData.playerId)}
          >
            {playerData.playerName}
          </a>
        </TableCell>
        <TableCell>{playerData.totalTime}</TableCell>
        <TableCell>{playerData.bestLapTime}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
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
              <div>
                Type of vehicle:{" "}
                {getVehicleNameFromType(playerData.vehicleType) ?? "-"}
              </div>
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};
