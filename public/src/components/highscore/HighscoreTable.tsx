import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import React from "react";
import { IEndOfRaceInfoPlayer } from "../../classes/Game";
import { cardBackgroundColor } from "../../providers/theme";
import { itemInArray } from "../../utils/utilFunctions";
import HighscorePageTableRow from "./HighscorePageTableRow";

interface IHighscoreTable {
  data: IEndOfRaceInfoPlayer[];
  noDataText: string;
  includeTrackAndNumLaps?: boolean;
}

const HighscoreTable = (props: IHighscoreTable) => {
  return (
    <TableContainer>
      <Table
        style={{
          backgroundColor: cardBackgroundColor,
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell />

            <TableCell component="th">Player name</TableCell>

            <TableCell component="th">Total time</TableCell>
            <TableCell component="th">Best lap time</TableCell>
            {props.includeTrackAndNumLaps && (
              <>
                <TableCell component="th">Track name</TableCell>
                <TableCell component="th">Number of laps</TableCell>
              </>
            )}
            <TableCell>Vehicle type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!props.data || props.data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5 + (props.includeTrackAndNumLaps ? 2 : 0)}>
                {props.noDataText}
              </TableCell>
            </TableRow>
          ) : (
            props.data.map((playerData, i) => {
              return (
                <HighscorePageTableRow
                  key={`${playerData.gameId}-${playerData.playerName}-${i}`}
                  playerData={playerData}
                  includeTrackAndNumLaps={props.includeTrackAndNumLaps}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default HighscoreTable;
