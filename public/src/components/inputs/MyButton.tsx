import React from "react";
import { blue4 } from "../../providers/theme";
import "./MyButton.css";

interface IMyButton {
  onClick?: () => void;
  children: React.ReactNode;
}

const MyButton = (props: IMyButton) => {
  return (
    <div
      className="my-button"
      onClick={props.onClick}
      style={{
        backgroundColor: blue4,
        color: "white",
      }}
    >
      <span className="my-button-text">{props.children}</span>
    </div>
  );
};

export default MyButton;
