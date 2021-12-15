import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import React, { useContext, useState } from "react";
import AppContainer from "../../containers/AppContainer";
import { UserContext } from "../../providers/UserProvider";
import CreateGlobalTournamentComponent from "./CreateGlobalTournamentComponent";
import CreateLocalTournamentComponent from "./CreateLocalTournamentComponent";

interface ICreateTournamentContainer {}

const CreateTournamentContainer = (props: ICreateTournamentContainer) => {
  const user = useContext(UserContext);

  const [tournamentType, setTournamentType] = useState("local");

  return (
    <AppContainer>
      <Grid container spacing={3}>
        {!user?.uid ? (
          <Grid item xs={12}>
            <Typography>
              Only logged in users can create a tournament.
            </Typography>
          </Grid>
        ) : (
          <>
            <Grid item xs={12}>
              <Typography variant="h3">Create a tournament</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Type of tournament</FormLabel>
                <RadioGroup
                  row
                  aria-label="type of game"
                  name="row-radio-buttons-group"
                >
                  <FormControlLabel
                    value="local"
                    control={
                      <Radio
                        onChange={() => setTournamentType("local")}
                        checked={tournamentType === "local"}
                      />
                    }
                    label="Local"
                  />
                  <FormControlLabel
                    value="global"
                    control={
                      <Radio
                        onChange={() => {
                          setTournamentType("global");
                        }}
                        checked={tournamentType === "global"}
                      />
                    }
                    label="Global"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          </>
        )}
      </Grid>
      <br />
      {tournamentType === "local" ? (
        <CreateLocalTournamentComponent />
      ) : (
        <CreateGlobalTournamentComponent />
      )}
    </AppContainer>
  );
};

export default CreateTournamentContainer;
