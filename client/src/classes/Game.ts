import { MobileControls, VehicleControls } from "../utils/ControlsClasses";



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
    numberOfLaps: number
    trackName: string
}

export const defaultGameSettings: IGameSettings = {
    ballRadius: 1,
    typeOfGame: "race",
    numberOfLaps: 3,
    trackName: "track"
}
