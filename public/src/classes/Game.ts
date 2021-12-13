import { TrackName, GameType, VehicleType, IPreGamePlayerInfo } from "../shared-backend/shared-stuff";
import { itemInArray } from "../utils/utilFunctions";
import { IGameSettings } from "./localGameSettings";

/** change name to map
 * since a racetrack is a map and the tag courses are also maps but not tracks....
 */
export interface ITrackInfo {
    name: string
    type: TrackName
    gameType: GameType
}

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
        default:
            return "Unknown game type"
    }
}

export const allTrackNames: ITrackInfo[] = [
    {
        name: "Test", type: "test-course", gameType: "race"
    },
    {
        name: "Farm track", type: "farm-track", gameType: "race"
    },
    {
        name: "F1 track", type: "f1-track", gameType: "race"
    },
    {
        name: "F1 track-2", type: "f1-track-2", gameType: "race"
    },
    {
        name: "Beach track", type: "sea-side-track", gameType: "race"
    },
    {
        name: "Tag course", type: "simple-tag-course", gameType: "tag"
    },
    {
        name: "Town track", type: "town-track", gameType: "race"
    },
    {
        name: "Monaco track", type: "monaco-track", gameType: "race"
    }
    ,
    {
        name: "Mountain track", type: "russia-track", gameType: "race"
    }
]

export const activeTrackNames: TrackName[] = ["farm-track", "sea-side-track", "simple-tag-course", "f1-track", "f1-track-2", "russia-track"]
export const activeRaceTrackNames: TrackName[] = activeTrackNames.filter(name => {
    for (let i = 0; i < allTrackNames.length; i++) {
        if (allTrackNames[i].type === name) {
            return allTrackNames[i].gameType === "race"
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
export const defaultRaceTrack: TrackName = "farm-track"
export const defaultTagTrack: TrackName = "simple-tag-course"

export const getDefaultTrackFromGameType = (gameType: GameType) => {
    switch (gameType) {
        case "tag":
            return defaultTagTrack
        default:
            return defaultRaceTrack
    }
}

export interface IPlayerConnection {
    playerName: string
    playerId: string
    roomId: string
    /** auth */
    isAuthenticated: boolean
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
    userAgent: string
    totalPing: number
    totalPingsGotten: number
    avgFps: number
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
    desktopId: string
    desktopAuthenticated: boolean
    date: number,
    canceledGame: boolean
}
