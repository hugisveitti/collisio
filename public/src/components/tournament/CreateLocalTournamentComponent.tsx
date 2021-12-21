import { Button, Divider } from "@mui/material";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import {
  LocalTournament,
  validateCreateTournament,
} from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import { setTournament } from "../../firebase/firestoreTournamentFunctions";
import { getTournamentPagePath } from "../Routes";
import EditTournamentComponent from "./EditTournamentComponent";

interface ICreateLocalTournamentComponent {
  user: IUser;
}

const CreateLocalTournamentComponent = (
  props: ICreateLocalTournamentComponent
) => {
  const history = useHistory();

  const [editTournament, setEditTournament] = useState(
    new LocalTournament(props.user?.uid, props.user?.displayName)
  );

  const updateTournament = (key: keyof LocalTournament, value: any) => {
    const newTournament = { ...editTournament };
    // @ts-ignore
    newTournament[key] = value;
    setTournament(newTournament as LocalTournament);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography>
          Local tournaments are for players that are physically together. The
          format is a knockout tournament, where two players face off in each
          round, the winner advances until there is one player left. In the
          knockout tournament there is also the possibility of having a lower
          bracket, this way everyone plays the same amount of games.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h5">Create local tournament</Typography>
      </Grid>

      <EditTournamentComponent<LocalTournament>
        tournament={editTournament}
        user={props.user}
        updateTournament={updateTournament}
      />

      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          disableElevation
          onClick={() => {
            const { status, message } =
              validateCreateTournament(editTournament);
            if (status === "error") {
              toast.error(message);
            } else {
              setTournament(editTournament)
                .then(() => {
                  history.push(getTournamentPagePath(editTournament.id));
                })
                .catch(() => {
                  // ekki endilega rétt
                  toast.error("Some error.");
                });
            }
          }}
        >
          Create local tournament!
        </Button>
      </Grid>
    </Grid>
  );
};

export default CreateLocalTournamentComponent;
