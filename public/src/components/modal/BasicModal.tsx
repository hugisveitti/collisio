import Modal from "@mui/material/Modal";
import { color } from "@mui/system";
import React from "react";
import { getStyledColors, modalBackgroundColor } from "../../providers/theme";

interface IBasicModal {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
}

const BasicModal = (props: IBasicModal) => {
  const { color, backgroundColor } = getStyledColors("black");

  return (
    <Modal open={props.open} onClose={props.onClose} style={{ border: 0 }}>
      <div
        style={{
          transform: "translate(-4%, -25%)",
          position: "absolute",
          top: "25%",
          left: "8%",
          backgroundColor,
          color,
          // border: "2px solid #000",
          padding: 10,
          outline: 0,
          maxHeight: "80%",
          overflowY: "auto",
        }}
      >
        {props.children}
      </div>
    </Modal>
  );
};

export default BasicModal;
