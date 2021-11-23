import { IGameSettings } from "../classes/localGameSettings";

type DeviceType = "desktop" | "mobile"

let deviceType: DeviceType | undefined

export const getDeviceType = (): DeviceType => {
    if (deviceType) {
        return deviceType
    }
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        if (window.confirm("Press OK, to use as mobile and cancel to use as desktop")) {
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

export const inDevelopment = window.location.href.includes("localhost")

/** test mode means:
 * Not being redirected from pages
 * can play the game with keyboard and no phone
 */
export const inTestMode = true


export const testGameSettings: IGameSettings = {
    gameType: "tag",
    numberOfLaps: 2,
    trackName: "simple-tag-course",
    tagGameLength: 2,
    useShadows: true,
    useSound: true
}

export const getStaticPath = (path: string) => {
    return `/${path}`
}