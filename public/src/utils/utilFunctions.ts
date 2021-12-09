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
    const n = 10;
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
export const numberScaler = (a: number, b: number, min: number, max: number) => {
    return (num: number) => {
        return a + (((num - min) * (b - a)) / (max - min))
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