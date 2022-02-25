import { Timestamp } from "@firebase/firestore";
import { Vector3, Quaternion, Euler } from "three";


export const angleBetweenVectors = (_p2: Vector3, _p1: Vector3) => {
    const p1 = _p1.clone()
    const p2 = _p2.clone()
    const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z)
    return angle
}


export function itemInArray<Type>(st: Type, arr: Type[]) {
    for (let t of arr) {
        if (t === st) return true
    }
    return false
}

/**
 * 
 * @param arr array to shuffle
 * Shuffles the array in place, so it doesn't return anythin
 */
export const shuffleArray = (arr: any[]) => {
    const n = 4 * arr.length;
    let j = 0;
    while (j < n) {
        for (let i = 0; i < arr.length; i++) {
            const temp = arr[i]
            const ri = Math.floor(Math.random() * arr.length)
            arr[i] = arr[ri]
            arr[ri] = temp
        }
        j += 1
    }
}

/**
 * 
 * @param object, 
 * @returns a version of the object where undefined valeus are removed
 */
export const removeUndefinedFromObject = (object: Object) => {
    const keys = Object.keys(object)
    const newObject = {}
    for (let key of keys) {
        if (object[key] !== undefined) {
            if (object[key] !== null && object[key] !== undefined) {
                if (typeof object[key] === "object") {
                    newObject[key] = removeUndefinedFromObject(object[key])
                } else {
                    newObject[key] = object[key]
                }
            } else {

            }
        } else {

        }
    }
    return newObject
}


/**
 * scale number 
 * @param a
 * @param b
 * @param min
 * @param max 
 * @returns a number scaler, a function that scales changes the range of a number
 * https://en.wikipedia.org/wiki/Feature_scaling
 * goes from  range min - max to range [a-b]
 */
export const numberScaler = (a: number, b: number, min: number, max: number, precision: number) => {
    return (num: number) => {
        return +(a + (((num - min) * (b - a)) / (max - min))).toPrecision(precision)
    }
}

/**
 * 
 */
export const logScaler = (a: number, min: number, max: number) => {
    return (num: number) => {
        return Math.min(Math.max(Math.log2((2 / a) * num), min), max)
    }
}


export const getDateNow = (): number => {
    return Date.now()
}

export const getDateFromNumber = (num: number | any): string => {
    if (typeof num === "number") {
        return new Date(num).toISOString()
    }
    return "-"
}

export const degToRad = 0.017453
export const radToDeg = 57.2957795


export function arrayToDict<T>(array: T[], key: string): { [id: string]: T } {
    if (array.length === 0) return {}


    const dict = {}
    for (let item of array) {
        const id = item[key]

        if (!id) {
            console.warn(`Item doesn't have field ${key} arrayToDict`)
            return {}
        }
        // @ts-ignore
        dict[id] = item
    }

    return dict
}

export function dictToArray<T>(dict: { [id: string]: T }): T[] {
    const array: T[] = []
    for (let key of Object.keys(dict)) {
        array.push(dict[key])
    }
    return array
}


// stupid
export const getDateString = (date: any): string => {
    if (date instanceof Date) {
        return date.toISOString()
    }

    if (date instanceof Timestamp) {
        return date.toDate().toISOString()
    }

    if (date?.seconds) {
        return new Date(date.seconds).toISOString();
    }
    if (typeof date === "string") return date;
    if (typeof date === "number") return new Date(date).toISOString()
    return "unknown date";
};

/**
 * First the number then the number to check
 * Order doesnt matter
 */
export const isBetweenNumbers = (a: number, b: number, num: number) => {
    const max = Math.max(a, b)
    const min = Math.min(a, b)

    return max > num && num > min
}

// 
// 
export const isBetweenAngles = (smallerAngle: number, biggerAngle: number, angle: number) => {
    return smallerAngle < angle && angle < biggerAngle
}

/**
 * 
 * @param p1 
 * @param p2
 * @returns 2d angle, ignoring y
 */
export const get2DAngleBetweenPoints = (p1: Vector3, p2: Vector3) => {

    return Math.atan2((p2.z - p1.z), (p2.x - p1.x))
}


