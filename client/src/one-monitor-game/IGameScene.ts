import { IUserGameSettings } from "../classes/User";
import { VehicleType } from "../vehicles/VehicleConfigs";

export interface IGameScene {
    togglePauseGame: () => void
    setUserGameSettings: (userGameSettings: IUserGameSettings) => void
    restartGame: () => void
    changeVehicle?: (vehicleType: VehicleType) => void
}