import { database, admin } from "./firebase-config";
import { Request, Response } from "express";

import * as path from "path";
import { get, limitToLast, onValue, orderByChild, QueryConstraint, ref } from "@firebase/database";
import { query } from "firebase/database";
import { isAdmin } from "@firebase/util";

const buildFolder = "dist"

type CallbackStatus = "success" | "error"
type StatusCode = 403 | 200 | 500

export const adminFunctions = (app: any) => {


    const adminsRefPath = "admins"
    const roomDataPath = "room-data"
    const gameDataPath = "game-data"

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

    app.get("/role/:userTokenId", (req: Request, res: Response) => {
        const data = req.params

        const { userTokenId } = data
        admin.auth().verifyIdToken(userTokenId).then((decodedToken: any) => {
            getIsAdmin(decodedToken.uid, (isAdmin) => {
                if (isAdmin) {
                    res.status(200).send(JSON.stringify({
                        status: "success",
                        statusCode: 200,
                        message: "Welcome admin"
                    }))
                } else {
                    res.status(403).send(JSON.stringify({
                        status: "error",
                        statusCode: 403,
                        message: "Unauthorized"
                    }))
                }
            })
        })
    })

    interface ICallbackData {
        data?: any
        status: CallbackStatus
        statusCode: StatusCode
        message?: string
    }

    interface IQueryParams {
        n?: number
    }

    const createFirebaseQueries = (queryParams: IQueryParams): QueryConstraint[] => {
        const queries = []

        if (queryParams.n) {
            queries.push(limitToLast(queryParams.n))
        }
        console.log("queries", queries)
        return queries
    }


    const getRoomData = (userId: string, queryParams: IQueryParams, callback: (callbackData: ICallbackData) => void) => {
        /** first check if user is admin */
        getIsAdmin(userId, (isAdmin) => {
            if (isAdmin) {
                const queries = createFirebaseQueries(queryParams)
                queries.push(orderByChild("date"))

                /** I believe limitToLast(n) will work but we will then also have to sort them on the front end */
                const roomDataRef = query(ref(database, roomDataPath), ...queries)

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

    const getGameData = (userId: string, queryParams: IQueryParams, callback: (gameData: ICallbackData) => void) => {

        getIsAdmin(userId, (isAdmin) => {
            if (isAdmin) {
                const queries = createFirebaseQueries(queryParams)
                queries.push(orderByChild("date"))

                /** I believe limitToLast(n) will work but we will then also have to sort them on the front end */
                const gameDataRef = query(ref(database, gameDataPath), ...queries)
                onValue(gameDataRef, (snap) => {
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




    const getQueryParams = (req: Request): IQueryParams => {
        const { n } = req.query
        const queryParams = {
            n: n && !isNaN(+n) ? +n : undefined
        }

        return queryParams
    }

    /**
     * query params 
     * n: number of latest entries to fetch
     */
    app.get("/room-data/:userTokenId", (req: Request, res: Response) => {
        const data = req.params

        const { userTokenId } = data

        const queryParams = getQueryParams(req)


        admin.auth().verifyIdToken(userTokenId).then((decodedToken: any) => {
            getRoomData(decodedToken.uid, queryParams, (roomDataRes => {

                res.status(roomDataRes.statusCode).send(JSON.stringify(roomDataRes));
            }))

        }).catch((err: any) => {
            console.log("error", err)
            res.status(403).send(JSON.stringify({ message: "Could not verify user", status: "error" }));
        })
    })

    /**
        * query params 
        * n: number of latest entries to fetch
        */
    app.get("/game-data/:userTokenId", (req: Request, res: Response) => {
        const data = req.params
        const { userTokenId } = data
        const queryParams = getQueryParams(req)
        admin.auth().verifyIdToken(userTokenId).then((decodedToken: any) => {
            console.log("userid", decodedToken.uid)
            getGameData(decodedToken.uid, queryParams, (gameDataRes => {

                res.status(gameDataRes.statusCode).send(JSON.stringify(gameDataRes));
            }))

        }).catch((err: any) => {
            console.log("error", err)
            res.status(403).send(JSON.stringify({ message: "Could not verify user", status: "error" }));
        })
    })
}