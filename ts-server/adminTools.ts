import { database, admin } from "./firebase-config";
import { Request, Response } from "express";

import * as path from "path";
import { onValue, ref } from "@firebase/database";

const buildFolder = "dist"

type CallbackStatus = "success" | "error"
type StatusCode = 403 | 200 | 500

export const adminFunctions = (app: any) => {


    const adminsRefPath = "admins"
    const roomDataPath = "room-data"

    const getIsAdmin = (userId: string, callback: (isAdmin: boolean) => void) => {
        const adminsRef = ref(database, adminsRefPath + "/" + userId)
        onValue(adminsRef, (snap) => {
            if (snap.exists()) {
                /** is admin */
                callback(true)
            } else {
                callback(false)
            }
        }, (err) => {
            console.log("error getting admin data")
            callback(false)
        }, {
            onlyOnce: true
        })
    }

    interface ICallbackData {
        data?: any
        status: CallbackStatus
        statusCode: StatusCode
        message?: string
    }
    const getRoomData = (userId: string, callback: (callbackData: ICallbackData) => void) => {
        /** first check if user is admin */
        getIsAdmin(userId, (isAdmin) => {
            if (isAdmin) {
                const roomDataRef = ref(database, roomDataPath)
                onValue(roomDataRef, (snap) => {
                    callback({
                        status: "success",
                        statusCode: 200,
                        data: snap.val(),
                        message: "Successfully gotten room data"
                    })
                }, (err) => {
                    console.log("error getting room data")
                    callback({
                        status: "error",
                        statusCode: 500,

                        message: "Unknown error"
                    })
                }, { onlyOnce: true })
            } else {
                callback({
                    status: "error",
                    statusCode: 403,

                    message: "User not admin"
                })
            }
        })
    }

    const adminHTMLPath = `../public/${buildFolder}/admin.html`
    app.get("/admin", (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, adminHTMLPath));
    })

    app.get("/admin-data/:userTokenId", (req: Request, res: Response) => {
        const data = req.params
        const { userTokenId } = data
        admin.auth().verifyIdToken(userTokenId).then((decodedToken: any) => {
            console.log("userid", decodedToken.uid)
            getRoomData(decodedToken.uid, (roomDataRes => {

                res.status(200).send(JSON.stringify(roomDataRes));
            }))

        }).catch((err: any) => {
            console.log("error", err)
            res.status(403).send(JSON.stringify({ message: "Could not verify user", status: "error" }));
        })
    })
}