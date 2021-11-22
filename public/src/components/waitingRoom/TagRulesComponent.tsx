import { Typography } from "@mui/material";
import React from "react";

const TagRulesComponent = () => {
  return (
    <React.Fragment>
      <Typography>
        The objective of the game is to collect coins and not be it.
      </Typography>
      <Typography>The rules of tag are the following.</Typography>
      <Typography>
        One random person begins being it. Everyone will start with a red
        colored car, excpet the one who is it will be yellow.
      </Typography>
      <Typography>
        Coins are collected by driving into them. The person who is it cannot
        collect coins.
      </Typography>

      <Typography>
        The person who is it, tags other players by crashing into them. There
        will be a brief period of time when the person who newly became it
        cannot tag back, so hurry driving away!
      </Typography>

      <Typography>The person who collected the most coins wins!</Typography>

      <Typography>If a player presses </Typography>
    </React.Fragment>
  );
};

export default TagRulesComponent;
