/** Here I will stress test the socket connection
 *
 */

import { io, Socket } from "socket.io-client"
import { dts_create_room, IPlayerInfo, mdts_device_type, mdts_start_game, MobileControls, mts_controls, mts_player_connected, std_controls, std_room_created_callback, stmd_socket_ready, stm_player_connected_callback } from "../shared-backend/shared-stuff"
import { ISocketCallback } from "../utils/connectSocket"

export const removeSockets = (desktopSocket: Socket, mobileSockets: Socket[]) => {
    desktopSocket.disconnect()
    for (let mobileSocket of mobileSockets) {
        mobileSocket.disconnect()
    }
}

export const createSocketTest = (numberOfMobiles: number, callback: (roomId: string, desktopSocket: Socket, mobileSockets: Socket[]) => void) => {
    createAllConnections(numberOfMobiles, (roomId, desktopSocket, mobileSockets) => {
        callback(roomId, desktopSocket, mobileSockets)
        desktopSocket.on("disconnect", () => {
            desktopSocket.disconnect()
        })
        for (let m of mobileSockets) {
            m.on("disconnect", () => {
                m.disconnect()
            })
        }

        desktopSocket.emit(mdts_start_game)
    })
}



export const startSocketTest = (desktopSocket: Socket, mobileSockets: Socket[], callback: (ping: number) => void) => {

    const mobileControllers = []

    let start: number = 0
    let end: number = 0
    for (let i = 0; i < mobileSockets.length; i++) {
        mobileControllers.push(new MobileControls())
    }

    desktopSocket.on(std_controls, (data) => {
        const { players } = data as { players: IPlayerInfo[] }
        for (let i = 0; i < players.length; i++) {
            if (players[i]?.mobileControls.f) {
                end = Date.now()
                callback(end - start)
            }
        }
    })

    let ticks = 0
    setInterval(() => {
        ticks += 1
        let f = ticks % 10 === 0

        for (let i = 0; i < mobileSockets.length; i++) {
            mobileControllers[i].f = f && i === 0
            if (f) {
                start = Date.now()
            }
            mobileSockets[i].emit(mts_controls, mobileControllers[i])
        }
    }, 1000 / 60)

}

const createAllConnections = (numberOfMobiles: number, callback: (roomId: string, desktopSocket: Socket, mobileSockets: Socket[]) => void) => {
    connectSockets(numberOfMobiles, (desktopSocket, mobileSockets) => {
        createRoom(desktopSocket, (roomId) => {
            connectToRoom(roomId, mobileSockets, () => {
                callback(roomId, desktopSocket, mobileSockets)
            })
        })
    })
}

const connectToRoom = (roomId: string, mobileSockets: Socket[], callback: () => void) => {
    const oneConnect = (i: number) => {
        mobileSockets[i].emit(mts_player_connected, {
            roomId,
            playerName: `tester-${roomId}-${i}`,
            playerId: `${roomId}-${i}`,
            isAthenticated: false,
            photoURL: "",
            isStressTest: true
        })
        mobileSockets[i].on(stm_player_connected_callback, data => {
            if (data.status === "success") {

                if (i === mobileSockets.length - 1) {
                    callback()
                } else {
                    oneConnect(i + 1)
                }
            } else {
                console.log("Error connecting in stress test, roomId:", roomId)
            }
        })
    }
    oneConnect(0)
}


const createRoom = (desktopSocket: Socket, callback: (roomId: string) => void) => {
    desktopSocket.emit(dts_create_room)
    desktopSocket.on(std_room_created_callback, (response: ISocketCallback) => {
        if (response.status === "success") {
            const { roomId } = response.data
            callback(roomId)
        } else {
            console.log("Error connecting", response.message)
        }
    })
}


const connectSockets = (numberOfMobiles: number, callback: (desktopSocket: Socket, mobileSockets: Socket[]) => void) => {
    const desktopSocket = io()

    desktopSocket.on("connect", () => {
        desktopSocket.emit(mdts_device_type, { deviceType: "desktop", mode: "not-test" })
        desktopSocket.on(stmd_socket_ready, () => {


            const mobileSockets: Socket[] = []

            const createMobileSocket = (i: number) => {

                let mobileSocket = io()
                mobileSockets.push(mobileSocket)
                mobileSocket.on("connect", () => {
                    mobileSocket.emit(mdts_device_type, { deviceType: "mobile", mode: "not-test" })
                    mobileSocket.on(stmd_socket_ready, () => {
                        if (i < numberOfMobiles - 1) {
                            createMobileSocket(i + 1)
                        } else {
                            callback(desktopSocket, mobileSockets)
                        }
                    })

                })
            }
            createMobileSocket(0)
        })
    })

}
