import Grid from "@mui/material/Grid";
import React from "react";
import BackdropContainer from "../components/backdrop/BackdropContainer";

interface ITOU {}

const TermsOfUse = (prosp: ITOU) => {
  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <h3>Terms of use</h3>
        </Grid>
        <Grid item xs={12}>
          <p>
            In this text we refers to the company and the team behind Collisio.
          </p>
          <p>
            By playing the game you accept the terms of use. These terms include
            being a fair and honest player. You shall not use an offended
            display name, you shall not cheat either, for example by recording a
            dishonest time. You shall not use any vehicles, tracks, items or
            colors for which you have not bought with the in game currency,
            currency which you have earned through a honest way, that is by
            either racing and earning coins or by buying coins.
          </p>
          <p>
            If we suspect a player breaking the terms of use, we allow ourselves
            to block the player from accesing their account.
          </p>
          <p>
            Copying and using any content (3d models, music, etc.) found on this
            site is strictly prohibeted.
          </p>
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default TermsOfUse;
