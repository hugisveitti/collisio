import { CircularProgress, Grid } from "@mui/material";
import React, { useContext, useEffect } from "react";
import { UserContext } from "../../providers/UserProvider";
import { getDeviceType } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import {
  aboutPagePath,
  buyPremiumPagePath,
  connectPagePath,
  frontPagePath,
  highscorePagePath,
  howToPlayPagePath,
  loginPagePath,
  mobileOnlyWaitingRoomPath,
  privateProfilePagePath,
  showRoomPagePath,
  tournamentPagePath,
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
  const onMobile = getDeviceType() === "mobile";

  const renderUserInfo = () => {
    return user ? (
      <div className="background" style={{ fontSize: 32 }}>
        <i>{user.displayName}</i> logged in
      </div>
    ) : (
      <BackdropButton link={loginPagePath}>Login</BackdropButton>
    );
  };
  const btnWidth = 180;
  return (
    <BackdropContainer store={props.store}>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <BackdropButton link={connectPagePath} width={btnWidth}>
            {onMobile ? "Join a game" : "Create a game"}
          </BackdropButton>
          <BackdropButton link={mobileOnlyWaitingRoomPath} width={btnWidth}>
            Play mobile version
          </BackdropButton>
          <BackdropButton
            disabled={!user}
            link={privateProfilePagePath}
            width={btnWidth}
          >
            Settings
          </BackdropButton>
          <BackdropButton link={highscorePagePath} width={btnWidth}>
            Highscores
          </BackdropButton>
          <BackdropButton link={tournamentPagePath} width={btnWidth}>
            Tournaments
          </BackdropButton>
          <BackdropButton link={showRoomPagePath} width={btnWidth}>
            Cars
          </BackdropButton>
          <BackdropButton link={howToPlayPagePath} width={btnWidth}>
            How to play
          </BackdropButton>
          <BackdropButton link={buyPremiumPagePath} width={btnWidth}>
            Go Premium
          </BackdropButton>

          <BackdropButton link={aboutPagePath} width={btnWidth}>
            About
          </BackdropButton>
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
