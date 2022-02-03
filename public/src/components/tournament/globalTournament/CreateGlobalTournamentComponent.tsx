import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import {
  GlobalTournament,
  validateCreateTournament,
} from "../../../classes/Tournament";
import { IUser } from "../../../classes/User";
import { setTournament } from "../../../firebase/firestoreTournamentFunctions";
import BackdropButton from "../../button/BackdropButton";
import { getTournamentPagePath } from "../../Routes";
import EditTournamentComponent from "../EditTournamentComponent";

interface ICreateGlobalTournamentComponent {
  user: IUser;
}

const CreateGlobalTournamentComponent = (
  props: ICreateGlobalTournamentComponent
) => {
  const history = useHistory();
  const [editTournament, setEditTournament] = useState(
    new GlobalTournament(props.user?.uid, props.user?.displayName)
  );

  const updateTournament = (key: keyof GlobalTournament, value: any) => {
    const newTournament = { ...editTournament };
    // @ts-ignore
    newTournament[key] = value;
    setEditTournament(newTournament as GlobalTournament);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography>
          Global tournaments can be for players that are not physically
          together. Each player tries to get their best time on a give
          track/number of laps combination. There can be set a limit for the
          number of runs each player is allowed. A predetermined window of time
          is allowed for this tournament. The player with the quickest time when
          the tournament finishes is the winner.
          {/** This could be used to determine placement for the local tournament bracets */}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={12}>
        <Typography>Create Global tournament</Typography>
      </Grid>
      <EditTournamentComponent<GlobalTournament>
        tournament={editTournament}
        user={props.user}
        updateTournament={updateTournament}
      />
      <Grid item xs={12}>
        <BackdropButton
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
          Create global tournament!
        </BackdropButton>
      </Grid>
    </Grid>
  );
};

export default CreateGlobalTournamentComponent;
