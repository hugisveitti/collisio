import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import { CircularProgress, Grid, IconButton } from "@mui/material";
import React, { useContext, useEffect } from "react";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { UserContext } from "../../providers/UserProvider";
import { setMusicVolume } from "../../sounds/gameSounds";
import { getDeviceType } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import MySlider from "../inputs/slider/MySlider";
import AdSense from "../monitary/AdSense";
import {
  aboutPagePath,
  buyPremiumPagePath,
  connectPagePath,
  frontPagePath,
  garagePagePath,
  highscorePagePath,
  howToPlayPagePath,
  loginPagePath,
  mobileOnlyWaitingRoomPath,
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
  useEffect(() => {
    props.store.setPreviousPage(frontPagePath);
  }, []);

  const user = useContext(UserContext);
  const onMobile = getDeviceType() === "mobile";

  const renderUserInfo = () => {
    return user ? (
      <>
        <TokenComponent user={user} store={props.store} showInfo />
        <BackdropButton link={privateProfilePagePath} style={{ fontSize: 32 }}>
          <i>{user.displayName}</i> logged in
        </BackdropButton>
      </>
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
          <BackdropButton link={garagePagePath} width={btnWidth}>
            Garage
          </BackdropButton>
          <BackdropButton link={trackPagePath} width={btnWidth}>
            Tracks
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

        <Grid
          item
          xs={12}
          lg={6}
          style={{
            float: "right",
          }}
        >
          <>
            {user === null ? (
              <div
                style={{ marginTop: 15, margin: "auto", textAlign: "center" }}
              >
                <CircularProgress />
              </div>
            ) : (
              <div>{renderUserInfo()}</div>
            )}
            {!onMobile && (
              <div style={{ marginTop: 15 }} className="background">
                <MySlider
                  startIcon={
                    <IconButton
                      style={{ color: "white" }}
                      onClick={() => {
                        const newGameSettings: IGameSettings = {
                          ...props.store.gameSettings,
                          musicVolume: 0 as number,
                        };
                        props.store.setGameSettings(newGameSettings);
                        setLocalGameSetting("musicVolume", 0);
                        setMusicVolume(0);
                      }}
                    >
                      <VolumeDown />
                    </IconButton>
                  }
                  endIcon={<VolumeUp />}
                  label="Music volume"
                  onChangeCommitted={(newVal) => {
                    const newGameSettings: IGameSettings = {
                      ...props.store.gameSettings,
                      musicVolume: newVal as number,
                    };
                    props.store.setGameSettings(newGameSettings);
                    setLocalGameSetting("musicVolume", newVal as number);
                  }}
                  onChange={(newVal) => {
                    setMusicVolume(newVal as number);
                  }}
                  value={props.store.gameSettings.musicVolume}
                  step={0.01}
                  max={1}
                  min={0}
                  color="white"
                />
              </div>
            )}
          </>
        </Grid>
        <Grid item xs={12}>
          <p>
            <i>Pre alpha</i>
          </p>
        </Grid>
        <Grid item xs={12}>
          <AdSense slotId="7059022973" />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default FrontPageContainer;
