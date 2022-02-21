import { Fade } from "@mui/material";
import Modal from "@mui/material/Modal";
import React from "react";
import { getStyledColors, modalBackgroundColor } from "../../providers/theme";

interface IBasicDesktopModal {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
  outline?: boolean;
  color?: "white" | "black";
}

const BasicDesktopModal = (props: IBasicDesktopModal) => {
  const { color, backgroundColor } = getStyledColors(props.color ?? "black");
  return (
    <Modal open={props.open} onClose={props.onClose} style={{ border: 0 }}>
      <Fade in={props.open}>
        <div
          style={{
            transform: "translate(-50%, -25%)",
            position: "absolute",
            top: "25%",
            left: "50%",
            width: "75%",
            backgroundColor, //"#eeebdf",
            color,
            border: 0, //"2px solid #000",
            padding: 10,
            outline: props.outline ? "1px white" : 0,
            overflowY: "auto",
            maxHeight: "75%",
          }}
        >
          {props.children}
        </div>
      </Fade>
    </Modal>
  );
};

export default BasicDesktopModal;
