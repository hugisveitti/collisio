import { Modal } from "@mui/material";
import React from "react";
import { modalBackgroundColor } from "../../providers/theme";

interface IBasicDesktopModal {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
}

const BasicDesktopModal = (props: IBasicDesktopModal) => {
  return (
    <Modal open={props.open} onClose={props.onClose} style={{ border: 0 }}>
      <div
        style={{
          transform: "translate(-50%, -25%)",
          position: "absolute",
          top: "25%",
          left: "50%",
          width: "75%",
          backgroundColor: modalBackgroundColor, //"#eeebdf",
          border: 0, //"2px solid #000",
          padding: 10,
          outline: 0,
        }}
      >
        {props.children}
      </div>
    </Modal>
  );
};

export default BasicDesktopModal;
