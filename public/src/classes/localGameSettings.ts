import { GameType, TrackName } from "../shared-backend/shared-stuff"

export type BotDifficulty = "easy" | "medium" | "hard" | "none"
export const botDifficultyOptions: { name: string, value: BotDifficulty }[] = [
    { name: "No bot", value: "none" },
    { name: "Easy", value: "easy" },
    { name: "Medium", value: "medium" },
    { name: "Hard", value: "hard" },
]


export type GraphicsType = "low" | "high"

/**
 * In mutliplayer these settings are shared between players
 */
export interface IRoomSettings {
    trackName: TrackName
    numberOfLaps: number
    gameType: GameType
    tournamentId?: string
    tagGameLength: number
}

/**
 * Game settings concern everything around the game.
 * Room settings is the track, number of laps and more.
 * Room settings need to be shared while game settings don't.
 */
export interface IGameSettings {
    ghostFilename?: string
    useShadows: boolean
    useSound: boolean
    musicVolume: number

    graphics: GraphicsType
    drawDistance: number
    targetFPS: number
    record: boolean
    useGhost: boolean
    botDifficulty: BotDifficulty
}


export const defaultGameSettings: IGameSettings = {
    useShadows: false,
    useSound: true,
    musicVolume: .1,
    graphics: "low",
    drawDistance: 3000,
    record: false,
    useGhost: false,
    targetFPS: 30,
    botDifficulty: "easy"
}
export const defaultRoomSettings: IRoomSettings = {
    numberOfLaps: 1,
    tagGameLength: 2,
    trackName: "basic-track1",
    gameType: "race",
}

export const setLocalGameSetting = (key: keyof IGameSettings, value: string | number | boolean) => {
    window.localStorage.setItem(key, value.toString())
}

export const getLocalGameSetting = (key: keyof IGameSettings, type: "string" | "number" | "boolean") => {
    let value = window.localStorage.getItem(key)
    if (value !== undefined && value !== null) {
        if (type === "number") {
            return +value
        } else if (type === "boolean") {
            return eval(value)
        }
        return value
    }
    undefined
}

export const getAllLocalGameSettings = () => {
    const gameSettings = defaultGameSettings
    const keys = Object.keys(defaultGameSettings)
    for (let key of keys) {
        // @ts-ignore
        const value = getLocalGameSetting(key as keyof IGameSettings, typeof defaultGameSettings[key])
        if (value !== undefined) {
            gameSettings[key] = value
        }
    }
    return gameSettings
}

export const setAllLocalGameSettings = (gameSettings: IGameSettings) => {
    const keys = Object.keys(gameSettings)
    for (let key of keys) {
        // @ts-ignore
        setLocalGameSetting(key, gameSettings[key])
    }
}

/** ROOM STUFF */

export const setLocalRoomSetting = (key: keyof IRoomSettings, value: string | number | boolean) => {
    window.localStorage.setItem(key, value.toString())
}


export const getLocalRoomSetting = (key: keyof IRoomSettings, type: "string" | "number" | "boolean") => {
    let value = window.localStorage.getItem(key)
    if (value !== undefined && value !== null) {
        if (type === "number") {
            return +value
        } else if (type === "boolean") {
            return eval(value)
        }
        return value
    }
    undefined
}

export const getAllLocalRoomSettings = () => {
    const roomSettings = defaultRoomSettings
    const keys = Object.keys(defaultRoomSettings)
    for (let key of keys) {
        // @ts-ignore
        const value = getLocalRoomSetting(key as keyof IRoomSettings, typeof defaultRoomSettings[key])
        if (value !== undefined) {
            roomSettings[key] = value
        }
    }
    return roomSettings
}

export const setAllLocalRoomSettings = (roomSettings: IRoomSettings) => {
    const keys = Object.keys(roomSettings)
    for (let key of keys) {
        // @ts-ignore
        setLocalRoomSetting(key, roomSettings[key])
    }
}


interface IRecommendedGraphicsSettings {
    useShadow: boolean
    graphics: GraphicsType
}

export const getRecommendedGraphicSettings = (): IRecommendedGraphicsSettings => {
    // not finished
    return {
        useShadow: false,
        graphics: "low"
    }
}