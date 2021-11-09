import { IPreGameSettings } from "../classes/Game";
import { IUserSettings } from "../classes/User";
import { IPlayerInfo } from "../shared-backend/shared-stuff";


export interface IStore {
    roomId: string
    setRoomId: React.Dispatch<React.SetStateAction<string>>
    players: IPlayerInfo[]
    setPlayers: React.Dispatch<React.SetStateAction<IPlayerInfo[]>>
    player: IPlayerInfo
    setPlayer: React.Dispatch<React.SetStateAction<IPlayerInfo>>
    preGameSettings: IPreGameSettings
    setPreGameSettings: React.Dispatch<React.SetStateAction<IPreGameSettings>>
    userSettings: IUserSettings
    setUserSettings: React.Dispatch<React.SetStateAction<IUserSettings>>
}