import { Button } from "@mui/material";
import React from "react";
import { basicColor } from "../../providers/theme";
import { frontPagePath } from "../Routes";

const ToFrontPageButton = () => {
  return (
    <Button
      disableElevation
      style={{ backgroundColor: basicColor }}
      variant="contained"
    >
      <a style={{ textDecoration: "none" }} href={frontPagePath}>
        Back to front page
      </a>
    </Button>
  );
};

export default ToFrontPageButton;
