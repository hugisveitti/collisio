import { off } from "@firebase/database";
import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  getPlayerGameData,
  IPlayerGameData,
} from "../../firebase/firebaseFunctions";
import { inputBackgroundColor } from "../../providers/theme";
import GameDataTableRow from "./GameDataTableRow";

interface IGameDataComponent {
  userId: string;
}

const GameDataComponent = (props: IGameDataComponent) => {
  const [gamesData, setGamesData] = useState(undefined);

  const [gamesLoaded, setGamesLoaded] = useState(false);

  useEffect(() => {
    const playerDataRef = getPlayerGameData(props.userId, (_gamesData) => {
      if (_gamesData) {
        setGamesData(_gamesData);
      }
      setGamesLoaded(true);
    });
    return () => {
      off(playerDataRef);
    };
  }, []);

  if (!gamesLoaded) {
    return (
      <div
        style={{
          textAlign: "center",
          margin: 35,
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <TableContainer
      style={{ backgroundColor: inputBackgroundColor }}
      title="Your game data"
    >
      {!gamesData ? (
        <Typography>You have not completed any races!</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell component="th">Date</TableCell>
              <TableCell component="th">Track name</TableCell>
              <TableCell component="th">No. laps</TableCell>
              <TableCell component="th">Total time</TableCell>
              <TableCell component="th">Best lap time</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(gamesData as IPlayerGameData[]).map((p, i) => {
              const key = `${p.gameInfo.gameId}-${i}`;
              return (
                <GameDataTableRow
                  key={key}
                  playerData={p.playerInfo}
                  userId={props.userId}
                />
              );
            })}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
};

export default GameDataComponent;
