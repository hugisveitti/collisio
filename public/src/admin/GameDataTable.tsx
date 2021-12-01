import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import React from "react";
import { IEndOfRaceInfoGame } from "../classes/Game";
import { inputBackgroundColor } from "../providers/theme";
import { getDateFromNumber } from "../utils/utilFunctions";

/**
 * Do something more interesting with this
 */
interface IGameInfoRow {
  gameData: IEndOfRaceInfoGame;
}

const GameInfoRow = (props: IGameInfoRow) => {
  return (
    <TableRow>
      <TableCell>{props.gameData.roomId}</TableCell>
      <TableCell>{getDateFromNumber(props.gameData.date)}</TableCell>
      <TableCell>{props.gameData.playersInfo?.length ?? "-"}</TableCell>
      <TableCell>{props.gameData.roomTicks ?? "-"}</TableCell>
      <TableCell>{props.gameData.gameTicks ?? "-"}</TableCell>
      <TableCell>{props.gameData.gameSettings?.trackName ?? "-"}</TableCell>
      <TableCell>{props.gameData.gameSettings?.numberOfLaps ?? "-"}</TableCell>
      <TableCell>
        {props.gameData.playersInfo?.length > 0
          ? props.gameData.playersInfo[0].name
          : "No leader"}
      </TableCell>
    </TableRow>
  );
};

interface IGameDataTable {
  gamesData: IEndOfRaceInfoGame[];
}

const GameDataTable = (props: IGameDataTable) => {
  return (
    <TableContainer
      component={Paper}
      style={{
        boxShadow: "none",
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>RoomId</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Number of players</TableCell>
            <TableCell>Room Ticks</TableCell>
            <TableCell>Game Ticks</TableCell>
            <TableCell>Track name</TableCell>
            <TableCell>Number of laps</TableCell>
            <TableCell>Leader</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.gamesData.map((data, i) => (
            <GameInfoRow gameData={data} key={`game-data-${i}`} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GameDataTable;
