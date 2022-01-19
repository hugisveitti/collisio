import React from "react";
import { useHistory } from "react-router";
import { createClassNames } from "../../../utils/utilFunctions";
import "./backdrop-button.css";

interface IBackdropButton {
  children: JSX.Element | string;
  link?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const BackdropButton = (props: IBackdropButton) => {
  const history = useHistory();

  return (
    <div
      className={createClassNames("btn", props.disabled ? "disabled" : "")}
      onClick={() => {
        if (props.disabled) return;
        if (props.link) {
          history.push(props.link);
        } else {
          props.onClick();
        }
      }}
      style={{ ...props.style, backgroundColor: "rgb()" }}
    >
      {props.children}
    </div>
  );
};

export default BackdropButton;
