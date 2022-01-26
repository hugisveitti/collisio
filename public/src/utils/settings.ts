import { IGameSettings } from "../classes/localGameSettings";

type DeviceType = "desktop" | "mobile"

let deviceType: DeviceType | undefined

export const getDeviceType = (): DeviceType => {
    if (deviceType) {
        return deviceType
    }
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        if (window.confirm("Tablet detected! Press OK, to use as mobile and cancel to use as desktop.")) {
            deviceType = "mobile"
            return "mobile"
        }
        deviceType = "desktop"
        return "desktop" // "tablet";
    } else if (
        /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
            ua
        )
    ) {
        return "mobile";
    }
    return "desktop";
};

// TODO: is this a bad function?
export const isIphone = () => {
    return navigator.userAgent.toLowerCase().includes("iphone")
}

// this will only work on my network
export const inDevelopment = false// window.location.href.includes("localhost") || window.location.href.includes("192.168")

/** test mode means:
 * Not being redirected from pages
 * can play the game with keyboard and no phone
 */
export const inTestMode = false


export const testGameSettings: IGameSettings = {
    gameType: "race",
    numberOfLaps: 2,
    trackName: "sea-side-track",
    tagGameLength: 2,
    useShadows: true,
    useSound: false,
    graphics: "high",
    drawDistance: 5000,
    record: false,
    useGhost: true,
    ghostFilename: "LdEGkMu2r2QCdJ8wMerp1bkRrqd2/sea-side-track/2"
}


const encrypt = require("../shared-backend/encryption.json")



export const getStaticPath = (path: string) => {
    for (let key of Object.keys(encrypt)) {
        if (encrypt[key] === path) {
            return `/${key}`
        }
    }
    return `/${path}`
}

