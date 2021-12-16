import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";
import { Tournament } from "../../classes/Tournament";

interface ITournamentsTable {
  tournaments: Tournament[];
}

const TournamentsTable = (props: ITournamentsTable) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Leader</TableCell>
            <TableCell>Track name</TableCell>
            <TableCell>Created on</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.tournaments.map((tournament: Tournament) => {
            return (
              <TableRow key={tournament.id}>
                <TableCell>{tournament.name}</TableCell>
                <TableCell>{tournament.leaderName}</TableCell>
                <TableCell>{tournament.trackName}</TableCell>
                <TableCell>{tournament.creationDate?.toISOString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TournamentsTable;
