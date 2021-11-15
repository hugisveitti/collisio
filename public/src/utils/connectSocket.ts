import { toast } from "react-toastify"
import { io } from "socket.io-client"
import { mdts_device_type } from "../shared-backend/shared-stuff"


export interface ISocketCallback {
    message: string;
    status: "error" | "success";
    data: any
}

export const createSocket = (deviceType: string, mode: string = "not-test") => {

    // not secure, device orientation wont work
    if (window.location.href.includes("http://") && !window.location.href.includes("localhost")) {
        window.location.href = "https://" + window.location.href.slice(7, window.location.href.length)
    }

    // return

    const socket = io()


    socket.on("connect", () => {

        socket.emit(mdts_device_type, { deviceType: deviceType, mode })

    })

    if (deviceType === "mobile") {
        if (!window.DeviceMotionEvent) {
            toast("Device motion not supported in the browser, please use Google Chrome")
        } else {
            console.log("device motion supported")
        }
    }


    socket.on("disconnect", () => {
        toast.error("Connection lost, you will probably have to refresh")

    })

    window.onbeforeunload = () => {
        socket.emit("quit-room")
    }

    return socket
}
