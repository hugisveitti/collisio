
import { Scene3D } from "enable3d";
import { Vector3 } from "three"
import { IGameSettings } from "../classes/localGameSettings";
import { VehicleType, TrackName } from "../shared-backend/shared-stuff";

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
    //  getClosestGround: (pos: Vector3) => Vector3
}