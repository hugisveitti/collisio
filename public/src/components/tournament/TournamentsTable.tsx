import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import React from "react";
import { useHistory } from "react-router";
import { getTrackNameFromType } from "../../classes/Game";
import { Tournament } from "../../classes/Tournament";
import { getStyledColors } from "../../providers/theme";
import { getDateString } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import { getTournamentPagePath } from "../Routes";

interface ITournamentsTable {
  tournaments: Tournament[];
}

const TournamentsTable = (props: ITournamentsTable) => {
  const history = useHistory();

  const { color, backgroundColor } = getStyledColors("white");

  return (
    <TableContainer>
      <Table
        style={{
          color,
          backgroundColor,
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Name</TableCell>
            <TableCell>Leader</TableCell>
            <TableCell>Track name</TableCell>
            <TableCell>Created on</TableCell>
            <TableCell>Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.tournaments.map((tournament: Tournament) => {
            return (
              <TableRow key={tournament.id}>
                <TableCell>
                  <BackdropButton
                    onClick={() =>
                      history.push(getTournamentPagePath(tournament.id))
                    }
                  >
                    View
                  </BackdropButton>
                </TableCell>
                <TableCell>{tournament.name}</TableCell>
                <TableCell>{tournament.leaderName}</TableCell>
                <TableCell>
                  {getTrackNameFromType(tournament.trackName)}
                </TableCell>
                <TableCell>{getDateString(tournament.creationDate)}</TableCell>
                <TableCell>{tournament.tournamentType}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TournamentsTable;
