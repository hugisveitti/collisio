import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import React from "react";
import { IRaceTimeInfo } from "../../classes/Game";
import { getStyledColors, inputBackgroundColor } from "../../providers/theme";

const sortRaceTimeInfo = (raceTimeInfo: IRaceTimeInfo[]) => {
  return raceTimeInfo.sort((a, b) => a.totalTime - b.totalTime);
};

interface IRaceTimeTable {
  raceTimeInfo: IRaceTimeInfo[];
  isEndOfGame?: boolean;
}

const RaceTimeTable = (props: IRaceTimeTable) => {
  if (props.raceTimeInfo.length === 0) return null;

  const cellStyle = !props.isEndOfGame ? { width: 50 } : {};
  const containerStyle = !props.isEndOfGame ? { width: 250 } : {};

  const { color, backgroundColor } = getStyledColors("white");

  const raceTimeInfo = props.isEndOfGame
    ? sortRaceTimeInfo(props.raceTimeInfo)
    : props.raceTimeInfo;
  return (
    <TableContainer
      style={{
        ...containerStyle,
        color,
        backgroundColor,
        borderRadius: 0,
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
          {raceTimeInfo.map((timeInfo) => {
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
