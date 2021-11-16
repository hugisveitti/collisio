import { toast } from "react-toastify"
import { io, Socket } from "socket.io-client"
import { mdts_device_type, stmd_socket_ready } from "../shared-backend/shared-stuff"


export interface ISocketCallback {
    message: string;
    status: "error" | "success";
    data: any
}

export const createSocket = (deviceType: string, callback: (socket: Socket) => void, mode: string = "not-test") => {

    // not secure, device orientation wont work
    if (window.location.href.includes("http://") && !window.location.href.includes("localhost")) {
        window.location.href = "https://" + window.location.href.slice(7, window.location.href.length)
    }

    // return

    const socket = io()


    socket.on("connect", () => {
        console.log("socket", socket.id)

        socket.emit(mdts_device_type, { deviceType: deviceType, mode })
        socket.on(stmd_socket_ready, () => {
            callback(socket)
        })

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

    /** if user leaves the website */
    window.onbeforeunload = () => {
        socket.emit("quit-room")
    }
}