/**
 * @param str 
 * @param arr: array of substring
 * returns true if content of str is included in any string in arr
 */
export const substrArrayInString = (str: string, arr: string[]) => {
    for (let item of arr) {
        if (str.includes(item)) {
            return true
        }
    }
    return false
}

export const createClassNames = (...str: string[]) => {
    return str.join(" ")
}


export const getSteerAngleFromBeta = (beta: number, noSteerNumber: number) => {
    let angle = 0
    if (Math.abs(beta) >= noSteerNumber) {
        angle = beta - (noSteerNumber * Math.sign(beta))
    }
    return angle
}

/**
 * 
 * @param q Quaterniton, Threejs
 * @returns Yaw is rotation around the z axis. Pitch is the rotation around the y axis. Roll is the rotation around the x axis.
 */
export const getPitchRollYawFromQuaternion = (q: Quaternion) => {
    // Z
    let t3 = 2 * ((q.w * q.z) + (q.x * q.y))
    let t4 = (1 - (2 * ((q.y * q.y) + (q.z + q.z))))
    const yaw = Math.atan2(t3, t4)

    // Y
    let t2 = 2 * ((q.w * q.y) - (q.z * q.x))
    t2 = t2 > 1 ? 1 : t2
    t2 = t2 < -1 ? -1 : t2
    const pitch = Math.asin(t2)

    // Roll
    let t0 = 2 * ((q.w * q.x) + (q.y * q.z))
    let t1 = (1 - (2 * ((q.x * q.x) + (q.y * q.y))))
    const roll = Math.atan2(t0, t1)

    return { yaw, pitch, roll }
}

const prefixSizes = {
    3: "Thousand",
    6: "Million",
    9: "Billion",
    12: "T"
}

export const getSizeAbbr = (num: number) => {
    if (!num) return "0"
    const str = num.toFixed(0)
    const l = str.length
    let prefix = ""
    let prefixSize = 0
    for (let p of Object.keys(prefixSizes)) {

        if (+p < l && +p > prefixSize) {
            prefix = prefixSizes[p]
            prefixSize = +p
        }
    }

    const prefixString = `${(num / (10 ** (prefixSize))).toFixed(2)} ${prefix}`
    return prefixString
}

// this is semi random right now
const XPtoNextLevel = [
    30, 50, 80, 90, 120, 130, 150, 170, 190, 200, 205, 210, 220, 220, 220, 230, 230, 240, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260
]

/**
 * 
 * @param XP how much xp the player has 
 * @returns object {currentLevel, pointsToNextLevel, ratioOfLevelFinished}
 *  currentLevel is the level the player is in based off his XP
 *  points to next level are how much XP is needed to get to the next level
 *  ratioOfLevelFinished The ratio of how much of the level the player has completed
 */
export const getXPInfo = (XP: number) => {
    let currentLevel = 0
    let pointsToNextLevel = 0
    let pointsFinishedInThisLevel = 0
    let ratioOfLevelFinished = 0

    let sumXP = 0

    if (XPtoNextLevel[0] > XP) {
        return {
            currentLevel: 1, pointsToNextLevel: XPtoNextLevel[0] - XP, ratioOfLevelFinished: XP / XPtoNextLevel[0], pointsFinishedInThisLevel: XP
        }
    }

    for (let i = 0; i < XPtoNextLevel.length; i++) {
        sumXP += XPtoNextLevel[i]
        let lowerNumber = sumXP
        let higherNumber = XPtoNextLevel[i + 1] + sumXP

        if (lowerNumber <= XP && XP <= higherNumber) {
            currentLevel = i + 2
            pointsToNextLevel = higherNumber - XP
            pointsFinishedInThisLevel = XP - lowerNumber
            ratioOfLevelFinished = pointsFinishedInThisLevel / (pointsFinishedInThisLevel + pointsToNextLevel)
            break
        }
    }
    if (currentLevel === 0) {
        currentLevel = XPtoNextLevel.length
        ratioOfLevelFinished = 1
        pointsToNextLevel = 0
        pointsFinishedInThisLevel = 260
    }

    return { currentLevel, pointsToNextLevel, ratioOfLevelFinished, pointsFinishedInThisLevel }
}