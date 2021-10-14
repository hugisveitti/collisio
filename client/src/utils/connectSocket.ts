import { toast } from "react-toastify"
import { io } from "socket.io-client"

export interface ISocketCallback {
    message: string;
    status: "error" | "success";
    data: any
}

export const createSocket = (deviceType: string) => {

    const socket = io()


    socket.on("connect", () => {
        if (deviceType === "desktop") {
            socket.emit("device-type", "desktop")


        } else {
            socket.emit("device-type", "mobile")
        }
    })

    if (deviceType === "mobile") {
        if (!window.DeviceMotionEvent) {
            alert("Device motion not supported in the browser, please use Google Chrome or add 'https://' instead of 'http://'")
        } else {
            console.log("device motion supported")
        }
    }


    socket.on("disconnect", () => {
        toast.error("Connection lost, you will probably have to refresh")

    })

    return socket
}
