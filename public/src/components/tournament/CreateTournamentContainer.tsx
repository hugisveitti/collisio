import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import React, { useContext, useState } from "react";
import { useHistory } from "react-router";
import { UserContext } from "../../providers/UserProvider";
import BackdropContainer from "../backdrop/BackdropContainer";
import CreateGlobalTournamentComponent from "./globalTournament/CreateGlobalTournamentComponent";
import CreateLocalTournamentComponent from "./localTournament/CreateLocalTournamentComponent";
import "../textField/my-text-field.css";
import MyRadio from "../radio/MyRadio";
import ToFrontPageButton from "../inputs/ToFrontPageButton";

interface ICreateTournamentContainer {}

const CreateTournamentContainer = (props: ICreateTournamentContainer) => {
  const user = useContext(UserContext);
  const history = useHistory();

  const [tournamentType, setTournamentType] = useState("local");

  return (
    <BackdropContainer loading={user === null} backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={2}>
          <ToFrontPageButton color="white" />
        </Grid>
        {!user?.uid ? (
          <Grid item xs={12} lg={10}>
            <Typography>
              Only logged in users can create a tournament.
            </Typography>
          </Grid>
        ) : (
          <>
            <Grid item xs={12} lg={10}>
              <Typography variant="h3">Create a tournament</Typography>
            </Grid>
            <Grid item xs={12}>
              <MyRadio<string>
                checked={tournamentType}
                options={[
                  { value: "local", label: "Local" },
                  { value: "global", label: "Global" },
                ]}
                label="Type of tournament"
                onChange={(newType) => setTournamentType(newType)}
              />
            </Grid>
            <br />

            {tournamentType === "local" ? (
              <Grid item xs={12}>
                <CreateLocalTournamentComponent user={user} />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <CreateGlobalTournamentComponent user={user} />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default CreateTournamentContainer;
