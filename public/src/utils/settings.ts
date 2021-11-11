
let deviceType: "desktop" | "mobile"


export const getDeviceType = (): "desktop" | "mobile" => {
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

export const baseurl = "http://localhost:5000/"

/** test mode means:
 * Not being redirected from pages
 * can play the game with keyboard and no phone
 */
export const inTestMode = true


export const getStaticPath = (path: string) => {
    return `/${path}`
}