import { Grid, Typography } from "@mui/material";
import React, { useState } from "react";
import { setAllowCookies } from "../classes/localStorage";
import BackdropContainer from "../components/backdrop/BackdropContainer";
import BackdropButton from "../components/button/BackdropButton";
import ToFrontPageButton from "../components/inputs/ToFrontPageButton";
import { cookiesAcceptedKey } from "../components/monitary/CookiePrompt";
import DonateButton from "../components/monitary/DonateButton";
import { buyCoinsPagePath } from "../components/Routes";
import { getDateFromNumber } from "../utils/utilFunctions";

interface IC {}

const CookiesInfoPage = (props: IC) => {
  const [acceptDateNum, setAcceptDateNum] = useState(
    +window.localStorage.getItem("cookieAcceptDate")
  );
  const [accepted, setAccepted] = useState(
    !!eval(window.localStorage.getItem(cookiesAcceptedKey))
  );

  const renderButtons = () => {
    return (
      <>
        <Grid item xs={12}>
          <Typography>
            Cookies are {accepted ? "allowed." : "not allowd."}
          </Typography>
        </Grid>
        <Grid item xs={12} style={{ textAlign: "center" }}>
          {!accepted ? (
            <BackdropButton
              color="white"
              style={{ display: "inline" }}
              onClick={() => {
                window.localStorage.setItem("cookiePrompt", true + "");
                window.localStorage.setItem(
                  "cookieAcceptDate",
                  Date.now().toString()
                );
                setAllowCookies(true);
                window.localStorage.setItem(cookiesAcceptedKey, "true");
                setAccepted(true);
                setAcceptDateNum(Date.now);
              }}
            >
              Allow cookies
            </BackdropButton>
          ) : (
            <BackdropButton
              color="black"
              style={{ display: "inline", marginLeft: 15 }}
              onClick={() => {
                setAllowCookies(false);
                window.localStorage.clear();
                window.localStorage.setItem("cookiePrompt", true + "");
                window.localStorage.setItem(cookiesAcceptedKey, "false");
                setAccepted(false);
              }}
            >
              Dissallow cookies
            </BackdropButton>
          )}
        </Grid>
      </>
    );
  };

  const dateInfo = acceptDateNum
    ? `You accepted cookies on ${getDateFromNumber(acceptDateNum)}.`
    : "You haven't accepted any cookies.";
  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={12}>
          <h2>Cookie info</h2>
        </Grid>
        <Grid item xs={12}>
          <Typography>{dateInfo}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography>
            We use 1st party cookies and local storage to store information in
            your browser. 1st party cookies means this is data only used by us.
            This information includes your prefrences of track, number of laps,
            graphic settings and more. We also collect information about race
            time which we show on the highscore page.
          </Typography>
          <Typography>
            We give your browser an id, which we use for example to reconnect
            you if you lose connection to your game.
          </Typography>
          <Typography>
            We also collect information given by your ip, such as in what part
            of the world your are in. This information helps us understand who
            are playing the game as well as connect you to the best possible
            servers for you.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <h4>3rd party cookies</h4>
          <Typography>
            Our ad vendors collect 3rd party cookies if you have opted in for
            personalized ads. Otherwise not.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            If you choose to use an adblocker then we respect that decision, but
            the please consider donating to this project, either by buying
            coins, donating directly or by telling your friends, thank you : ).
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <DonateButton />
        </Grid>
        <Grid item xs={12}>
          <BackdropButton link={buyCoinsPagePath}>Buy coins</BackdropButton>
        </Grid>

        {renderButtons()}
      </Grid>
    </BackdropContainer>
  );
};

export default CookiesInfoPage;
