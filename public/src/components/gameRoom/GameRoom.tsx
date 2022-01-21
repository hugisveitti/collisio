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
import { inTestMode } from "../../utils/settings";
import { clearBackdropCanvas } from "../backdrop/backdropCanvas";
import { connectPagePath, frontPagePath, gameRoomPath } from "../Routes";
import { IStore } from "../store";
import EndOfGameModal from "./EndOfGameModal";
import GameSettingsModal from "./GameSettingsModal";
import ScoreInfoContainer from "./ScoreInfoContainer";

interface IGameRoom {
  store: IStore;
  useTestCourse?: boolean;
  isTestMode?: boolean;
}

let currentRaceInfo = [];

const GameRoom = React.memo((props: IGameRoom) => {
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

  useEffect(() => {
    console.log("clearing canvas in game room");
    clearBackdropCanvas();
  }, []);

  const handelGameFinished = (data: IEndOfGameData) => {
    setEndOfGameModalOpen(true);
    saveRaceDataGame(
      data.endOfRaceInfo,
      (res) => {
        console.log("res after saving game!", res);
        console.log("pre game data info ", res.message);
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

  const handleUpdateScoreTable = (data: IScoreInfo) => {
    if (data) {
      setScoreInfo(data);
    }
  };

  const handlePlayerFinished = (data: IEndOfRaceInfoPlayer) => {
    console.log("handle player finished", data);
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
    currentRaceInfo = [];
    setGameDataInfo([]);
    setEndOfGameModalOpen(false);
    setEndOfGameData({});
    setSettingsModalOpen(false);
  };

  if (!props.store.socket && !inTestMode) {
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
      return null;
    }

    props.store.setPreviousPage(gameRoomPath);

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
          //    updateScoreTable: handleUpdateScoreTable,
          playerFinished: handlePlayerFinished,
          closeModals: handleCloseModals,
        },
        tournament: props.store.tournament,
      },
      (_gameObject) => {
        setGameObject(_gameObject);
      }
    );

    props.store.socket.on(std_game_data_info, (data: string[]) => {
      console.log("old game data info", gameDataInfo);
      console.log("new game data info", data);
      currentRaceInfo = currentRaceInfo.concat(data);
      console.log("current race info ", currentRaceInfo);
      setGameDataInfo(currentRaceInfo);
    });

    props.store.socket.on(
      std_send_game_actions,
      (_gameActions: GameActions) => {
        setGameActions(_gameActions);
      }
    );

    props.store.socket.once(std_quit_game, () => {
      props.store.socket.disconnect();
      //     props.store.setSocket(undefined);
      setGameObject(undefined);

      console.log("going to /connect");
      history.push(connectPagePath);
    });

    return () => {
      props.store.socket?.disconnect();
      props.store.socket.off(std_send_game_actions);
      props.store.socket.off(std_game_data_info);
      props.store.socket.off(std_player_disconnected);
      props.store.socket.off(std_quit_game);
    };
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

    console.log("game obj changed", gameObject);
    return () => {
      props.store.socket.off(stmd_game_settings_changed);
      if (gameObject) {
        console.log("destroying game");
        gameObject.destroyGame().then(() => {
          console.log("game destoryd ");

          /** do some kind of back to waiting room? */
          props.store.socket.emit(dts_back_to_waiting_room, {});
        });
      }
    };
  }, [gameObject]);

  useEffect(() => {
    console.log("game actions changed", gameActions);
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
        isTestMode={props.isTestMode}
        updateGameSettings={updateGameSettings}
        quitGame={() => {
          gameObject.destroyGame().then(() => {
            props.store.socket.disconnect();
            //     props.store.setSocket(undefined);
            setGameObject(undefined);

            console.log("going to /connect");
            history.push(connectPagePath);
          });
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
      />
      {/* <ScoreInfoContainer scoreInfo={scoreInfo} /> */}
    </React.Fragment>
  );
});

export default GameRoom;
