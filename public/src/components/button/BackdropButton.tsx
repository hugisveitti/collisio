import { CircularProgress } from "@mui/material";
import React from "react";
import { useHistory } from "react-router";
import { playBtnClickSound } from "../../sounds/gameSounds";
import { getDeviceType } from "../../utils/settings";
import { createClassNames } from "../../utils/utilFunctions";
import "./backdrop-button.css";

interface IBackdropButton {
  children: React.ReactNode;
  link?: string;
  onClick?: () => void;
  beforeClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  startIcon?: JSX.Element;
  color?: "white" | "black";
  center?: boolean;
  width?: number | string;
  loading?: boolean;
  notPlaySound?: boolean;
}

const BackdropButton = (props: IBackdropButton) => {
  const history = useHistory();
  const onMobile = getDeviceType() === "mobile";
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

        if (props.beforeClick) {
          props.beforeClick();
        }
        if (!onMobile && !props.notPlaySound) {
          playBtnClickSound();
        }
        if (props.link) {
          history.push(props.link);
        } else if (props.onClick) {
          props.onClick();
        }
      }}
      style={{
        margin: props.center ? "auto" : "",
        width: props.width,
        ...props.style,
      }}
    >
      {props.loading ? (
        <CircularProgress />
      ) : (
        <>
          {props.startIcon && (
            <span className="btn__icon">{props.startIcon}</span>
          )}
          <span>{props.children}</span>
        </>
      )}
    </div>
  );
};

export default BackdropButton;
