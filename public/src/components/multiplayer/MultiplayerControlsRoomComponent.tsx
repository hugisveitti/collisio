import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import ControllerSettingsModal from "../../mobile/ControllerSettingsModal";
import ControlsRoomComponent from "../../mobile/ControlsRoomComponent";
import { UserContext } from "../../providers/UserProvider";
import {
  defaultTokenData,
  ITokenData,
  MedalType,
} from "../../shared-backend/medalFuncions";
import {
  GameActions,
  mdts_game_settings_changed,
  MobileControls,
  mts_controls,
  MTS_SENDINTERVAL_MS,
  mts_send_game_actions,
  stm_game_settings_changed_callback,
} from "../../shared-backend/shared-stuff";
import { getSocket } from "../../utils/connectSocket";
import { isIphone } from "../../utils/settings";
import { IStore } from "../store";
import DeviceOrientationPermissionComponent from "../waitingRoom/DeviceOrientationPermissionComponent";

interface IMultiplayerControlsRoomComponent {
  store: IStore;
}

let tokenData: ITokenData = defaultTokenData;
const controller = new MobileControls();
const gameActions = new GameActions();

const MultiplayerControlsRoomComponent = (
  props: IMultiplayerControlsRoomComponent
) => {
  const user = useContext(UserContext);
  const socket = getSocket();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [gameSettingsLoading, setGameSettingsLoading] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [raceMedalData, setRaceMedalData] = useState(
    undefined as undefined | { coins: number; XP: number; medal: MedalType }
  );

  const [resetOrientation, setResetOrientation] = useState(false);

  const [sendControlsInterval, setSendControlsInterval] = useState(
    undefined as undefined | NodeJS.Timer
  );

  const [orientation, setOrientation] = useState({
    gamma: 0,
    beta: 0,
    alpha: 0,
  });

  const createSendControlsInterval = () => {
    const _sendControlsInterval = setInterval(() => {
      socket.emit(mts_controls, controller);
      // setSteeringDirection(getSteeringDirection());
      const { gamma, beta, alpha } = controller;
      setOrientation({
        gamma,
        beta,
        alpha,
      });
      // set fps
    }, 1000 / 45);

    setSendControlsInterval(_sendControlsInterval);
  };

  useEffect(() => {
    createSendControlsInterval();
  }, []);

  const resetDeviceOrientationListener = () => {
    toast("Resetting orientation");
    setShowPermissionModal(true);
    setResetOrientation(!resetOrientation);
  };

  const handleSendGameSettings = () => {
    // if (!props.store.player.isLeader) {
    //   setSettingsModalOpen(false);
    //   setGameSettingsLoading(false);
    //   return;
    // }
    socket.emit(mdts_game_settings_changed, {
      gameSettings: props.store.gameSettings,
    });
    sendGameActions();
    // setGameSettingsLoading(true);

    // /** if the modal doesn't close, then just close it*/
    // const timout = setTimeout(() => {
    //   setSettingsModalOpen(false);
    //   setGameSettingsLoading(false);
    // }, 1000);

    // socket.once(stm_game_settings_changed_callback, () => {
    //   clearTimeout(timout);
    //   setSettingsModalOpen(false);
    //   setGameSettingsLoading(false);
    //   //   gameActions.pause = false;
    //   sendGameActions();
    // });
  };

  const sendGameActions = () => {
    socket.emit(mts_send_game_actions, gameActions);
    gameActions.pause = false;
    gameActions.restart = false;
  };

  return (
    <React.Fragment>
      <ControllerSettingsModal
        userLoggedIn={() => {}}
        resetOrientation={resetDeviceOrientationListener}
        open={settingsModalOpen}
        onClose={() => {
          handleSendGameSettings();
        }}
        user={user}
        store={props.store}
        socket={socket}
        gameActions={gameActions}
        loading={gameSettingsLoading}
      />
      <ControlsRoomComponent
        handlePausePressed={() => {
          // if (props.store.player.isLeader) {
          //   gameActions.pause = true;
          //   sendGameActions();
          // }
          setSettingsModalOpen(true);
        }}
        gameActions={gameActions}
        controller={controller}
        orientation={orientation}
        resetOrientation={resetOrientation}
        raceMedalData={raceMedalData}
      />

      <DeviceOrientationPermissionComponent
        onMobile={true}
        onIphone={isIphone()}
        showModal={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
    </React.Fragment>
  );
};

export default MultiplayerControlsRoomComponent;
