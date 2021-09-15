import { IGameSettings, IPlayerInfo } from "../classes/Game";

export interface IStore {
    roomName: string
    setRoomName: React.Dispatch<React.SetStateAction<string>>
    players: IPlayerInfo[]
    setPlayers: React.Dispatch<React.SetStateAction<IPlayerInfo[]>>
    player: IPlayerInfo
    setPlayer: React.Dispatch<React.SetStateAction<IPlayerInfo>>
    gameSettings: IGameSettings
    setGameSettings: React.Dispatch<React.SetStateAction<IGameSettings>>
}