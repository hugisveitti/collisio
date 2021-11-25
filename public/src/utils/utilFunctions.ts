export const stringInArray = (st: string, arr: string[]) => {
    for (let t of arr) {
        if (t === st) return true
    }
    return false
}

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

                console.log("not includeing", key, object[key])
            }
        } else {
            console.log("not includeing", key, object[key])
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


export const getDateNow = () => {
    return new Date().toISOString()
}