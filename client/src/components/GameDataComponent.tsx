import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { IPlayerGameInfo } from "../classes/Game";
import {
  getPlayerGameData,
  IPlayerGameData,
} from "../firebase/firebaseFunctions";
import { inputBackgroundColor } from "../providers/theme";
import GameDataTableRow from "./GameDataTableRow";
import HighscorePageTableRow from "./HighscorePageTableRow";

interface IGameDataComponent {
  userId: string;
}

const GameDataComponent = (props: IGameDataComponent) => {
  const [gamesData, setGamesData] = useState(undefined);

  const [gamesLoaded, setGamesLoaded] = useState(false);

  useEffect(() => {
    getPlayerGameData(props.userId, (_gamesData) => {
      if (_gamesData) {
        setGamesData(_gamesData);
      }
      setGamesLoaded(true);
    });
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

  console.log("gamesData", gamesData);
  return (
    <Card style={{ backgroundColor: inputBackgroundColor }}>
      <CardHeader subheader="Your game data" />
      <CardContent>
        {!gamesData ? (
          <Typography>You have not completed any races!</Typography>
        ) : (
          <React.Fragment>
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
          </React.Fragment>
        )}
      </CardContent>
    </Card>
  );
};

export default GameDataComponent;
