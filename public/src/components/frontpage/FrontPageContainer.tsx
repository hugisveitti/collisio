import { CircularProgress, Grid } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { setLocalGameSetting } from "../../classes/localGameSettings";
import { UserContext } from "../../providers/UserProvider";
import { setMusicVolume } from "../../sounds/gameSounds";
import {
  getDefaultTabletSetting,
  getDeviceType,
  onTablet,
  setDefaultTabletSetting,
} from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import VolumeInput from "../inputs/VolumeInput";
import AdSense from "../monitary/AdSense";
import MyRadio from "../radio/MyRadio";
import {
  aboutPagePath,
  buyCoinsPagePath,
  connectPagePath,
  frontPagePath,
  garagePagePath,
  highscorePagePath,
  howToPlayPagePath,
  loginPagePath,
  mobileOnlyWaitingRoomPath,
  multiplayerConnectPagePath,
  privateProfilePagePath,
  tournamentPagePath,
  trackPagePath,
} from "../Routes";
import { IStore } from "../store";
import TokenComponent from "../tokenComponent/TokenComponent";

interface IFrontPageContainer {
  store: IStore;
}
const FrontPageContainer = (props: IFrontPageContainer) => {
  const [useTabletAsMobile, setUseTabletAsMobile] = useState(
    getDefaultTabletSetting() as boolean
  );
  useEffect(() => {
    props.store.setPreviousPage(frontPagePath);
  }, []);

  const user = useContext(UserContext);
  const onMobile = getDeviceType() === "mobile";

  const renderUserInfo = () => {
    if (user === null) {
      return (
        <div style={{ marginTop: 15, margin: "auto", textAlign: "center" }}>
          <CircularProgress />
        </div>
      );
    }

    return user ? (
      <div>
        <TokenComponent user={user} store={props.store} showInfo />
        <BackdropButton link={privateProfilePagePath} style={{ fontSize: 32 }}>
          <i>{user.displayName}</i> logged in
        </BackdropButton>
      </div>
    ) : (
      <BackdropButton link={loginPagePath}>Login</BackdropButton>
    );
  };
  const btnWidth = 180;
  return (
    <BackdropContainer store={props.store}>
      <Grid container spacing={3}>
        {onMobile && (
          <Grid item xs={12}>
            {renderUserInfo()}
          </Grid>
        )}
        <Grid item xs={12} lg={6}>
          <BackdropButton link={connectPagePath} width={btnWidth}>
            {onMobile ? "Join a game" : "Create a game"}
          </BackdropButton>
          {onMobile && (
            <BackdropButton link={mobileOnlyWaitingRoomPath} width={btnWidth}>
              Play mobile version
            </BackdropButton>
          )}
          <BackdropButton link={multiplayerConnectPagePath} width={btnWidth}>
            Multiplayer
          </BackdropButton>
          <br />
          <BackdropButton link={garagePagePath} width={btnWidth}>
            Garage
          </BackdropButton>
          <BackdropButton link={trackPagePath} width={btnWidth}>
            Tracks
          </BackdropButton>
          <BackdropButton link={buyCoinsPagePath} width={btnWidth}>
            Buy coins
          </BackdropButton>
          <br />
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
          <BackdropButton link={howToPlayPagePath} width={btnWidth}>
            How to play
          </BackdropButton>

          <BackdropButton link={aboutPagePath} width={btnWidth}>
            About
          </BackdropButton>
        </Grid>

        <Grid
          item
          xs={12}
          lg={6}
          style={{
            float: "right",
          }}
        >
          {!onMobile && renderUserInfo()}
          {!onMobile && <VolumeInput store={props.store} />}
        </Grid>

        <Grid item xs={12}>
          <p>
            <i>Pre alpha</i>
          </p>
        </Grid>
        {onTablet() && (
          <Grid item xs={12}>
            <div className="background">
              <MyRadio<boolean>
                label="Use tablet as?"
                options={[
                  { label: "Mobile", value: true },
                  { label: "Desktop", value: false },
                ]}
                checked={useTabletAsMobile}
                onChange={() => {
                  setUseTabletAsMobile(!useTabletAsMobile);
                  setDefaultTabletSetting(!useTabletAsMobile);
                  if (!useTabletAsMobile) {
                    setLocalGameSetting("musicVolume", 0);
                    setMusicVolume(0);
                  }
                }}
              />
            </div>
          </Grid>
        )}
        <Grid item xs={12}>
          <AdSense slotId="7059022973" />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default FrontPageContainer;
