import * as os from "os"
import * as path from "path";
import { Request, Response } from "express";
/** toDO fix this shit */
const express = require("express")

export const getPortLocalhost = () => {
    let port = process.env.PORT || 80

    /** only works on my PC */
    let onLocalhost = false
    if (os.hostname().includes("Lisa")) {
        console.log("On localhost")
        port = 5000
        onLocalhost = true
    }

    return { port, onLocalhost }
}

const printRequestInfo = (req: Request) => {
    const host = req.get("host")
    console.log(
        "host", host, ", ip", req.socket.remoteAddress, ", behind proxy ip:", req.headers?.['x-forwarded-for'], ", express ip:", req.ip, ", url:", req.url, "date:", new Date().toISOString()
    )
}

const router = (app: any) => {
    const { onLocalhost } = getPortLocalhost()

    const isValidHost = (host: string | undefined) => {
        return onLocalhost || host?.includes("collisio.club") || host?.includes("collisia.club")
    }

    const buildFolder = "dist"

    const encrypt = require("../public/src/shared-backend/encryption.json")
    for (let key of Object.keys(encrypt)) {
        app.get(`/${key}`, (req: Request, res: Response) => {
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
        console.log("Sending test")
        printRequestInfo(req)
        if (isValidHost(host)) {
            res.sendFile(path.join(__dirname, `../public/${buildFolder}/test.html`));
        } else {
            res.send("ERROR")
        }
    }



    app.get("/test", sendTestHTML);

    app.get("/mobileonly", sendTestHTML);

    app.get("/speedtest", sendTestHTML);

    var bodyParser = require("body-parser");

    app.use(bodyParser.json({ limit: "20mb" }));

    app.get("/ammo.wasm.js", (_: Request, res: Response) => {
        res.sendFile(path.join(__dirname, `./public/${buildFolder}/ammo/ammo.wasm.js`));
    })
    const sendIndexHTML = (req: Request, res: Response) => {
        const host = req.get("host")
        console.log("reqest to index")
        printRequestInfo(req)
        if (isValidHost(host)) {
            res.status(200).sendFile(path.join(__dirname, indexHTMLPath));
        } else {
            console.log("ERROR")

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


    app.get("/robot.txt", (req: Request, res: Response) => {
        res.status(200).sendFile(path.join(__dirname, "../robot.txt"))
    })
    app.get("/humans.txt", (req: Request, res: Response) => {
        res.status(200).sendFile(path.join(__dirname, "../humans.txt"))
    })

    app.get("*", (req: Request, res: Response) => {
        const host = req.get("host")
        console.log("Request to star")
        printRequestInfo(req)
        if (isValidHost(host)) {
            // res.sendFile(path.join(__dirname, indexHTMLPath));
            res.status(404).sendFile(path.join(__dirname, indexHTMLPath));
        } else {
            console.log("ERROR")
            res.send("ERROR")
        }
    });
}

export default router 