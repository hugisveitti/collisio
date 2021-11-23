import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { cardBackgroundColor } from "../../providers/theme";

const TagRulesComponent = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card
      style={{
        backgroundColor: cardBackgroundColor,
        textAlign: "left",
        maxWidth: 500,
        margin: "auto",
      }}
    >
      <CardHeader
        subheader="Rules of tag"
        action={
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      <Collapse in={open}>
        <CardContent>
          <Typography>
            The objective of the game is to collect coins and not be it.
          </Typography>
          <Typography>The rules of tag are the following.</Typography>
          <Typography>
            One random person begins being it. Everyone will start with a red
            colored car, excpet the one who is it will be yellow.
          </Typography>
          <Typography>
            Coins are collected by driving into them. The person who is it
            cannot collect coins.
          </Typography>

          <Typography>
            The person who is it, tags other players by crashing into them.
            There will be a brief period of time when the person who newly
            became it cannot tag back, so hurry driving away!
          </Typography>

          <Typography>
            If a player presses reset, that player becomes it.
          </Typography>

          <Typography>The person who collected the most coins wins!</Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default TagRulesComponent;
