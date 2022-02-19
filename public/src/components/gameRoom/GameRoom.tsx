import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify/";
import {
  getGameSceneClass,
  IEndOfRaceInfoPlayer,
  IScoreInfo,
} from "../../classes/Game";
import {
  IGameSettings,
  setAllLocalGameSettings,
} from "../../classes/localGameSettings";
import { saveRaceDataGame } from "../../firebase/firestoreGameFunctions";
import { startGame } from "../../game/GameScene";
import { IEndOfGameData, IGameScene } from "../../game/IGameScene";
import { UserContext } from "../../providers/UserProvider";
import {
  dts_back_to_waiting_room,
  dts_player_finished,
  GameActions,
  std_game_data_info,
  std_player_disconnected,
  std_quit_game,
  std_send_game_actions,
  stmd_game_settings_changed,
} from "../../shared-backend/shared-stuff";
import { startLowPolyTest } from "../../test-courses/lowPolyTest";
import { disconnectSocket, getSocket } from "../../utils/connectSocket";
import { inTestMode } from "../../utils/settings";
import { clearBackdropCanvas } from "../backdrop/backdropCanvas";
import { connectPagePath, frontPagePath, gameRoomPath } from "../Routes";
import { IStore } from "../store";
import EndOfGameModal from "./EndOfGameModal";
import GameSettingsModal from "./GameSettingsModal";

interface IGameRoom {
  store: IStore;
  useTestCourse?: boolean;
  isTestMode?: boolean;
}

let currentRaceInfo = [];
let gameObject: IGameScene | undefined;

