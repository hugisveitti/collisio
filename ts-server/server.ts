import { Request, Response } from "express";
/** toDO fix this shit */
const express = require("express")

import * as path from "path";
import * as  si from 'systeminformation';
import * as fs from "fs"
import { Socket } from "socket.io";

const app = express()
// promises style - new since version 3

si.cpu()
    .then(data => {
        console.log("####CPU Info#####")
        console.log("cores", data.cores)
        console.log("#####END CPU INFO#####")
    })
    .catch(error => console.error(error));

const byteToGig = (byte: number) => {
    return byte / (1024 ** 3)
}

const printMemoryInfo = () => {

    si.mem()
        .then(data => {
            console.log("#### Memory Info #####", new Date().toISOString())
            console.log("Total", byteToGig(data.total).toFixed(2), ", Free:", byteToGig(data.free).toFixed(2))
            console.log("##### END Memory INFO #####")
        })
        .catch(error => console.error(error));
}

printMemoryInfo()

let port = process.env.PORT || 80
import * as os from "os"
/** only works on my PC */
let onLocalhost = false
if (os.hostname().includes("Lisa")) {
    console.log("On localhost")
    port = 5000
    onLocalhost = true
}

const isValidHost = (host: string | undefined) => {

    return onLocalhost || host?.includes("collisio.club") || host?.includes("collisia.club")
}

const buildFolder = "dist"

const encrypt = require("../public/src/shared-backend/encryption.json")

console.log("enc", encrypt)
for (let key of Object.keys(encrypt)) {
    app.get(`/${key}`, (req: Request, res: Response) => {
        console.log("getting model", key)
        res.sendFile(path.join(__dirname, `../public/${buildFolder}/models/${encrypt[key]}`));
    });
}

app.get("/models/front-page.glb", (req: Request, res: Response) => {
    console.log("getting model")
    res.sendFile(path.join(__dirname, `../public/${buildFolder}/models/front-page.glb`));
});

app.use(express.static(path.join(__dirname, `../public/${buildFolder}`), { index: false }));
app.use(express.static(path.join(__dirname, `../public/src`), { index: false }));

const indexHTMLPath = `../public/${buildFolder}/index.html`

const sendTestHTML = (req: Request, res: Response) => {
    const host = req.get("host")
    console.log("host", host)
    if (isValidHost(host)) {
        res.sendFile(path.join(__dirname, `../public/${buildFolder}/test.html`));
    } else {
        res.send("ERROR")
    }
}



app.get("/test", sendTestHTML);

app.get("/mobileonly", sendTestHTML);

app.get("/speedtest", sendTestHTML);

app.get("/driveinstructions/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename
    console.log("filename", filename)
    res.sendFile(path.join(__dirname, `./testDriving/recordings/${filename}`));
});

app.get("/vehicleconfig/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename
    console.log("filename", filename)
    res.sendFile(path.join(__dirname, `./testDriving/${filename}`));
});

var bodyParser = require("body-parser");

app.use(bodyParser.json({ limit: "20mb" }));



app.post("/saverecording", (req: Request, res: Response) => {

    const data = req.body

    const date = new Date().toISOString().slice(0, 10)
    const trackName = data.trackName
    const numberOfLaps = data.numberOfLaps
    const vehicleType = data.vehicleType

    //const fn = path.join(__dirname, `./testDriving/recordings/recording_${trackName}_${numberOfLaps}_${vehicleType}_${date}.txt`)
    const fn = path.join(__dirname, `./testDriving/recordings/recording_${trackName}_${numberOfLaps}_${vehicleType}.txt`)

    // fs.open(fn)
    fs.writeFile(fn, data.instructions, (err) => {
        if (err) {
            console.warn("Error saving recording:", err)
            res.status(500).send({ "message": "Error saving file", err })
        } else {
            res.status(200).send({ "message": "nice", fn })
        }
    })

})

app.get("/ammo.wasm.js", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, `./public/${buildFolder}/ammo/ammo.wasm.js`));
})


const sendIndexHTML = (req: Request, res: Response) => {
    const host = req.get("host")
    console.log("sending index", "host", host, ", ip", req.socket.remoteAddress, ", url:", req.url, "date:", new Date().toISOString())
    if (isValidHost(host)) {
        res.status(200).sendFile(path.join(__dirname, indexHTMLPath));
    } else {
        res.status(500).send("ERROR")
    }
}
app.get("/", sendIndexHTML);


app.get("/trophy", sendIndexHTML)
app.get("/trophy/:id", sendIndexHTML)

app.get("/tournament", sendIndexHTML)
app.get("/tournament/:id", sendIndexHTML)


// There must be some better way to do this shit
app.get("/wait", sendIndexHTML);

app.get("/wait/:gameId", sendIndexHTML);

app.get("/game", sendIndexHTML);

// app.get("/game/:id", (_: Request, res: Response) => {
//     res.sendFile(path.join(__dirname, indexHTMLPath));
// });

app.get("/premium", sendIndexHTML)
app.get("/about", sendIndexHTML)
app.get("/connect", sendIndexHTML)



app.get("/controls", sendIndexHTML);

app.get("/how-to-play", sendIndexHTML);

app.get("/highscores", sendIndexHTML);

app.get("/private-profile", sendIndexHTML);

app.get("/user/:id", sendIndexHTML);

app.get("/show-room", sendIndexHTML);


const adminHTMLPath = `../public/${buildFolder}/admin.html`
app.get("/admin", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, adminHTMLPath));
})

import { adminFunctions } from "./adminTools";
adminFunctions(app)

const server = app.listen(port, () => {
    console.log(`listening on port ${port}`)
})


import RoomMaster from "./one-monitor-game/ServerGame"
import { mdts_number_connected, stmd_number_connected } from "../public/src/shared-backend/shared-stuff";

const { Worker } = require('worker_threads')


const io = require("socket.io")(server,) // { cors: { origin: "*" } })
const roomMaster = new RoomMaster(io)
io.on("connection", (socket: Socket) => {

    //  const worker = new Worker("./one-monitor-game/ServerGame.js", { socket })
    roomMaster.addSocket(socket)
    printMemoryInfo()
    socket.once(mdts_number_connected, () => {
        socket.emit(stmd_number_connected, { data: roomMaster.getStats() })
    })

    socket.on("error", (err) => {
        console.warn("Error occured in socket:", err)
    })
})

app.get("/robot.txt", (req: Request, res: Response) => {
    res.status(200).sendFile(path.join(__dirname, "../robot.txt"))
})
app.get("/humans.txt", (req: Request, res: Response) => {
    res.status(200).sendFile(path.join(__dirname, "../humans.txt"))
})

app.get("*", (req: Request, res: Response) => {
    const host = req.get("host")
    console.log("notfound", "host", host, ", ip", req.socket.remoteAddress, ", url:", req.url, "date:", new Date().toISOString())
    if (isValidHost(host)) {
        // res.sendFile(path.join(__dirname, indexHTMLPath));
        res.status(404).sendFile(path.join(__dirname, indexHTMLPath));
    } else {
        res.send("ERROR")
    }
});