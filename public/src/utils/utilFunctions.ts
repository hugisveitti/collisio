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
            if (typeof object[key] === "object") {
                newObject[key] = removeUndefinedFromObject(object[key])
            } else {
                newObject[key] = object[key]
            }
        }
    }
    return newObject
}