import { IGameSettings, IPlayerInfo } from "../classes/Game";
import { IUserSettings } from "../classes/User";


export interface IStore {
    roomId: string
    setRoomId: React.Dispatch<React.SetStateAction<string>>
    players: IPlayerInfo[]
    setPlayers: React.Dispatch<React.SetStateAction<IPlayerInfo[]>>
    player: IPlayerInfo
    setPlayer: React.Dispatch<React.SetStateAction<IPlayerInfo>>
    gameSettings: IGameSettings
    setGameSettings: React.Dispatch<React.SetStateAction<IGameSettings>>
    userSettings: IUserSettings
    setUserSettings: React.Dispatch<React.SetStateAction<IUserSettings>>
}