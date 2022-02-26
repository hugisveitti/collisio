import { GameScene } from "../game/GameScene";
import { RaceGameScene } from "../game/RaceGameScene";
import { StoryGameScene } from "../game/StoryGameScene";
import { TagGameScene } from "../game/TagGameScene";
import { TrackName, GameType, VehicleType, IPreGamePlayerInfo, allTrackNames, TimeOfDay, RaceSong } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";
import { itemInArray } from "../utils/utilFunctions";
import { IGameSettings, IRoomSettings } from "./localGameSettings";


export const numberOfLapsPossibilities = [1, 2, 3, 5, 7, 13]



export const getTrackNameFromType = (trackName: TrackName) => {
    return allTrackNames.find(track => track.type === trackName)?.name ?? "-"
}

export const getGameTypeNameFromType = (gameType: GameType) => {
    switch (gameType) {
        case "race":
            return "Race"
        case "tag":
            return "Tag"
        case "ball":
            return "Ball"
        case "story":
            return "Story"
        default:
            return "Unknown game type"
    }
}



export const getTrackInfo = (trackName: TrackName) => {
    for (let track of allTrackNames) {
        if (track.type === trackName) return track
    }
    return undefined
}


export const getTimeOfDay = (trackName: TrackName) => {
    for (let t of allTrackNames) {
        if (trackName === t.type) return t.timeOfDay ?? "day"
    }
    return "day"
}

export const getRaceSong = (trackName: TrackName): RaceSong => {
    for (let t of allTrackNames) {
        if (trackName === t.type) return t.song ?? "racing.mp3"
    }
    return "racing.mp3"
}

interface ITimeOfDayColors {
    ambientLightColor: number
    hemisphereTopColor: number
    hemisphereBottomColor: number
    pointLightIntesity: number
    ambientLightIntesity: number
}

const dayColors: ITimeOfDayColors = {
    ambientLightColor: 0xffffff,
    hemisphereBottomColor: 0xffffff,
    hemisphereTopColor: 0x0077ff,
    pointLightIntesity: 1,
    ambientLightIntesity: 1
}

const eveningColors: ITimeOfDayColors = {
    ambientLightColor: 0x3392FF,
    hemisphereBottomColor: 0x003168,
    hemisphereTopColor: 0x0077ff,
    pointLightIntesity: .1,
    ambientLightIntesity: .5
}

export const getTimeOfDayColors = (timeOfDay: TimeOfDay | undefined): ITimeOfDayColors => {
    if (!timeOfDay) return dayColors
    switch (timeOfDay) {
        case "evening":
            return eveningColors
        case "day":
            return dayColors
        default:
            return dayColors
    }
}


export const activeTrackNames: TrackName[] = [
    "farm-track",
    "nurn-track",
    "sea-side-track",
    "f1-track",
    "f1-track-2",
    "russia-track",
    "ferrari-track",
    "farmers-little-helper-map",
    "spa-track",
    "small-track",
    "basic-track1",
    "basic-track2",
    "basic-track3",
    "basic-track4",
    "basic-track5",
    "small-jump-track",
    "simple-tag-course",
    "basic-tag-course",
]

export const activeRaceTrackNames: TrackName[] = activeTrackNames.filter(name => {
    for (let i = 0; i < allTrackNames.length; i++) {
        if (allTrackNames[i].type === name) {
            return allTrackNames[i].gameType === "race"
        }
    }
    return false
})

export const activeTagTrackNames: TrackName[] = activeTrackNames.filter(name => {
    for (let i = 0; i < allTrackNames.length; i++) {
        if (allTrackNames[i].type === name) {
            return allTrackNames[i].gameType === "tag"
        }
    }
    return false
})


export const activeGameTypes: GameType[] = ["race", "tag"]

const getNonActiveTrackNames = (): TrackName[] => {
    const tracks: TrackName[] = []
    for (let track of allTrackNames) {
        if (!itemInArray(track.type, activeTrackNames)) {
            tracks.push(track.type)
        }
    }
    return tracks
}

export const getGameTypeFromTrackName = (trackName: TrackName): GameType | undefined => {
    for (let i = 0; i < allTrackNames.length; i++) {
        if (allTrackNames[i].type === trackName) {
            return allTrackNames[i].gameType
        }
    }
    return undefined
}

export const nonActiveTrackNames: TrackName[] = getNonActiveTrackNames()
export const defaultRaceTrack: TrackName = "nurn-track"
export const defaultTagTrack: TrackName = "simple-tag-course"
export const defaultStoryTrack: TrackName = "farmers-little-helper-map"


export const getGameSceneClass = (gameType: GameType): typeof GameScene => {
    switch (gameType) {
        case "race":
            return RaceGameScene
        case "tag"
            : return TagGameScene
        case "story":
            return StoryGameScene
        default:
            console.warn("Unknown gametype", gameType)
            return GameScene
    }
}

export const getDefaultTrackFromGameType = (gameType: GameType) => {
    switch (gameType) {
        case "tag":
            return defaultTagTrack
        case "story":
            return defaultStoryTrack
        default:
            return defaultRaceTrack
    }
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
    date: number
    private: boolean
    isAuthenticated: boolean
    vehicleType: VehicleType
    engineForce: number
    breakingForce: number
    steeringSensitivity: number
    roomTicks: number
    gameTicks: number
    totalPing: number
    totalPingsGotten: number
    avgFps: number
    tournamentId?: string
    recordingFilename?: string
    vehicleSetup: VehicleSetup
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
    playersInfo: IPlayerGameInfo[]
    gameId: string
    roomId: string
    date: number
    gameSettings: IGameSettings
    roomSettings: IRoomSettings
    roomTicks: number
    gameTicks: number
    avgPing: number
    time: number
    avgFps: number
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

export interface ITagScoreInfo {
    playerName: string
    score: number
}

export interface IScoreInfo {
    timeInfos?: IRaceTimeInfo[],
    tagInfos?: ITagScoreInfo[]
}



export interface IRoomInfo {
    roomId: string
    players: IPreGamePlayerInfo[]
    gameSettings: IGameSettings
    roomSettings: IRoomSettings
    desktopId: string
    desktopAuthenticated: boolean
    date: number,
    canceledGame: boolean
}
