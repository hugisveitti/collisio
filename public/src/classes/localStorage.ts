

export function getLocalStorageItem<T extends string | number | boolean>(key: string, type?: "string" | "boolean" | "number"): T | undefined {
    const item = window.localStorage.getItem(key)
    if (!item) return undefined

    switch (type) {
        case "number":
            const num = +item
            if (!isNaN(num)) return num as T
            return undefined
        case "boolean":
            return eval(item) as T
        default:
            return item as T
    }
}



export const saveLocalStorageItem = (key: string, value: string) => {
    window.localStorage.setItem(key, value)
}
