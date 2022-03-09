import React from "react";
import BackdropButton from "../button/BackdropButton";
import { frontPagePath } from "../Routes";

interface IToFrontPageButton {
  color?: "black" | "white";
  beforeClick?: () => void;
  text?: string;
  width?: number | string;
}

const ToFrontPageButton = (props: IToFrontPageButton) => {
  return (
    <BackdropButton
      link={frontPagePath}
      color={props.color}
      beforeClick={props.beforeClick}
      width={props.width}
    >
      {props.text ? props.text : <>&lt; Back</>}
    </BackdropButton>
  );
};

export default ToFrontPageButton;
