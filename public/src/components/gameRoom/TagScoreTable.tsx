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
import { IRaceTimeInfo, ITagScoreInfo } from "../../classes/Game";
import { inputBackgroundColor } from "../../providers/theme";

const sortRaceTimeInfo = (raceTimeInfo: IRaceTimeInfo[]) => {
  return raceTimeInfo.sort((a, b) => a.totalTime - b.totalTime);
};

interface ITagScoreTable {
  tagInfos: ITagScoreInfo[];
  isEndOfGame?: boolean;
}

const TagScoreTable = (props: ITagScoreTable) => {
  if (props.tagInfos.length === 0) return null;

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
            <TableCell style={cellStyle}>Score</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.tagInfos.map((tagInfo) => {
            return (
              <TableRow key={tagInfo.playerName}>
                <TableCell
                  size={!props.isEndOfGame ? "small" : "medium"}
                  style={cellStyle}
                >
                  {props.isEndOfGame
                    ? tagInfo.playerName
                    : tagInfo.playerName.toUpperCase().slice(0, 3)}
                </TableCell>
                <TableCell style={cellStyle}>{tagInfo.score}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TagScoreTable;
