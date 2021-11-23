import React from "react";
import { Socket } from "socket.io-client";
import BasicModal from "../components/modal/BasicModal";
import NotLoggedInModal from "../components/NotLoggedInModal";
import { IStore } from "../components/store";
import { IUser } from "../firebase/firebaseFunctions";
import ControllerSettingsComponent from "./ControllerSettingsComponent";

interface IControllerSettingsModal {
  open: boolean;
  onClose: () => void;
  store: IStore;
  user: IUser;
  userLoggedIn: () => void;
  resetOrientation: () => void;
  socket: Socket;
}

const ControllerSettingsModal = (props: IControllerSettingsModal) => {
  if (!props.user) {
    return (
      <NotLoggedInModal
        onClose={props.onClose}
        infoText="To set user settings, you need to be logged in."
        onContinoueAsGuest={props.onClose}
        open={props.open}
        signInWithPopup
      />
    );
  }

  return (
    <BasicModal open={props.open} onClose={props.onClose}>
      <ControllerSettingsComponent
        onClose={props.onClose}
        resetOrientation={props.resetOrientation}
        userLoggedIn={props.userLoggedIn}
        socket={props.socket}
        user={props.user}
        store={props.store}
      />
    </BasicModal>
  );
};

export default ControllerSettingsModal;
