import { IUserGameSettings } from "../classes/User";
import { VehicleType, TrackName } from "../shared-backend/shared-stuff";

export interface IGameScene {
    togglePauseGame: () => void
    setUserGameSettings: (userGameSettings: IUserGameSettings) => void
    restartGame: () => void
    changeVehicle?: (vehicleType: VehicleType) => void
    changeTrack?: (trackName: TrackName) => void
}