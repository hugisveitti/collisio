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
}

const CollabsibleCard = (props: ICollabsibleCard) => {
  const [open, setOpen] = useState(false);

  return (
    <Card
      variant="outlined"
      style={{ backgroundColor: "inherit", maxWidth: 600, margin: "auto" }}
    >
      <CardHeader
        onClick={() => setOpen(!open)}
        subheader={props.header}
        action={
          <IconButton onClick={() => setOpen(!open)}>
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
