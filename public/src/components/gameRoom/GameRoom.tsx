import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { IGameScene } from "../../game/IGameScene";
// import { startRaceGame } from "../../game/RaceGameScene";
import { UserContext } from "../../providers/UserProvider";
import { startLowPolyTest } from "../../test-courses/lowPolyTest";
import GameSettingsModal from "./GameSettingsModal";
import { frontPagePath } from "../Routes";
import { IStore } from "../store";
import EndOfGameModal from "./EndOfGameModal";
import { IEndOfGameData, startGame } from "../../game/GameScene";
import { inTestMode } from "../../utils/settings";
import {
  IEndOfRaceInfoGame,
  IEndOfRaceInfoPlayer,
  IRaceTimeInfo,
  IScoreInfo,
} from "../../classes/Game";
import ScoreInfoContainer from "./ScoreInfoContainer";
import {
  dts_game_finished,
  dts_player_finished,
  std_game_data_info,
} from "../../shared-backend/shared-stuff";
import { saveGameFinished } from "../../firebase/firebaseFunctions";
import { RaceGameScene } from "../../game/RaceGameScene";
import { TagGameScene } from "../../game/TagGameScene";

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
  const [gameObject, setGameObject] = useState({} as IGameScene);
  const [endOfGameModalOpen, setEndOfGameModalOpen] = useState(false);
  const [endOfGameData, setEndOfGameData] = useState({} as IEndOfGameData);
  const [scoreInfo, setScoreInfo] = useState({} as IScoreInfo);
  /** interesting information about the game that can be retrieved when saving the data */
  const [gameDataInfo, setGameDataInfo] = useState([] as string[]);

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

  useEffect(() => {
    props.socket.on("player-disconnected", ({ playerName }) => {
      toast.warn(
        `${playerName} disconnected from game, logged in players can reconnect!`
      );
    });

    if (props.useTestCourse) {
      return startLowPolyTest(
        props.socket,
        props.store.preGameSettings,
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
    if (props.store.preGameSettings.gameType === "ball") {
      console.warn("ball game not supported");
    }

    const CurrGameScene =
      props.store.preGameSettings.gameType === "race"
        ? RaceGameScene
        : TagGameScene;

    startGame(
      CurrGameScene,
      props.socket,
      props.store.players,
      props.store.preGameSettings,
      props.store.userSettings.userGameSettings,
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

    return () => {
      props.socket.emit("quit-room");
      props.socket.off("player-disconnected");
      props.socket.off(std_game_data_info);
    };
  }, []);

  return (
    <React.Fragment>
      <GameSettingsModal
        gameObject={gameObject}
        open={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          if (gameObject) {
            gameObject.togglePauseGame();
          }
        }}
        store={props.store}
        userId={user?.uid}
        isTestMode={props.isTestMode}
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
