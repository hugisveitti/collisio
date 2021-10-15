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
    id?: string
}

export type TrackType = "track" | "town-track"

export interface IGameSettings {
    ballRadius: number
    typeOfGame: "ball" | "race"
    numberOfLaps: number
    trackName: TrackType
}

export const defaultGameSettings: IGameSettings = {
    ballRadius: 1,
    typeOfGame: "race",
    numberOfLaps: 3,
    trackName: "track"
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
}

export interface IPlayerGameInfo {
    totalTime: number
    lapTimes: number[]
    id: string
    name: string
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