import { v4 as uuid } from "uuid";

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

export const getLocalUid = () => {
    let uid = window.localStorage.getItem("uid")
    if (!uid) {
        uid = "undef_" + uuid()
        window.localStorage.setItem("uid", uid)
    }
    return uid
}

const displayNameKey = "guestDisplayName"
export const getLocalDisplayName = () => {
    let name = window.localStorage.getItem(displayNameKey)

    return name
}

export const setLocalDisplayName = (name: string) => {
    window.localStorage.setItem(displayNameKey, name)
}