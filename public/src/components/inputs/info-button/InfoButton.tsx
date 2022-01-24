import Help from "@mui/icons-material/Help";
import { Collapse } from "@mui/material";
import React, { useState } from "react";
import BackdropButton from "../../button/BackdropButton";

interface IInfoButton {
  infoText: string;
}

const InfoButton = (props: IInfoButton) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <BackdropButton startIcon={<Help />} onClick={() => setOpen(!open)}>
        Info
      </BackdropButton>
      <Collapse in={open}>
        <p>{props.infoText}</p>
      </Collapse>
    </div>
  );
};

export default InfoButton;
