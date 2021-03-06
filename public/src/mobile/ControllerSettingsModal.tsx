import CircularProgress from "@mui/material/CircularProgress";
import React from "react";
import { Socket } from "socket.io-client";
import { IUser } from "../classes/User";
import BasicModal from "../components/modal/BasicModal";
import NotLoggedInModal from "../components/NotLoggedInModal";
import { IStore } from "../components/store";
import { GameActions } from "../shared-backend/shared-stuff";
import ControllerSettingsComponent from "./ControllerSettingsComponent";

interface IControllerSettingsModal {
  open: boolean;
  onClose: () => void;
  store: IStore;
  user: IUser;
  userLoggedIn: () => void;
  resetOrientation: () => void;
  socket: Socket;
  gameActions: GameActions;

  loading: boolean;
}

const ControllerSettingsModal = (props: IControllerSettingsModal) => {
  // if (!props.user) {
  //   return (
  //     <NotLoggedInModal
  //       onClose={props.onClose}
  //       infoText="To set user settings, you need to be logged in."
  //       onContinoueAsGuest={props.onClose}
  //       open={props.open}
  //       signInWithPopup
  //     />
  //   );
  // }

  return (
    <BasicModal open={props.open} onClose={props.onClose}>
      {props.loading ? (
        <div style={{ marginTop: 25, textAlign: "center" }}>
          <CircularProgress />
        </div>
      ) : (
        <ControllerSettingsComponent
          onClose={props.onClose}
          resetOrientation={props.resetOrientation}
          userLoggedIn={props.userLoggedIn}
          user={props.user}
          store={props.store}
          gameActions={props.gameActions}
        />
      )}
    </BasicModal>
  );
};

export default ControllerSettingsModal;
