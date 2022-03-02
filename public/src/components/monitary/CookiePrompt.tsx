import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import BackdropButton from "../button/BackdropButton";
import {
  cookiesInfoPagePath,
  privacyPolicyPage,
  termsOfUsePagePath,
} from "../Routes";
import { setAllowCookies } from "../../classes/localStorage";

/**
 * TODO:
 * Need to learn how to have the user decide how many cookies she would like to use
 */
export const cookiesAcceptedKey = "cookiesAccepted";
const CookiePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const cookiesAccepted = window.localStorage.getItem(cookiesAcceptedKey);
    setAllowCookies(!!eval(cookiesAccepted));
    setTimeout(() => {
      const hasShownPrompt = window.localStorage.getItem("cookiePrompt");
      setShowPrompt(!eval(hasShownPrompt));
    }, 3000);
  }, []);

  if (!showPrompt) return null;

  const renderButtons = () => {
    return (
      <Grid item xs={12} style={{ textAlign: "center" }}>
        <BackdropButton
          color="white"
          style={{ display: "inline" }}
          onClick={() => {
            setShowPrompt(false);
            window.localStorage.setItem("cookiePrompt", true + "");
            window.localStorage.setItem(
              "cookieAcceptDate",
              Date.now().toString()
            );
            setAllowCookies(true);
            window.localStorage.setItem(cookiesAcceptedKey, "true");
          }}
        >
          Accept
        </BackdropButton>

        <BackdropButton
          color="black"
          style={{ display: "inline", marginLeft: 15 }}
          onClick={() => {
            setShowPrompt(false);
            setAllowCookies(false);
            window.localStorage.setItem(cookiesAcceptedKey, "false");
            window.localStorage.setItem("cookiePrompt", true + "");
          }}
        >
          Not accept
        </BackdropButton>
      </Grid>
    );
  };

  // maybe save that people have accepted cookies?
  return (
    <Slide in={showPrompt} direction="up">
      <Grid
        container
        spacing={1}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,

          backgroundColor: "#001440",
          color: "white",
          padding: 15,
          boxShadow: "1px 1px 5px brown",
        }}
      >
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Typography>This website uses cookies.</Typography>
        </Grid>
        {renderButtons()}
        <Grid item xs={12}>
          <Typography>
            Read our{" "}
            <a style={{ color: "gray" }} href={privacyPolicyPage}>
              Privacy Policy
            </a>
          </Typography>

          <Typography>
            By playing you are accepting our{" "}
            <a style={{ color: "gray" }} href={termsOfUsePagePath}>
              terms of use
            </a>
            .
          </Typography>

          <Typography>
            Read about how we use{" "}
            <a style={{ color: "gray" }} href={cookiesInfoPagePath}>
              cookies
            </a>
          </Typography>
        </Grid>
      </Grid>
    </Slide>
  );
};

export default CookiePrompt;
