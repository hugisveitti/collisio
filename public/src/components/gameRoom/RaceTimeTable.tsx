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
  isEndOfGame?: boolean;
}

const RaceTimeTable = (props: IRaceTimeTable) => {
  if (props.raceTimeInfo.length === 0) return null;

  const cellStyle = !props.isEndOfGame ? { width: 50 } : {};
  const containerStyle = !props.isEndOfGame ? { width: 250 } : {};
  return (
    <TableContainer
      component={Paper}
      style={{
        ...containerStyle,
        backgroundColor: inputBackgroundColor,
        boxShadow: "none",
      }}
    >
      <Table
        size={!props.isEndOfGame ? "small" : "medium"}
        style={{ fontSize: 8 }}
      >
        <TableHead>
          <TableRow>
            <TableCell
              size={!props.isEndOfGame ? "small" : "medium"}
              style={cellStyle}
            >
              Player
            </TableCell>
            <TableCell style={cellStyle}>Lap / TL</TableCell>
            <TableCell
              size={!props.isEndOfGame ? "small" : "medium"}
              align="right"
              style={cellStyle}
            >
              {props.isEndOfGame ? "Best lap time" : "Curr LT"}
            </TableCell>
            {!!props.isEndOfGame && (
              <>
                <TableCell
                  size={!props.isEndOfGame ? "small" : "medium"}
                  align="right"
                  style={cellStyle}
                >
                  Total Time
                </TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {props.raceTimeInfo.map((timeInfo) => {
            return (
              <TableRow key={timeInfo.playerName}>
                <TableCell
                  size={!props.isEndOfGame ? "small" : "medium"}
                  style={cellStyle}
                >
                  {props.isEndOfGame
                    ? timeInfo.playerName
                    : timeInfo.playerName.toUpperCase().slice(0, 3)}
                </TableCell>
                <TableCell style={cellStyle}>
                  {timeInfo.lapNumber} / {timeInfo.numberOfLaps}
                </TableCell>
                <TableCell
                  size={!props.isEndOfGame ? "small" : "medium"}
                  align="right"
                  style={cellStyle}
                >
                  {props.isEndOfGame
                    ? timeInfo.bestLapTime.toFixed(2)
                    : timeInfo.currentLapTime.toFixed(2)}
                </TableCell>
                {!!props.isEndOfGame && (
                  <>
                    <TableCell
                      size={!props.isEndOfGame ? "small" : "medium"}
                      align="right"
                      style={cellStyle}
                    >
                      {timeInfo.totalTime.toFixed(2)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RaceTimeTable;
