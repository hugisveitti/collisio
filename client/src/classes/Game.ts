import { MobileControls } from "../mobile/mobileGui"
import { VehicleControls } from "../utils/controls"



export interface IPlayerInfo {
    playerName: string
    bothConnected: boolean
    isLeader: boolean
    teamName: string
    playerNumber: number
    mobileControls: MobileControls
    vehicleControls: VehicleControls
    teamNumber: number
}

export interface IGameSettings {
    ballRadius: number
    typeOfGame: "ball" | "race"
}

