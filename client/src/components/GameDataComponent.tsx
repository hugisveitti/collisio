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
    <Card style={{ marginTop: 25 }}>
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
                  <TableCell component="th">Player name</TableCell>
                  <TableCell component="th">Total time</TableCell>
                  <TableCell component="th">Best lap time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(gamesData as IPlayerGameData[]).map((p, i) => {
                  const key = `${p.gameInfo.gameId}-${i}`;
                  return (
                    <HighscorePageTableRow
                      key={key}
                      playerData={p.playerInfo}
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
