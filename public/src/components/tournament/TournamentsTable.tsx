import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";
import { useHistory } from "react-router";
import { Tournament } from "../../classes/Tournament";
import { getDateString } from "../../utils/utilFunctions";
import { getTournamentPagePath } from "../Routes";

interface ITournamentsTable {
  tournaments: Tournament[];
}

const TournamentsTable = (props: ITournamentsTable) => {
  const history = useHistory();

  return (
    <TableContainer>
      <Table>
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
                  <Button
                    variant="outlined"
                    onClick={() =>
                      history.push(getTournamentPagePath(tournament.id))
                    }
                  >
                    View
                  </Button>
                </TableCell>
                <TableCell>{tournament.name}</TableCell>
                <TableCell>{tournament.leaderName}</TableCell>
                <TableCell>{tournament.trackName}</TableCell>
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
