import React from "react";
import { useHistory } from "react-router";
import { createClassNames } from "../../utils/utilFunctions";
import "./backdrop-button.css";

interface IBackdropButton {
  children: React.ReactNode;
  link?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  startIcon?: JSX.Element;
  color?: "white" | "black";
  center?: boolean;
  width?: number;
}

const BackdropButton = (props: IBackdropButton) => {
  const history = useHistory();
  const color = props.color ?? "black";

  return (
    <div
      className={createClassNames(
        "btn",
        props.disabled ? "disabled" : "",
        color === "black" ? "btn--black" : "btn--white"
      )}
      onClick={() => {
        if (props.disabled) return;
        if (props.link) {
          history.push(props.link);
        } else if (props.onClick) {
          props.onClick();
        }
      }}
      style={{
        ...props.style,
        margin: props.center ? "auto" : "",
        width: props.width,
      }}
    >
      {props.startIcon && <span className="btn__icon">{props.startIcon}</span>}
      <span>{props.children}</span>
    </div>
  );
};

export default BackdropButton;
