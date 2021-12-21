import { Request, Response } from "express";
/** toDO fix this shit */
const express = require("express")

import * as path from "path";
import * as  si from 'systeminformation';
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

si.mem()
    .then(data => {
        console.log("####Memory Info#####")
        console.log("Total", byteToGig(data.total).toFixed(2))
        console.log("Free", byteToGig(data.free).toFixed(2))
        console.log("#####END Memory INFO#####")
    })
    .catch(error => console.error(error));

console.log("Max event listeners", Socket.EventEmitter.defaultMaxListeners)

const port = process.env.PORT || 5000


// app.use(function (_:Request, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-_uested-With, Content-Type, Accept"
//     );
//     next();
// });



const buildFolder = "dist"

app.use(express.static(path.join(__dirname, `../public/${buildFolder}`)));
app.use(express.static(path.join(__dirname, `../public/src`)));

const indexHTMLPath = `../public/${buildFolder}/index.html`

app.get("/test", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, `../public/${buildFolder}/test.html`));
});

app.get("/ammo.wasm.js", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, `./public/${buildFolder}/ammo/ammo.wasm.js`));
})


app.get("/", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

const sendIndexHTML = (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
}

app.get("/trophy", sendIndexHTML)
app.get("/trophy/:id", sendIndexHTML)


// There must be some better way to do this shit
app.get("/wait", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

app.get("/wait/:gameId", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

app.get("/game", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

// app.get("/game/:id", (_: Request, res: Response) => {
//     res.sendFile(path.join(__dirname, indexHTMLPath));
// });

app.get("/premium", sendIndexHTML)
app.get("/about", sendIndexHTML)
app.get("/connect", sendIndexHTML)



app.get("/controls", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

app.get("/how-to-play", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

app.get("/highscores", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

app.get("/private-profile", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

app.get("/user/:id", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});

app.get("/show-room", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});


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

const { Worker } = require('worker_threads')


const io = require("socket.io")(server,) // { cors: { origin: "*" } })
const roomMaster = new RoomMaster(io)
io.on("connection", (socket: Socket) => {
    //  const worker = new Worker("./one-monitor-game/ServerGame.js", { socket })
    roomMaster.addSocket(socket)
})

app.get("*", (_: Request, res: Response) => {
    res.status(404).sendFile(path.join(__dirname, indexHTMLPath));
});