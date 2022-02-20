import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import React, { useState } from "react";

interface ICollabsibleCard {
  header: string;
  children: JSX.Element;
  color?: "black" | "white";
  maxWidth?: number | string;
}

const CollabsibleCard = (props: ICollabsibleCard) => {
  const [open, setOpen] = useState(false);

  const color = props.color ?? "white";
  const oppositeColor = color === "black" ? "white" : "black";
  const alphaColor =
    color === "black" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.83)";
  return (
    <Card
      variant="outlined"
      style={{
        margin: "auto",
        maxWidth: props.maxWidth ?? 600,

        backgroundColor: alphaColor,
        color: oppositeColor,
        borderRadius: 0,
      }}
    >
      <CardHeader
        style={{ cursor: "pointer" }}
        onClick={() => setOpen(!open)}
        subheader={props.header}
        action={
          <IconButton
            style={{ color: oppositeColor }}
            onClick={() => setOpen(!open)}
          >
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />
      <Collapse in={open}>
        <CardContent>{props.children}</CardContent>
      </Collapse>
    </Card>
  );
};

export default CollabsibleCard;
