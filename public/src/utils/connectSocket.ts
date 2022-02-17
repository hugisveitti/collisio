import { toast } from "react-toastify"
import { io, Socket } from "socket.io-client"
import { mdts_device_type, stmd_socket_ready } from "../shared-backend/shared-stuff"


export interface ISocketCallback {
    message: string;
    status: "error" | "success";
    data: any
}

let socket: Socket | undefined

export const getSocket = () => {
    return socket
}

export const disconnectSocket = () => {
    console.log("calling disconnect socket")
    socket?.disconnect()
    socket = undefined
}

export const createSocket = (deviceType: string, mode: string = "not-test") => {

    return new Promise<Socket>((resolve, reject) => {

        // not secure, device orientation wont work
        if (window.location.href.includes("http://") && !window.location.href.includes("localhost") && !window.location.href.includes("192.168") && deviceType === "mobile") {
            window.location.href = "https://" + window.location.href.slice(7, window.location.href.length)
        }

        // return

        socket = io()


        socket.on("connect", () => {
            socket.emit(mdts_device_type, { deviceType: deviceType, mode })
            socket.on(stmd_socket_ready, () => {

                resolve(socket)
            })

        })

        if (deviceType === "mobile") {
            if (!window.DeviceMotionEvent) {
                toast("Device motion not supported in the browser, please use Firefox or Chrome")
            } else {
                console.log("device motion supported")
            }
        }


        socket.on("disconnect", () => {
            // toast.error("Connection lost, you will probably have to refresh")
            /** send to front page? */
        })
    })


}
