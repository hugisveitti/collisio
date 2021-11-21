import { Scene3D } from "enable3d";
import { IUserGameSettings } from "../classes/User";
import { VehicleType, TrackName } from "../shared-backend/shared-stuff";

export interface IGameScene extends Scene3D {
    togglePauseGame: () => void
    setUserGameSettings: (userGameSettings: IUserGameSettings) => void
    restartGame: () => void
    changeVehicle?: (vehicleType: VehicleType) => void
    changeTrack?: (trackName: TrackName) => void
    resetVehicleCallback: (vehicleNumber: number) => void
}