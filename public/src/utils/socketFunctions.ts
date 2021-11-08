import { Socket } from "socket.io-client";
import { IPlayerInfo } from "../classes/Game";
import { ISocketCallback } from "./connectSocket";


export const sendPlayerInfoChanged = (socket: Socket, newPlayerInfo: IPlayerInfo) => {
    socket.emit("player-info-changed", newPlayerInfo)
}

export const socketHandleStartGame = (socket: Socket, callback: (res: ISocketCallback) => void) => {
    socket.emit("handle-start-game");
    socket.once("handle-start-game-callback", (response: ISocketCallback) => {
        callback(response)
    });
}