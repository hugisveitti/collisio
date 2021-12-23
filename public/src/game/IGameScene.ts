
import { Scene3D } from "enable3d";
import { Socket } from "socket.io-client";
import { IGameSettings } from "../classes/localGameSettings";
import { IVehicleSettings } from "../classes/User";
import { IPlayerInfo, MobileControls, TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { IGameRoomActions } from "./GameScene";

export interface IGameSceneConfig {
    socket?: Socket
    players: IPlayerInfo[]
    gameSettings: IGameSettings
    roomId?: string
    gameRoomActions: IGameRoomActions
    onlyMobile?: boolean
    mobileController?: MobileControls
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
    destroyGame: () => void
    setVehicleSettings: (vehicleNumber: number, vehicleSettings: IVehicleSettings) => void
    //  getClosestGround: (pos: Vector3) => Vector3

    gameSceneConfig: IGameSceneConfig
}