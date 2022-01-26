import { Request, Response } from "express";
/** toDO fix this shit */
const express = require("express")

const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");

import { Socket } from "socket.io";
import { printMemoryInfo, byteToGig } from "./utils/helperFunctions"
import router, { getPortLocalhost } from "./router";
import { adminFunctions } from "./adminTools";
import RoomMaster from "./one-monitor-game/ServerGame"
import { mdts_number_connected, stmd_number_connected } from "../public/src/shared-backend/shared-stuff";
// import cluster from "cluster";
// import http from 'http';
import { cpus } from 'os';
import process from 'process';



const createApp = (isPrimary: boolean) => {

    const app = express()

    adminFunctions(app)


    printMemoryInfo()
    const { port } = getPortLocalhost()
    let server

    router(app)

    server = app.listen(port, () => {
        console.log(`---listening on port ${port}---`)
    })

    return { server, app }
}


console.log(`Primary ${process.pid} is running`);


const { app, server } = createApp(true)



const io = require("socket.io")(server) // { cors: { origin: "*" } })



const roomMaster = new RoomMaster(io)
io.on("connection", (socket: Socket) => {

    //  const worker = new Worker("./one-monitor-game/ServerGame.js", { socket })
    roomMaster.addSocket(socket)
    // printMemoryInfo()
    socket.once(mdts_number_connected, () => {
        socket.emit(stmd_number_connected, { data: roomMaster.getStats() })
    })

    socket.on("error", (err) => {
        console.warn("Error occured in socket:", err)
    })
})
