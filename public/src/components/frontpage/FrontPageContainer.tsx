import { CircularProgress, Grid } from "@mui/material";
import React, { useContext, useEffect } from "react";
import { UserContext } from "../../providers/UserProvider";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../backdrop/button/BackdropButton";
import {
  aboutPagePath,
  buyPremiumPagePath,
  connectPagePath,
  frontPagePath,
  highscorePagePath,
  howToPlayPagePath,
  loginPagePath,
  privateProfilePagePath,
  showRoomPagePath,
  tournamentPagePath,
  waitingRoomPath,
} from "../Routes";
import { IStore } from "../store";

interface IFrontPageContainer {
  store: IStore;
}
const FrontPageContainer = (props: IFrontPageContainer) => {
  useEffect(() => {
    props.store.setPreviousPage(frontPagePath);
  }, []);

  const user = useContext(UserContext);

  const renderUserInfo = () => {
    return user ? (
      <div className="background" style={{ fontSize: 32 }}>
        Welcome <i>{user.displayName}</i>
      </div>
    ) : (
      <BackdropButton link={loginPagePath}>Login</BackdropButton>
    );
  };

  return (
    <BackdropContainer store={props.store}>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <BackdropButton link={connectPagePath}>Create a game</BackdropButton>
          <BackdropButton disabled={!user} link={privateProfilePagePath}>
            Settings
          </BackdropButton>
          <BackdropButton link={highscorePagePath}>Highscores</BackdropButton>
          <BackdropButton link={tournamentPagePath}>Tournaments</BackdropButton>
          <BackdropButton link={showRoomPagePath}>Cars</BackdropButton>
          <BackdropButton link={howToPlayPagePath}>How to play</BackdropButton>
          <BackdropButton link={buyPremiumPagePath}>Go Premium</BackdropButton>
          <BackdropButton link={aboutPagePath}>About</BackdropButton>
        </Grid>
        <Grid item xs={12} lg={6} style={{}}>
          {user === null ? (
            <div style={{ marginTop: 15, margin: "auto", textAlign: "center" }}>
              <CircularProgress />
            </div>
          ) : (
            <div
              style={{
                float: "right",
              }}
            >
              {renderUserInfo()}
            </div>
          )}
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default FrontPageContainer;
