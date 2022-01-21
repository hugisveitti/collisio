import { Timestamp } from "@firebase/firestore";
import { Vector3, Quaternion } from "three";


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


export const getSteerAngleFromBeta = (beta: number) => {
    let angle = 0
    if (Math.abs(beta) >= 4) {
        angle = beta - (4 * Math.sign(beta))
    }
    return angle
}
