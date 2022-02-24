import React from "react";
import BackdropButton from "../button/BackdropButton";
import { frontPagePath } from "../Routes";

interface IToFrontPageButton {
  color?: "black" | "white";
  beforeClick?: () => void;
}

const ToFrontPageButton = (props: IToFrontPageButton) => {
  return (
    <BackdropButton
      link={frontPagePath}
      color={props.color}
      beforeClick={props.beforeClick}
    >
      &lt; Back
    </BackdropButton>
  );
};

export default ToFrontPageButton;
