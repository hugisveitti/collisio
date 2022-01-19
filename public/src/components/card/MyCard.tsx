import Card from "@mui/material/Card";
import React from "react";
import "./card.css";

interface IMyCard {
  color?: "white" | "black";
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const MyCard = (props: IMyCard) => {
  return (
    <Card
      className="card"
      style={{
        ...props.style,
        backgroundColor:
          props.color === "black"
            ? "rgba(0,0,0, 0.82)"
            : "rgba(255,255,255,0.8)",
      }}
      variant="outlined"
    >
      {props.children}
    </Card>
  );
};

export default MyCard;
