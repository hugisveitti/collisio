

export const getHasAskedDeviceOrientation = () => eval(
    window.localStorage.getItem("hasAskedDeviceOrientation")
);

export const setHasAskedDeviceOrientation = (b: boolean) => {
    window.localStorage.setItem("hasAskedDeviceOrientation", b + "")
}

export const requestDeviceOrientation = (callback: (permissionGranted: boolean, message: string) => void) => {
    // I think it is only needed for iphones

    if (
        navigator.userAgent.toLowerCase().includes("iphone") &&
        DeviceOrientationEvent &&
        // @ts-ignore
        typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
        // @ts-ignore
        DeviceOrientationEvent.requestPermission()
            .then((response) => {
                if (response == "granted") {
                    setHasAskedDeviceOrientation(true)
                    callback(true, "Permission granted!")
                } else {
                    callback(false, "Permission not granted.")
                }
            })
            .catch((err) => {
                callback(false, "Error occured when asking for permission")
            });
    } else {
        // maybe not granted hahah
        callback(true, "Permission granted.")
        console.log("Device motion permission access method not available");
        setHasAskedDeviceOrientation(true)
    }
}

export interface IDeviceOrientationEvent {
    gamma: number
    beta: number
    alpha: number
}

