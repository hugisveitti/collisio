import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { IEndOfRaceInfoPlayer, IScoreInfo } from "../../classes/Game";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { saveGameFinished } from "../../firebase/firebaseFunctions";
import { IEndOfGameData, startGame } from "../../game/GameScene";
import { IGameScene } from "../../game/IGameScene";
import { RaceGameScene } from "../../game/RaceGameScene";
import { TagGameScene } from "../../game/TagGameScene";
// import { startRaceGame } from "../../game/RaceGameScene";
import { UserContext } from "../../providers/UserProvider";
import {
  dts_game_finished,
  dts_player_finished,
  GameActions,
  std_game_data_info,
  std_player_disconnected,
  std_send_game_actions,
} from "../../shared-backend/shared-stuff";
import { startLowPolyTest } from "../../test-courses/lowPolyTest";
import { inTestMode } from "../../utils/settings";
import { frontPagePath } from "../Routes";
import { IStore } from "../store";
import EndOfGameModal from "./EndOfGameModal";
import GameSettingsModal from "./GameSettingsModal";
import ScoreInfoContainer from "./ScoreInfoContainer";

interface IGameRoom {
  socket: Socket;
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
    setEndOfGameData(data);
    if (!inTestMode) {
      saveGameFinished(data.endOfRaceInfo);
      props.socket.emit(dts_game_finished, data);
      // saveRaceData(data.playersData, data.endOfRaceInfo, (_gameDataInfo) => {
      // console.log("game data info", _gameDataInfo);
      // setGameDataInfo(_gameDataInfo);
      // });
    }
  };

  const handleUpdateScoreTable = (data: IScoreInfo) => {
    if (data) {
      setScoreInfo(data);
    }
  };

  const handlePlayerFinished = (data: IEndOfRaceInfoPlayer) => {
    props.socket.emit(dts_player_finished, data);
  };

  const updateSettings = (key: keyof IGameSettings, value: any) => {
    const newGameSettings = props.store.gameSettings;

    // @ts-ignore
    newGameSettings[key] = value;
    setLocalGameSetting(key, value);

    gameObject.setGameSettings(newGameSettings);
  };

  useEffect(() => {
    props.socket.on(std_player_disconnected, ({ playerName }) => {
      toast.warn(
        `${playerName} disconnected from game, logged in players can reconnect!`
      );
    });

    if (props.useTestCourse) {
      return startLowPolyTest(
        props.socket,
        props.store.gameSettings,
        handleEscPressed,
        (gameObject) => {
          setGameObject(gameObject);
        }
      );
    }

    if (!props.store.roomId && !inTestMode) {
      history.push(frontPagePath);
      toast.warn("No room connection, redirecting to frontpage");
      return null;
    }
    if (props.store.gameSettings.gameType === "ball") {
      console.warn("ball game not supported");
    }

    const CurrGameScene =
      props.store.gameSettings.gameType === "race"
        ? RaceGameScene
        : TagGameScene;

    startGame(
      CurrGameScene,
      props.socket,
      props.store.players,
      props.store.gameSettings,
      props.store.roomId,
      {
        escPressed: handleEscPressed,
        gameFinished: handelGameFinished,
        updateScoreTable: handleUpdateScoreTable,
        playerFinished: handlePlayerFinished,
      },
      (_gameObject) => {
        setGameObject(_gameObject);
      }
    );

    props.socket.on(std_game_data_info, (data: string[]) => {
      setGameDataInfo(gameDataInfo.concat(data));
    });

    props.socket.on(std_send_game_actions, (_gameActions: GameActions) => {
      setGameActions(_gameActions);
    });

    return () => {
      props.socket.off(std_player_disconnected);
      props.socket.off(std_game_data_info);
    };
  }, []);

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
      if (gameActions.toggleSound) {
        updateSettings("useSound", !props.store.gameSettings.useSound);
      }

      if (gameActions.toggleShadows) {
        updateSettings("useShadows", !props.store.gameSettings.useShadows);
      }

      if (gameActions.numberOfLaps) {
        updateSettings("numberOfLaps", gameActions.numberOfLaps);
      }

      if (gameActions.changeTrack) {
        gameObject.changeTrack(gameActions.changeTrack);
        updateSettings("trackName", gameActions.changeTrack);
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
        updateSettings={updateSettings}
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
      <ToastContainer />
    </React.Fragment>
  );
};

export default GameRoom;
