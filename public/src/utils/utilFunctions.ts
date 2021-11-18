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