import { admin, firestore } from "./firebase-config";
import { Request, Response } from "express";

import * as path from "path";
//import { get, limitToLast, onValue, orderByChild, QueryConstraint, ref } from "@firebase/database";
//import { query } from "firebase/database";
import { isAdmin } from "@firebase/util";
import { doc, getDoc, getDocs, limit, orderBy, query } from "@firebase/firestore";
import { collection } from "firebase/firestore";

const buildFolder = "dist"

type CallbackStatus = "success" | "error"
type StatusCode = 403 | 200 | 500

export const adminFunctions = (app: any) => {


    const adminsRefPath = "admins"
    const roomDataPath = "roomData"
    const gameDataPath = "allGames"

    const getIsAdmin = async (userId: string, callback: (isAdmin: boolean) => void) => {
        const adminsRef = doc(firestore, adminsRefPath, userId)
        console.log("userId", userId)
        try {

            const data = await getDoc(adminsRef)
            if (data.exists()) {
                callback(true)
            } else {
                callback(false)
            }
        } catch (e) {
            console.warn("Error getting isAdmin", e)
        }

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
        data?: any | any[]
        status: CallbackStatus
        statusCode: StatusCode
        message?: string
    }

    interface IQueryParams {
        n?: number
    }

    // const createFirebaseQueries = (queryParams: IQueryParams): QueryConstraint[] => {
    //     const queries = []

    //     if (queryParams.n) {
    //         queries.push(limitToLast(queryParams.n))
    //     }
    //     console.log("queries", queries)
    //     return queries
    // }


    const getRoomData = (userId: string, queryParams: IQueryParams, callback: (callbackData: ICallbackData) => void) => {
        /** first check if user is admin */
        getIsAdmin(userId, async (isAdmin) => {
            if (isAdmin) {
                // const queries = createFirebaseQueries(queryParams)
                // queries.push(orderByChild("date"))
                const roomDataRef = collection(firestore, roomDataPath)
                let q = query(roomDataRef, orderBy("date", "desc"))
                if (queryParams.n) {
                    q = query(q, limit(queryParams.n))
                }

                try {


                    const data = await getDocs(q)
                    const rooms: any[] = []
                    data.forEach(doc => {
                        rooms.push(doc.data())
                    })

                    callback({
                        status: "success",
                        statusCode: 200,
                        data: rooms,
                        message: "Successfully gotten room data"
                    })
                } catch (e) {
                    console.warn("Error getting room data", e)
                    callback({
                        status: "error",
                        statusCode: 500,

                        message: "Error gotten room data"
                    })
                }


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

        getIsAdmin(userId, async (isAdmin) => {
            if (isAdmin) {

                const gameDataRef = collection(firestore, gameDataPath)
                let q = query(gameDataRef, orderBy("date", "desc"))
                if (queryParams.n) {
                    q = query(q, limit(queryParams.n))
                }

                try {

                    const data = await getDocs(q)
                    const games: any[] = []
                    data.forEach(doc => {
                        games.push(doc.data())
                    })

                    callback({
                        status: "success",
                        statusCode: 200,
                        data: games,
                        message: "Successfully gotten room data"
                    })
                } catch (e) {
                    console.warn("Error getting game data", e)
                    callback({
                        status: "error",
                        statusCode: 500,
                        message: "Error"
                    })
                }

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