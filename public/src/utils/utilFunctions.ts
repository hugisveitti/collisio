export const stringInArray = (st: string, arr: string[]) => {
    for (let t of arr) {
        if (t === st) return true
    }
    return false
}