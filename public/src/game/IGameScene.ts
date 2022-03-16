
import { ExtendedObject3D, Scene3D } from "enable3d";
import { Socket } from "socket.io-client";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IScoreInfo } from "../classes/Game";
import { GraphicsType, IGameSettings, IRoomSettings } from "../classes/localGameSettings";
import { Tournament } from "../classes/Tournament";
import { IVehicleSettings } from "../classes/User";
import { ICourse } from "../course/ICourse";
import { Powerup } from "../course/PowerupBox";
import { IPlayerInfo, MobileControls, TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";

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
    player?: IPlayerInfo
    players?: IPlayerInfo[]
    gameSettings: IGameSettings
    roomSettings: IRoomSettings
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
    setRoomSettings: (roomSettings: IRoomSettings) => void
    restartGame: () => void
    changeVehicle?: (vehicleNumber: number, vehicleType: VehicleType) => void
    changeTrack?: (trackName: TrackName) => void
    resetVehicleCallback: (vehicleNumber: number) => void
    setNeedsReload: (needsReload: boolean) => void
    destroyGame: () => Promise<void>
    setVehicleSettings: (vehicleNumber: number, vehicleSettings: IVehicleSettings, vehicleSetup: VehicleSetup) => void
    getGraphicsType: () => GraphicsType
    saveDriveRecording: (playerId: string) => void
    hitPowerup: (vehicle: ExtendedObject3D, powerup: Powerup) => void

    course: ICourse
    gameSceneConfig: IGameSceneConfig
    targetFPS: number
}