import { GameType, TrackName } from "../shared-backend/shared-stuff"

export type GraphicsType = "low" | "high"

/**
 * Store some things on the localStorage
 * like useSound and useShadows
 */


export interface IGameSettings {
    useShadows: boolean
    useSound: boolean
    musicVolume: number
    numberOfLaps: number
    trackName: TrackName
    gameType: GameType
    tagGameLength: number
    graphics: GraphicsType
    tournamentId?: string
    drawDistance: number
    record: boolean
    useGhost: boolean
    ghostFilename?: string
    targetFPS: number
}

export const defaultGameSettings: IGameSettings = {
    useShadows: false,
    useSound: true,
    musicVolume: .2,
    numberOfLaps: 1,
    trackName: "farm-track",
    gameType: "race",
    tagGameLength: 2,
    graphics: "high",
    drawDistance: 7500,
    record: false,
    useGhost: false,
    targetFPS: 30
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


interface IRecommendedGraphicsSettings {
    useShadow: boolean
    graphics: GraphicsType
}

export const getRecommendedGraphicSettings = (): IRecommendedGraphicsSettings => {

    // not finished
    return {
        useShadow: true,
        graphics: "high"
    }
}