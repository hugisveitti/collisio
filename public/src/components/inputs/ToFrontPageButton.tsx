import Button from "@mui/material/Button";
import React from "react";
import { useHistory } from "react-router";
import { basicColor } from "../../providers/theme";
import BackdropButton from "../backdrop/button/BackdropButton";
import { frontPagePath } from "../Routes";

const ToFrontPageButton = () => {
  return (
    <BackdropButton link={frontPagePath}>Back to front page</BackdropButton>
  );

  // return (
  //   <Button
  //     disableElevation
  //     style={{ backgroundColor: basicColor }}
  //     variant="contained"
  //   >
  //     <a style={{ textDecoration: "none" }} href={frontPagePath}>
  //       Back to front page
  //     </a>
  //   </Button>
  // );
};

export default ToFrontPageButton;
