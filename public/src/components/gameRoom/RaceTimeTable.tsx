import {
  TableContainer,
  Paper,
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableBody,
} from "@mui/material";
import React from "react";
import { IRaceTimeInfo } from "../../classes/Game";
import { inputBackgroundColor } from "../../providers/theme";

interface IRaceTimeTable {
  raceTimeInfo: IRaceTimeInfo[];
  dense?: boolean;
  isEndOfGame?: boolean;
}

const RaceTimeTable = (props: IRaceTimeTable) => {
  if (props.raceTimeInfo.length === 0) return null;
  return (
    <TableContainer
      component={Paper}
      style={{ backgroundColor: inputBackgroundColor, boxShadow: "none" }}
    >
      <Table size={props.dense ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            <TableCell size={props.dense ? "small" : "medium"}>
              Player
            </TableCell>
            <TableCell size={props.dense ? "small" : "medium"}>Lap</TableCell>
            <TableCell size={props.dense ? "small" : "medium"} align="right">
              {props.isEndOfGame ? "Best lap time" : "Curr LT"}
            </TableCell>
            <TableCell size={props.dense ? "small" : "medium"} align="right">
              Total Time
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.raceTimeInfo.map((timeInfo) => {
            return (
              <TableRow key={timeInfo.playerName}>
                <TableCell size={props.dense ? "small" : "medium"}>
                  {props.isEndOfGame
                    ? timeInfo.playerName
                    : timeInfo.playerName.toUpperCase().slice(0, 3)}
                </TableCell>
                <TableCell size={props.dense ? "small" : "medium"}>
                  {timeInfo.lapNumber} / {timeInfo.numberOfLaps}
                </TableCell>
                <TableCell
                  size={props.dense ? "small" : "medium"}
                  align="right"
                >
                  {props.isEndOfGame
                    ? timeInfo.bestLapTime.toFixed(2)
                    : timeInfo.currentLapTime.toFixed(2)}
                </TableCell>
                <TableCell
                  size={props.dense ? "small" : "medium"}
                  align="right"
                >
                  {timeInfo.totalTime.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RaceTimeTable;
