import { TrackName, GameType, VehicleType, IPlayerInfo, IPreGamePlayerInfo } from "../shared-backend/shared-stuff";


interface ITrackName {
    name: string
    type: TrackName
    gameType: GameType
}

export const getTrackNameFromType = (trackName: TrackName) => {
    return allTrackNames.find(track => track.type === trackName)?.name ?? "-"
}

export const allTrackNames: ITrackName[] = [
    {
        name: "Test", type: "test-course", gameType: "race"
    },
    {
        name: "Farm track", type: "low-poly-farm-track", gameType: "race"
    },
    {
        name: "F1 track", type: "f1-track", gameType: "race"
    },
    {
        name: "Beach track", type: "sea-side-track", gameType: "race"
    },
    {
        name: "Simple Tag", type: "simple-tag-course", gameType: "tag"
    }
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
    trackName: TrackName
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
    playerId: string
    playerName: string
    lapTimes: number[]
    bestLapTime: number
    trackName: TrackName
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
    isAuthenticated: boolean
}

// info about the game
export interface IEndOfRaceInfoGame {
    numberOfLaps: number
    playersInfo: IPlayerGameInfo[]
    trackName: TrackName
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


export interface IRoomInfo {
    roomId: string
    players: IPreGamePlayerInfo[]
    preGameSettings: IPreGameSettings
    desktopId: string
    desktopAuthenticated: boolean
    date: Date
}