const GameRoom = React.memo((props: IGameRoom) => {
  // this breaks iphone
  // if (!props.store.roomId) {
  //   window.location.href = frontPagePath;
  // }
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  // const [gameObject, setGameObject] = useState(undefined as IGameScene);
  const [endOfGameModalOpen, setEndOfGameModalOpen] = useState(false);
  const [endOfGameData, setEndOfGameData] = useState({} as IEndOfGameData);
  const [scoreInfo, setScoreInfo] = useState({} as IScoreInfo);
  /** interesting information about the game that can be retrieved when saving the data */
  const [gameDataInfo, setGameDataInfo] = useState([] as string[]);
  const [gameActions, setGameActions] = useState(new GameActions());

  const user = useContext(UserContext);
  const history = useHistory();
  const socket = getSocket();
  const handleEscPressed = () => {
    // basically have to create a modal in the game class and show it there...
    setSettingsModalOpen(!settingsModalOpen);
  };

  useEffect(() => {
    clearBackdropCanvas();
  }, []);

  const handelGameFinished = (data: IEndOfGameData) => {
    setEndOfGameModalOpen(true);
    saveRaceDataGame(
      data.endOfRaceInfo,
      (res) => {
        if (res.status === "success") {
          currentRaceInfo = [res.message].concat(currentRaceInfo);
          setGameDataInfo(currentRaceInfo);
        }
        if (res.activeBracketNode) {
          // will this work?
          props.store.activeBracketNode = res.activeBracketNode;
          // i dont think this does anything here
          props.store.setActiveBracketNode(res.activeBracketNode);
        }
      },
      props.store.activeBracketNode
    );
    setEndOfGameData(data);
  };

  const handleUpdateScoreInfo = (data: IScoreInfo) => {
    if (data) {
      setScoreInfo(data);
    }
  };

  const handlePlayerFinished = (data: IEndOfRaceInfoPlayer) => {
    socket.emit(dts_player_finished, data);
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
    currentRaceInfo = [];
    setGameDataInfo([]);
    setEndOfGameModalOpen(false);
    setEndOfGameData({});
    setSettingsModalOpen(false);
  };

  if (!socket && !inTestMode) {
    history.push(frontPagePath);
    return null;
  }

  useEffect(() => {
    socket.on(std_player_disconnected, ({ playerName }) => {
      toast.warn(`${playerName} disconnected from game, they can reconnect!`);
    });

    if (props.useTestCourse) {
      return startLowPolyTest(
        socket,
        props.store.gameSettings,
        handleEscPressed,
        (_gameObject) => {
          //    setGameObject(gameObject);
          gameObject = _gameObject;
        }
      );
    }

    if (!props.store.roomId && !inTestMode) {
      history.push(frontPagePath);
      return null;
    }

    props.store.setPreviousPage(gameRoomPath);

    const CurrGameScene = getGameSceneClass(props.store.gameSettings.gameType);

    startGame(
      CurrGameScene,
      {
        socket: socket,
        players: props.store.players,
        gameSettings: props.store.gameSettings,
        roomId: props.store.roomId,
        gameRoomActions: {
          escPressed: handleEscPressed,
          gameFinished: handelGameFinished,
          updateScoreInfo: handleUpdateScoreInfo,
          playerFinished: handlePlayerFinished,
          closeModals: handleCloseModals,
        },
        tournament: props.store.tournament,
      },
      (_gameObject) => {
        // setGameObject(_gameObject);
        gameObject = _gameObject;
        gameObjectCreated();
      }
    );

    socket.on(
      std_game_data_info,
      (data: {
        playerId: string;
        setPersonalBest: boolean;
        gameDataInfo: string[];
      }) => {
        const {
          setPersonalBest,
          playerId,
          gameDataInfo: newGameDataInfo,
        } = data;
        if (setPersonalBest) {
          gameObject.saveDriveRecording(playerId);
        }
        currentRaceInfo = currentRaceInfo.concat(newGameDataInfo);
        setGameDataInfo(currentRaceInfo);
      }
    );

    socket.on(std_send_game_actions, (_gameActions: GameActions) => {
      setGameActions(_gameActions);
    });

    socket.once(std_quit_game, async () => {
      disconnectSocket();

      await gameObject.destroyGame();
      gameObject = undefined;

      history.push(connectPagePath);
      // dont want to do this, because of the "enter game" button and the music
      //  window.location.href = connectPagePath;
    });

    return () => {
      gameObject?.destroyGame();
      socket?.disconnect();

      // maybe these off dont matter if we disconnect?
      socket.off(std_send_game_actions);
      socket.off(std_game_data_info);
      socket.off(std_player_disconnected);
      socket.off(std_quit_game);
      socket.off(stmd_game_settings_changed);
    };
  }, []);

  const gameObjectCreated = () => {
    socket.on(stmd_game_settings_changed, (data) => {
      props.store.setGameSettings(data.gameSettings);
      if (data.gameSettings) {
        setAllLocalGameSettings(data.gameSettings);
      }
      if (gameObject) {
        gameObject.setGameSettings(data.gameSettings);
      }
    });

    return () => {
      socket.off(stmd_game_settings_changed);
      if (gameObject) {
        gameObject.destroyGame().then(() => {
          /** do some kind of back to waiting room? */
          socket.emit(dts_back_to_waiting_room, {});
        });
      }
    };
  };

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
        handleCloseModals();
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
        user={user}
        isTestMode={props.isTestMode}
        updateGameSettings={updateGameSettings}
        quitGame={(newPath: string) => {
          gameObject.destroyGame().then(() => {
            socket.disconnect();
            //     props.store.setSocket(undefined);
            //   setGameObject(undefined);
            gameObject = undefined;
            //   window.location.href = connectPagePath;
            history.push(newPath);
          });
        }}
        restarBtnPressed={() => {
          gameObject.restartGame();
          setSettingsModalOpen(false);
        }}
      />
      <EndOfGameModal
        open={endOfGameModalOpen}
        onClose={() => handleCloseModals()}
        data={endOfGameData}
        restartGame={() => {
          if (gameObject) {
            gameObject.restartGame();
          }
          handleCloseModals();
        }}
        scoreInfo={scoreInfo}
        gameDataInfo={gameDataInfo}
        quitGame={(newPath: string) => {
          gameObject.destroyGame().then(() => {
            socket.disconnect();
            //     props.store.setSocket(undefined);
            //   setGameObject(undefined);
            gameObject = undefined;
            //   window.location.href = connectPagePath;
            history.push(newPath);
          });
        }}
      />
      {/* <ScoreInfoContainer scoreInfo={scoreInfo} /> */}
    </React.Fragment>
  );
});

export default GameRoom;
