import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import React, { useEffect, useState } from "react";
import { ISingleRaceData, ITournamentUser } from "../../../classes/Tournament";
import { getPlayersInTournamentListener } from "../../../firebase/firestoreTournamentFunctions";

interface IScoreItem {
  player: ITournamentUser;
}

const getBestRace = (raceData: ISingleRaceData[]): ISingleRaceData => {
  if (!raceData || raceData?.length === 0)
    return { vehicleType: "normal", totalTime: Infinity, lapTimes: [] };

  let bestRace = raceData[0];
  for (let race of raceData) {
    if (race.totalTime < bestRace.totalTime) bestRace = race;
  }
  return bestRace;
};

const ScoreItem = (props: IScoreItem) => {
  const [open, setOpen] = useState(false);

  const bestRun: ISingleRaceData = getBestRace(props.player.raceData);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
        <TableCell>{props.player.displayName}</TableCell>
        <TableCell>
          {bestRun ? bestRun.totalTime : "No laps recorded"}
        </TableCell>
        <TableCell>
          {props.player.raceData ? props.player.raceData.length : 0}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open}>
            <Typography>Lap times:</Typography>
            {bestRun?.lapTimes.length > 0 ? (
              bestRun.lapTimes.map((lt, i) => {
                return (
                  <Typography
                    key={`${props.player.uid}-laps-${i}`}
                    style={{ paddingRight: 5 }}
                  >
                    {lt}
                  </Typography>
                );
              })
            ) : (
              <Typography>No laps</Typography>
            )}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

interface IGlobalTournamentScoreboard {
  tournamentId: string;
}

// need to specifically get players since they are its own collection
const GlobalTournamentScoreboard = (props: IGlobalTournamentScoreboard) => {
  const [players, setPlayers] = useState([] as ITournamentUser[]);

  useEffect(() => {
    const unsub = getPlayersInTournamentListener(props.tournamentId, (_p) => {
      // TODO: not this
      _p.sort((a, b) => {
        return (
          getBestRace(a.raceData).totalTime - getBestRace(b.raceData).totalTime
        );
      });
      setPlayers(_p);
    });

    return () => {
      unsub();
    };
  }, []);

  return (
    <TableContainer style={{ maxWidth: 600, margin: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Player</TableCell>
            <TableCell>Best total time</TableCell>
            <TableCell>Number of runs</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {players.map((p) => {
            return <ScoreItem key={p.uid} player={p} />;
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GlobalTournamentScoreboard;
