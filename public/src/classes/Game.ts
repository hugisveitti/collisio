import { TrackType, GameType, VehicleType } from "../shared-backend/shared-stuff";


export const allTrackTypes: { name: string, type: TrackType }[] = [
    {
        name: "Test", type: "test-course"
    },
    { name: "Farm track", type: "low-poly-farm-track" },
    { name: "F1 track", type: "low-poly-f1-track" },
    { name: "Beach track", type: "sea-side-track" },
]

export interface IPlayerConnection {
    playerName: string
    playerId: string
    roomId: string
    /** auth */
    isAuthenticated: boolean
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
    numberOfLaps: 2,
    trackName: "low-poly-farm-track",
}

// info about individual players
export interface IEndOfRaceInfoPlayer {
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
export interface IEndOfRaceInfoGame {

    numberOfLaps: number
    playersInfo: IPlayerGameInfo[]
    trackType: TrackType
    gameId: string
    roomId: string
    date: Date
}

/** while race is going on */
export interface IRaceTimeInfo {
    playerName: string
    bestLapTime: number
    totalTime: number
    currentLapTime: number
    lapNumber: number /**  show "current lap / totalNumberOfLaps" */
    numberOfLaps: number
}


