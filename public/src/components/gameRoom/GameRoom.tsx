import { DocumentReference } from "@firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify/";
import { Socket } from "socket.io-client";
import {
  getGameSceneClass,
  IEndOfRaceInfoPlayer,
  IScoreInfo,
} from "../../classes/Game";
import {
  IGameSettings,
  setAllLocalGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { saveRaceDataGame } from "../../firebase/firestoreGameFunctions";

import { IEndOfGameData, startGame } from "../../game/GameScene";
import { IGameScene } from "../../game/IGameScene";
import { RaceGameScene } from "../../game/RaceGameScene";
import { TagGameScene } from "../../game/TagGameScene";
import { UserContext } from "../../providers/UserProvider";
import {
  dts_back_to_waiting_room,
  dts_player_finished,
  GameActions,
  std_game_data_info,
  std_player_disconnected,
  std_send_game_actions,
  stmd_game_settings_changed,
} from "../../shared-backend/shared-stuff";
import { startLowPolyTest } from "../../test-courses/lowPolyTest";
import { inTestMode } from "../../utils/settings";
import { frontPagePath } from "../Routes";
import { IStore } from "../store";
import EndOfGameModal from "./EndOfGameModal";
import GameSettingsModal from "./GameSettingsModal";
import ScoreInfoContainer from "./ScoreInfoContainer";

interface IGameRoom {
  store: IStore;
  useTestCourse?: boolean;
  isTestMode?: boolean;
}

const GameRoom = (props: IGameRoom) => {
  // this breaks iphone
  // if (!props.store.roomId) {
  //   window.location.href = frontPagePath;
  // }
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [gameObject, setGameObject] = useState(undefined as IGameScene);
  const [endOfGameModalOpen, setEndOfGameModalOpen] = useState(false);
  const [endOfGameData, setEndOfGameData] = useState({} as IEndOfGameData);
  const [scoreInfo, setScoreInfo] = useState({} as IScoreInfo);
  /** interesting information about the game that can be retrieved when saving the data */
  const [gameDataInfo, setGameDataInfo] = useState([] as string[]);
  const [gameActions, setGameActions] = useState(new GameActions());

  const user = useContext(UserContext);
  const history = useHistory();
  const handleEscPressed = () => {
    // basically have to create a modal in the game class and show it there...
    setSettingsModalOpen(!settingsModalOpen);
  };

  const handelGameFinished = (data: IEndOfGameData) => {
    setEndOfGameModalOpen(true);
    saveRaceDataGame(data.endOfRaceInfo);
    setEndOfGameData(data);
  };

  const handleUpdateScoreTable = (data: IScoreInfo) => {
    if (data) {
      setScoreInfo(data);
    }
  };

  const handlePlayerFinished = (data: IEndOfRaceInfoPlayer) => {
    props.store.socket.emit(dts_player_finished, data);
  };

  const updateGameSettings = (newGameSettings: IGameSettings) => {
    // this wont change right away so next if statement is okey
    props.store.setGameSettings({ ...newGameSettings });
    setAllLocalGameSettings(newGameSettings);

    if (props.store.gameSettings.gameType !== newGameSettings.gameType) {
      toast("Not supported changing game type");
    } else {
      gameObject.setGameSettings(newGameSettings);
    }
  };

  const handleCloseModals = () => {
    setEndOfGameModalOpen(false);
    setEndOfGameData({});
    setSettingsModalOpen(false);
  };

  if (!props.store.socket && !inTestMode) {
    toast.error("No room connected");
    history.push(frontPagePath);
    return null;
  }

  useEffect(() => {
    props.store.socket.on(std_player_disconnected, ({ playerName }) => {
      toast.warn(
        `${playerName} disconnected from game, logged in players can reconnect!`
      );
    });

    if (props.useTestCourse) {
      return startLowPolyTest(
        props.store.socket,
        props.store.gameSettings,
        handleEscPressed,
        (gameObject) => {
          setGameObject(gameObject);
        }
      );
    }

    if (!props.store.roomId && !inTestMode) {
      history.push(frontPagePath);
      toast.warn("No room connection found.");
      return null;
    }

    if (props.store.gameSettings.gameType === "ball") {
      console.warn("ball game not supported");
    }

    const CurrGameScene = getGameSceneClass(props.store.gameSettings.gameType);

    startGame(
      CurrGameScene,
      {
        socket: props.store.socket,
        players: props.store.players,
        gameSettings: props.store.gameSettings,
        roomId: props.store.roomId,
        gameRoomActions: {
          escPressed: handleEscPressed,
          gameFinished: handelGameFinished,
          updateScoreTable: handleUpdateScoreTable,
          playerFinished: handlePlayerFinished,
          closeModals: handleCloseModals,
        },
      },
      (_gameObject) => {
        setGameObject(_gameObject);
      }
    );

    props.store.socket.on(std_game_data_info, (data: string[]) => {
      console.log("old game data info", gameDataInfo);
      console.log("new game data info", data);
      setGameDataInfo(gameDataInfo.concat(data));
    });

    props.store.socket.on(
      std_send_game_actions,
      (_gameActions: GameActions) => {
        setGameActions(_gameActions);
      }
    );
  }, []);

  useEffect(() => {
    props.store.socket.on(stmd_game_settings_changed, (data) => {
      props.store.setGameSettings(data.gameSettings);
      if (data.gameSettings) {
        setAllLocalGameSettings(data.gameSettings);
      }
      if (gameObject) {
        gameObject.setGameSettings(data.gameSettings);
      }
    });
    return () => {
      props.store.socket.off(stmd_game_settings_changed);
      if (gameObject) {
        gameObject.destroyGame();
        /** do some kind of back to waiting room? */
        props.store.socket.emit(dts_back_to_waiting_room, {});
      }
    };
  }, [gameObject]);

  useEffect(() => {
    if (gameObject) {
      if (gameActions.pause) {
        setSettingsModalOpen(true);
        gameObject.pauseGame();
      } else {
        setSettingsModalOpen(false);
        gameObject.unpauseGame();
      }
      if (gameActions.restart) {
        gameObject.restartGame();
        setEndOfGameModalOpen(false);
        setSettingsModalOpen(false);
      }
    }
  }, [gameActions]);

  return (
    <React.Fragment>
      <GameSettingsModal
        gameObject={gameObject}
        open={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          if (gameObject) {
            gameObject.unpauseGame();
          }
        }}
        store={props.store}
        userId={user?.uid}
        isTestMode={props.isTestMode}
        updateGameSettings={updateGameSettings}
      />
      <EndOfGameModal
        open={endOfGameModalOpen}
        onClose={() => setEndOfGameModalOpen(false)}
        data={endOfGameData}
        restartGame={() => {
          if (gameObject) {
            gameObject.restartGame();
            setEndOfGameModalOpen(false);
          }
          setGameDataInfo([]);
        }}
        scoreInfo={scoreInfo}
        gameDataInfo={gameDataInfo}
      />
      <ScoreInfoContainer scoreInfo={scoreInfo} />
    </React.Fragment>
  );
};

export default GameRoom;
