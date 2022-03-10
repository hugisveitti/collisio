import SettingsIcon from "@mui/icons-material/Settings";
import { IconButton } from "@mui/material";
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
  IRoomSettings,
  setAllLocalGameSettings,
  setAllLocalRoomSettings,
  setLocalRoomSetting,
} from "../../classes/localGameSettings";
import {
  IBestTime,
  saveRaceDataGame,
} from "../../firebase/firestoreGameFunctions";
import { startGame } from "../../game/GameScene";
import { IEndOfGameData, IGameScene } from "../../game/IGameScene";
import { UserContext } from "../../providers/UserProvider";
import { defaultOwnedTracks } from "../../shared-backend/ownershipFunctions";
import {
  dts_back_to_waiting_room,
  dts_player_finished,
  GameActions,
  mdts_game_settings_changed,
  std_game_data_info,
  std_player_disconnected,
  std_quit_game,
  std_send_game_actions,
  stmd_game_settings_changed,
} from "../../shared-backend/shared-stuff";
import { startLowPolyTest } from "../../test-courses/lowPolyTest";
import { disconnectSocket, getSocket } from "../../utils/connectSocket";
import { inTestMode } from "../../utils/settings";
import { getRandomItem } from "../../utils/utilFunctions";
import { clearBackdropCanvas } from "../backdrop/backdropCanvas";
import { connectPagePath, frontPagePath, gameRoomPath } from "../Routes";
import { IStore } from "../store";
import EndOfGameModal, { IGameDataInfo } from "./EndOfGameModal";
import GameSettingsModal from "./GameSettingsModal";

interface IGameRoom {
  store: IStore;
  useTestCourse?: boolean;
  isTestMode?: boolean;
}

let currentRaceInfo: IGameDataInfo = {
  bestTimesInfo: {},
};
let gameObject: IGameScene | undefined;

const GameRoom = React.memo((props: IGameRoom) => {
  // this breaks iphone

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  // const [gameObject, setGameObject] = useState(undefined as IGameScene);
  const [endOfGameModalOpen, setEndOfGameModalOpen] = useState(false);
  const [endOfGameData, setEndOfGameData] = useState({} as IEndOfGameData);
  const [scoreInfo, setScoreInfo] = useState({} as IScoreInfo);
  /** interesting information about the game that can be retrieved when saving the data */

  const [gameDataInfo, setGameDataInfo] = useState({
    bestTimesInfo: {},
  } as IGameDataInfo);
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
          currentRaceInfo.tournamentInfo = res.message;
          //   currentRaceInfo = [res.message].concat(currentRaceInfo);
          // const newGameDataInfo: IGameDataInfo = {
          //   ...gameDataInfo,
          //   tournamentInfo: res.message,
          // };
          setGameDataInfo(currentRaceInfo);
          //    setGameDataInfo(currentRaceInfo);
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

    gameObject.setGameSettings(newGameSettings);
  };

  const updateRoomSettings = (newRoomSettings: IRoomSettings) => {
    // this wont change right away so next if statement is okey
    props.store.setRoomSettings({ ...newRoomSettings });
    setAllLocalRoomSettings(newRoomSettings);

    if (props.store.roomSettings.gameType !== newRoomSettings.gameType) {
      toast("Not supported changing game type");
    } else {
      gameObject.setRoomSettings(newRoomSettings);
    }
  };

  const handleCloseModals = () => {
    currentRaceInfo = {
      bestTimesInfo: {},
    };
    setGameDataInfo({
      bestTimesInfo: {},
    });
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

    const CurrGameScene = getGameSceneClass(props.store.roomSettings.gameType);

    startGame(
      CurrGameScene,
      {
        socket: socket,
        players: props.store.players,
        gameSettings: props.store.gameSettings,
        roomSettings: props.store.roomSettings,
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
        gameDataInfo: IBestTime;
      }) => {
        const {
          setPersonalBest,
          playerId,
          gameDataInfo: newGameDataInfo,
        } = data;
        if (setPersonalBest) {
          gameObject.saveDriveRecording(playerId);
        }
        // currentRaceInfo = currentRaceInfo.concat(newGameDataInfo);
        currentRaceInfo.bestTimesInfo[playerId] = newGameDataInfo;
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
      if (data.gameSettings) {
        props.store.setGameSettings(data.gameSettings);
        setAllLocalGameSettings(data.gameSettings);
      }
      if (gameObject) {
        gameObject.setGameSettings(data.gameSettings);
      }
      if (data.roomSettings) {
        props.store.setRoomSettings(data.roomSettings);
        setAllLocalRoomSettings(data.roomSettings);
      }
      if (gameObject) {
        gameObject.setRoomSettings(data.roomSettings);
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
      if (gameActions.restart) {
        gameObject.restartGame();
        handleCloseModals();
      }
    }
  }, [gameActions]);

  return (
    <React.Fragment>
      <IconButton
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 9999,
          fontSize: 32,
        }}
        onClick={() => {
          setSettingsModalOpen(!settingsModalOpen);
        }}
      >
        <SettingsIcon />
      </IconButton>
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
        updateRoomSettings={updateRoomSettings}
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
        store={props.store}
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
            disconnectSocket();
            gameObject = undefined;
            history.push(newPath);
          });
        }}
        randomTrack={() => {
          // start by just getting one of the default owend tracks
          // TODO extend to all owned tracks
          let newTrack = getRandomItem(
            defaultOwnedTracks,
            props.store.roomSettings.trackName
          );
          const newRoomSettings: IRoomSettings = {
            ...props.store.roomSettings,
            trackName: newTrack,
          };

          props.store.setRoomSettings(newRoomSettings);
          gameObject.setRoomSettings(newRoomSettings);
          gameObject.restartGame();

          setLocalRoomSetting("trackName", newTrack);
          socket?.emit(mdts_game_settings_changed, {
            roomSettings: newRoomSettings,
          });
          handleCloseModals();
        }}
      />
      {/* <ScoreInfoContainer scoreInfo={scoreInfo} /> */}
    </React.Fragment>
  );
});

export default GameRoom;
