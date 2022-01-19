import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Tournament } from "../../classes/Tournament";
import { getAllUserTournaments } from "../../firebase/firestoreTournamentFunctions";
import { UserContext } from "../../providers/UserProvider";
import BackdropContainer from "../backdrop/BackdropContainer";
import TournamentsTable from "../tournament/TournamentsTable";

interface IPrivateProfileAllTournamentsList {}

const PrivateProfileAllTournamentsList = (
  props: IPrivateProfileAllTournamentsList
) => {
  const user = useContext(UserContext);

  const [tournaments, setTournaments] = useState([] as Tournament[]);

  useEffect(() => {
    if (!user?.uid) return;
    getAllUserTournaments(user.uid)
      .then((_t) => {
        setTournaments(_t);
      })
      .catch(() => {
        toast.error("Error getting user tournaments");
      });
  }, []);

  if (user === undefined) {
    return <span>You need to be logged in</span>;
  }

  return (
    <BackdropContainer loading={user === null}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          All tournements
        </Grid>
        <Grid item xs={12}>
          <TournamentsTable tournaments={tournaments} />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default PrivateProfileAllTournamentsList;
