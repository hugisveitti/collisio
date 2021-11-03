import { VehicleType } from "../vehicles/VehicleConfigs";
import { MobileControls, VehicleControls } from "../utils/ControlsClasses";

export type TrackType = "track" | "town-track" | "low-poly-farm-track" | "low-poly-f1-track" | "test-course"
export type GameType = "ball" | "race"

export const allTrackTypes: { name: string, type: TrackType }[] = [
    {
        name: "Test", type: "test-course"
    },
    { name: "Farm track", type: "low-poly-farm-track" },
    { name: "F1 track", type: "low-poly-f1-track" },
    { name: "ugly Simple", type: "track" },
    { name: "ugly town track", type: "town-track" }
]

export interface IPlayerConnection {
    playerName: string
    playerId: string
    roomId: string
    /** auth */
    isAuthenticated: boolean
}

export interface IPlayerInfo {
    playerName: string
    /** only for multiple monitor games */
    bothConnected?: boolean
    isLeader: boolean
    teamName: string
    playerNumber: number
    mobileControls: MobileControls
    vehicleControls: VehicleControls
    /** only for ball game */
    teamNumber?: number
    id: string
    isAuthenticated: boolean
    vehicleType: VehicleType
    photoURL?: string
}



export interface IPreGameSettings {
    ballRadius: number
    gameType: GameType
    numberOfLaps: number
    trackName: TrackType
}

export const defaultPreGameSettings: IPreGameSettings = {
    ballRadius: 1,
    gameType: "race",
    numberOfLaps: 3,
    trackName: "low-poly-farm-track",
}

// info about individual players
export interface IEndOfGameInfoPlayer {
    totalTime: number
    numberOfLaps: number
    playerId?: string
    playerName: string
    lapTimes: number[]
    bestLapTime: number
    trackType: TrackType
    gameId: string
    date: Date
    private: boolean
    isAuthenticated: boolean
    vehicleType: VehicleType
    engineForce: number
    breakingForce: number
    steeringSensitivity: number
}

export interface IPlayerGameInfo {
    totalTime: number
    lapTimes: number[]
    id: string
    name: string
    vehicleType: VehicleType
    engineForce: number
    breakingForce: number
    steeringSensitivity: number
}

// info about the game
export interface IEndOfGameInfoGame {

    numberOfLaps: number
    playersInfo: IPlayerGameInfo[]
    trackType: TrackType
    gameId: string
    roomId: string
    date: Date
}