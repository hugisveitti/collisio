import { toast } from "react-toastify"
import { io, Socket } from "socket.io-client"
import { mdts_device_type, stmd_socket_ready } from "../shared-backend/shared-stuff"


export interface ISocketCallback {
    message: string;
    status: "error" | "success";
    data: any
}

export const createSocket = (deviceType: string, mode: string = "not-test") => {
    return new Promise<Socket>((resolve, reject) => {

        console.log("creating socket")
        // not secure, device orientation wont work
        if (window.location.href.includes("http://") && !window.location.href.includes("localhost") && !window.location.href.includes("192.168") && deviceType === "mobile") {
            window.location.href = "https://" + window.location.href.slice(7, window.location.href.length)
        }

        // return

        const socket = io()
        console.log("socket", socket)


        socket.on("connect", () => {
            console.log("connected to socket")
            socket.emit(mdts_device_type, { deviceType: deviceType, mode })
            socket.on(stmd_socket_ready, () => {
                resolve(socket)
            })

        })

        if (deviceType === "mobile") {
            if (!window.DeviceMotionEvent) {
                toast("Device motion not supported in the browser, please use Firefox")
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
