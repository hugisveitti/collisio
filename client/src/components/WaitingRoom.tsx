import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import { IGameSettings, IPlayerInfo } from "../classes/Game";
import "../styles/main.css";
import { ISocketCallback } from "../utils/connectSocket";
import { getDeviceType, startGameAuto } from "../utils/settings";
import { controlsRoomPath, frontPagePath, gameRoomPath } from "./Routes";
import { IStore } from "./store";

interface IWaitingRoomProps {
  socket: Socket;
  store: IStore;
}

const WaitingRoom = (props: IWaitingRoomProps) => {
  const history = useHistory();
  const deviceType = getDeviceType();

  if (!props.store.roomId) {
    history.push(frontPagePath);
  }

  useEffect(() => {
    props.socket.on("player-joined", ({ players: _players }) => {
      props.store.setPlayers(_players);
    });

    props.socket.emit("in-waiting-room");
    if (deviceType === "mobile") {
      props.socket.on("handle-game-starting", () => {
        history.push(controlsRoomPath);
      });
    } else {
      props.socket.on("player-disconnected", ({ playerName }) => {
        toast.warn(`${playerName} disconnected from waiting room`);
      });
    }
  }, []);

  useEffect(() => {
    if (startGameAuto) {
      if (props.store.players.length > 0) {
        handleStartGame();
      }
    }
  }, [props.store.players]);

  const sendTeamChange = (newTeamNumber: number) => {
    props.socket.emit("team-change", { newTeamNumber });
  };

  const handleStartGame = () => {
    props.socket.emit("handle-start-game");
    props.socket.once("handle-start-game-callback", (data: ISocketCallback) => {
      if (data.status === "success") {
        history.push(gameRoomPath);
      } else {
        toast.error(data.message);
      }
    });
  };

  return (
    <div className="container">
      <h1 className="center">Waiting room</h1>
      <br />
      <Link to={frontPagePath}>Back to front page</Link>

      <br />
      <br />

      <h3 className="center">Players in room {props.store.roomId}</h3>
      <div id="player-list">
        {props.store.players.map((player: IPlayerInfo, i: number) => {
          return (
            <div className="player-name" key={player.playerName}>
              <span className="player-name-span">{player.playerName}</span>
              {deviceType === "mobile" &&
              props.store.player?.playerNumber === player.playerNumber ? (
                <div className="team-select-container">
                  <label className="team-select-radio-button">
                    <input
                      type="radio"
                      id="team0"
                      name={`team-pick-${i}`}
                      value={0}
                      checked={player.teamNumber === 0}
                      onChange={() => {
                        sendTeamChange(0);
                      }}
                    />
                    Team 0
                  </label>
                  <label className="team-select-radio-button">
                    <input
                      type="radio"
                      id="team1"
                      name={`team-pick-${i}`}
                      value={1}
                      checked={player.teamNumber === 1}
                      onChange={() => {
                        sendTeamChange(1);
                      }}
                    />
                    Team 1
                  </label>
                </div>
              ) : (
                <span className="team-select-container">
                  TEAM: {player.teamNumber}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {deviceType === "desktop" && (
        <div>
          <h4 className="center">Game settings</h4>
          {props.store.gameSettings.typeOfGame === "ball" ? (
            <>
              <label>Ball radius</label>
              <br />
              <br />
              <input
                className="large-input"
                type="text"
                value={props.store.gameSettings.ballRadius}
                onChange={(ev) => {
                  const newGameSettings = {
                    ...props.store.gameSettings,
                    ballRadius: +ev.target.value,
                  } as IGameSettings;
                  props.store.setGameSettings(newGameSettings);
                }}
              />
            </>
          ) : (
            <>
              <label>Number of laps</label>
              <br />
              <br />
              <input
                className="large-input"
                type="number"
                value={props.store.gameSettings.numberOfLaps}
                onChange={(ev) => {
                  const newGameSettings = {
                    ...props.store.gameSettings,
                    numberOfLaps: +ev.target.value,
                  } as IGameSettings;
                  props.store.setGameSettings(newGameSettings);
                }}
              />
              <br />
              <select
                name="race-track"
                onChange={(e) => {
                  const newGameSettings = {
                    ...props.store.gameSettings,
                    trackName: e.target.value,
                  } as IGameSettings;
                  props.store.setGameSettings(newGameSettings);
                }}
              >
                <option value="track">Simple track</option>
                <option value="town-track">Town track</option>
              </select>
            </>
          )}

          <br />
          <h6 className="center">Type of game</h6>

          <label>
            <input
              type="radio"
              name="game-type"
              onChange={() =>
                props.store.setGameSettings({
                  ...props.store.gameSettings,
                  typeOfGame: "race",
                })
              }
              checked={props.store.gameSettings.typeOfGame === "race"}
            />
            Race
          </label>
          <label>
            <input
              type="radio"
              name="game-type"
              onChange={() =>
                props.store.setGameSettings({
                  ...props.store.gameSettings,
                  typeOfGame: "ball",
                })
              }
              checked={props.store.gameSettings.typeOfGame === "ball"}
            />
            Ball
          </label>

          <br />
          <br />

          <button className="large-input" onClick={handleStartGame}>
            Start game
          </button>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default WaitingRoom;
