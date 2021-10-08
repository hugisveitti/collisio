let deviceType: string

export const getDeviceType = () => {
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

export const baseurl = "http://localhost:5000/"

// if not development then always false, otherwise set by me...
// this isnt just crap code, but it still is
export const startGameAuto = process.env.NODE_ENV !== "development" ? false : false;

// test mode is using raceTrackTest.ts
export const isTestMode = process.env.NODE_ENV !== "development" ? false : false;
// export const devMode = true