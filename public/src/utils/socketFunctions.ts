import { Socket } from "socket.io-client";
import { mdts_start_game, IPlayerInfo, std_start_game_callback, } from "../shared-backend/shared-stuff";
import { ISocketCallback } from "./connectSocket";


export const sendPlayerInfoChanged = (socket: Socket, newPlayerInfo: IPlayerInfo) => {
    socket.emit("player-info-changed", newPlayerInfo)
}

export const socketHandleStartGame = (socket: Socket, callback: (res: ISocketCallback) => void) => {
    socket.emit(mdts_start_game);
    socket.once(std_start_game_callback, (response: ISocketCallback) => {
        callback(response)
    });
}