import Card from "@mui/material/Card";
import React from "react";
import "./card.css";

interface IMyCard {
  color?: "white" | "black";
  children: React.ReactNode;
  style?: React.CSSProperties;
  nonOpague?: boolean;
}

const MyCard = (props: IMyCard) => {
  const alpha = props.nonOpague ? 1 : 0.82;
  return (
    <Card
      className="card"
      style={{
        ...props.style,
        backgroundColor:
          props.color === "black"
            ? `rgba(0,0,0, ${alpha})`
            : `rgba(255,255,255, ${alpha})`,
      }}
      variant="outlined"
    >
      {props.children}
    </Card>
  );
};

export default MyCard;
