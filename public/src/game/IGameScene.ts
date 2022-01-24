
import { Scene3D } from "enable3d";
import { Socket } from "socket.io-client";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IScoreInfo } from "../classes/Game";
import { GraphicsType, IGameSettings } from "../classes/localGameSettings";
import { Tournament } from "../classes/Tournament";
import { IVehicleSettings } from "../classes/User";
import { ICourse } from "../course/ICourse";
import { IPlayerInfo, MobileControls, TrackName, VehicleType } from "../shared-backend/shared-stuff";

export interface IEndOfGameData {
    endOfRaceInfo?: IEndOfRaceInfoGame
}

export interface IGameRoomActions {
    escPressed?: () => void
    /** have the possibity to expand this interface to include other game types */
    gameFinished?: (data: IEndOfGameData) => void
    updateScoreInfo?: (data: IScoreInfo) => void
    playerFinished?: (data: IEndOfRaceInfoPlayer) => void
    closeModals?: () => void
}

export interface IGameSceneConfig {
    socket?: Socket
    players: IPlayerInfo[]
    gameSettings: IGameSettings
    roomId?: string
    gameRoomActions: IGameRoomActions
    onlyMobile?: boolean
    mobileController?: MobileControls
    tournament?: Tournament
}

export interface IGameScene extends Scene3D {
    togglePauseGame: () => void
    pauseGame: () => void
    unpauseGame: () => void
    setGameSettings: (gameSettings: IGameSettings) => void
    restartGame: () => void
    changeVehicle?: (vehicleNumber: number, vehicleType: VehicleType) => void
    changeTrack?: (trackName: TrackName) => void
    resetVehicleCallback: (vehicleNumber: number) => void
    setNeedsReload: (needsReload: boolean) => void
    destroyGame: () => Promise<void>
    setVehicleSettings: (vehicleNumber: number, vehicleSettings: IVehicleSettings) => void
    getGraphicsType: () => GraphicsType
    saveDriveRecording: (playerId: string) => void

    course: ICourse
    gameSceneConfig: IGameSceneConfig
}