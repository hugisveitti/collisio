import { TrackName } from "./shared-stuff"

export type MedalType = "gold" | "silver" | "bronze" | "none"

const getFarmTrackMedal = (trackName: TrackName, numberOfLaps: number, totalTime: number): MedalType => {
    if (totalTime < 20 * numberOfLaps) {
        return "gold"
    }
    if (totalTime < 25 * numberOfLaps) {
        return "silver"
    }
    if (totalTime < 30 * numberOfLaps) {
        return "bronze"
    }
    return "none"
}

interface TrackTimes {
    gold: number
    silver: number
    bronze: number
}

const times: { [trackName in TrackName]: TrackTimes } = {
    "farm-track": {
        gold: 20,
        silver: 25,
        bronze: 30
    },

    "f1-track": {
        gold: 21,
        silver: 29,
        bronze: 35
    },
    "f1-track-2": {
        gold: 26,
        silver: 30,
        bronze: 35
    },
    // Beach
    "sea-side-track": {
        gold: 52,
        silver: 62,
        bronze: 69
    },
    // Mountain
    "russia-track": {
        gold: 28.5,
        silver: 33,
        bronze: 39
    },
    "ferrari-track": {
        gold: 41.5,
        silver: 48,
        bronze: 55
    },
    // Desert
    "spa-track": {
        gold: 45,
        silver: 55,
        bronze: 65
    },
    "nurn-track": {
        gold: 23,
        silver: 28,
        bronze: 33
    },
    "town-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "monaco-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "farmers-little-helper-map": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "speed-test-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "skii-map": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "simple-tag-course": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "small-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "small-jump-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
    "test-course": {
        gold: 1000,
        silver: 1000,
        bronze: 1000
    },
}


export const getMedal = (trackName: TrackName, numberOfLaps: number, totalTime: number) => {

    if (trackName in times) {
        const { gold, silver, bronze } = times[trackName]
        if (totalTime < gold * numberOfLaps) {
            return "gold"
        }
        if (totalTime < silver * numberOfLaps) {
            return "silver"
        }
        if (totalTime < bronze * numberOfLaps) {
            return "bronze"
        }
        return "none"
    }

    return "none"


    // switch (trackName) {
    //     case "farm-track":
    //         return getFarmTrackMedal(trackName, numberOfLaps, totalTime)

    //     case "f1-track":
    //     // Beach track
    //     case "sea-side-track":

    //     case "f1-track-2":
    //     // Mountain track
    //     case "russia-track":
    //     // Winter track
    //     case "ferrari-track":
    //     // desert track
    //     case "spa-track":
    //     // German track
    //     case "nurn-track":

    //     case "town-track":
    //     case "monaco-track":
    //     case "farmers-little-helper-map":
    //     case "speed-test-track":
    //     case "skii-map":
    //     case "simple-tag-course":
    //     case "small-track":
    //     case "small-jump-track":
    //     case "test-course":
    //     default:
    //         return "bronze"
    // }
}

interface IMedalAndToken {
    medal: MedalType
    XP: number
    coins: number
}
/**
 * It makes the most sense to have <medal>Coins * numberOfLaps be the
 * amount of coins players receive, but it is more difficult to play longer games
 * So it could be something like <medal>Coins * (numberOfLaps ** 1.1)
 * But then if I show ads after every third game it would make sense to make players play more games instead of longer ones.
 * 
 */


const coinsAmount: { [coin in MedalType]: number } = {
    "gold": 200,
    "silver": 100,
    "bronze": 50,
    "none": 15
}

/**
 * 
 * @param trackName 
 * @param numberOfLaps 
 * @returns XP, I think it makes sense that XP is not determined by how well you play
 */
const getXP = (trackName: TrackName, numberOfLaps: number) => {
    return Math.floor(10 * (numberOfLaps ** 1.1))
}

/**
 * Returns how much XP and coins a player recieves for
 *  
 */
export const getMedalAndTokens = (trackName: TrackName, numberOfLaps: number, totalTime: number): IMedalAndToken => {
    const medal = getMedal(trackName, numberOfLaps, totalTime)


    return {
        coins: Math.floor(coinsAmount[medal] * (numberOfLaps ** 1.1)),
        XP: getXP(trackName, numberOfLaps),
        medal
    }
}

export interface ITokenData {
    gold: number
    silver: number
    bronze: number
    none: number
    coins: number
    XP: number
    lastUpdate: number
}

export const defaultTokenData: ITokenData = {
    gold: 0,
    silver: 0,
    bronze: 0,
    none: 0,
    XP: 0,
    coins: 0,
    lastUpdate: Date.now()
}

