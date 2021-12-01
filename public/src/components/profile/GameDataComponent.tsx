import { off } from "@firebase/database";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { IEndOfRaceInfoPlayer } from "../../classes/Game";
import { getPlayerGameDataListener } from "../../firebase/firestoreGameFunctions";
import { cardBackgroundColor } from "../../providers/theme";
import GameDataTableRow from "./GameDataTableRow";

interface IGameDataComponent {
  userId: string;
}

const GameDataComponent = (props: IGameDataComponent) => {
  const [gamesData, setGamesData] = useState([] as IEndOfRaceInfoPlayer[]);

  const [gamesLoaded, setGamesLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    const unsub = getPlayerGameDataListener(props.userId, (_gamesData) => {
      if (_gamesData) {
        setGamesData(_gamesData);
      }
      setGamesLoaded(true);
    });
    return () => {
      if (unsub) {
        unsub();
      }
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
    <React.Fragment>
      <div style={{ backgroundColor: cardBackgroundColor }}>
        <TablePagination
          page={page}
          count={gamesData.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 15, 25, 50]}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          component="div"
        />
        <TableContainer title="Your game data">
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
                {gamesData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((p, i) => {
                    const key = `gamedata-${p.gameId}-${i}`;
                    return (
                      <GameDataTableRow
                        key={key}
                        playerData={p}
                        userId={props.userId}
                      />
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </div>
    </React.Fragment>
  );
};

export default GameDataComponent;
