import React from "react";
import BackdropButton from "../button/BackdropButton";
import { frontPagePath } from "../Routes";

interface IToFrontPageButton {
  color?: "black" | "white";
}

const ToFrontPageButton = (props: IToFrontPageButton) => {
  return (
    <BackdropButton link={frontPagePath} color={props.color}>
      &lt; Back
    </BackdropButton>
  );
};

export default ToFrontPageButton;
