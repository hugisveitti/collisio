import { Button, Collapse, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

/**
 * TODO:
 * Need to learn how to have the user decide how many cookies she would like to use
 */

const CookiePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(true);

  useEffect(() => {
    const hasShownPrompt = window.localStorage.getItem("cookiePrompt");
    setShowPrompt(!eval(hasShownPrompt));
  }, []);

  if (!showPrompt) return null;

  return (
    <Collapse in={showPrompt} easing="exit">
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
          <Typography>This website uses cookies</Typography>
        </Grid>
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Button
            variant="contained"
            style={{
              backgroundColor: "#02075d",
              color: "white",
            }}
            onClick={() => {
              setShowPrompt(false);
              window.localStorage.setItem("cookiePrompt", true + "");
            }}
          >
            I Understand
          </Button>
        </Grid>
      </Grid>
    </Collapse>
  );
};

export default CookiePrompt;
