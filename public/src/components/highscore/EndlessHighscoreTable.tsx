import { TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import React from "react";
import { useHistory } from "react-router";
import { IEndlessRunData } from "../../firebase/firestoreGameFunctions";
import { getStyledColors } from "../../providers/theme";
import { getUserPagePath } from "../Routes";

interface IEndlessRow {
  data: IEndlessRunData;
}

const EndlessRow = (props: IEndlessRow) => {
  const history = useHistory();
  return (
    <TableRow>
      <TableCell>
        <span
          style={{
            color: "inherit",
            textDecoration: "underline",
            cursor: "pointer",
          }}
          onClick={() => {
            history.push(getUserPagePath(props.data.playerId));
          }}
        >
          {props.data.playerName}
        </span>
      </TableCell>
      <TableCell>{props.data.points}</TableCell>
    </TableRow>
  );
};

interface IEndlessHighscoreTable {
  data: IEndlessRunData[];
}

const EndlessHighscoreTable = (props: IEndlessHighscoreTable) => {
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
            <TableCell component="th">Player</TableCell>
            <TableCell component="th">Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.data.map((d) => (
            <EndlessRow key={d.playerId} data={d} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EndlessHighscoreTable;
