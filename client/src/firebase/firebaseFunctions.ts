import { child, get, push, ref, set, update } from "firebase/database"
import { IEndOfGameInfoGame, IEndOfGameInfoPlayer, TrackType } from "../classes/Game";
import { database, gameDataRefPath, highscoreRefPath, usersRefPath } from "./firebaseInit"


export interface IUser {
    displayName: string
    email: string
    photoURL?: string
    uid: string
}

export const createDBUser = (userData: IUser, callback?: (user: IUser) => void) => {
    // only create if not exists
    get(ref(database, usersRefPath + "/" + userData.uid)).then(snapshot => {
        if (!snapshot.exists()) {
            set(ref(database, usersRefPath + "/" + userData.uid), userData).catch((err) => {
                console.log("Error setting db user", err);
            });
            if (callback) {
                callback(userData)
            }
        } else {
            if (callback) {
                callback(snapshot.val())
            }
        }
    }).catch(err => {
        console.log("Error getting DBUser in create", err)
    })
}

export const getDBUser = (userId: string, callback: (user: IUser) => void) => {
    get(ref(database, usersRefPath + "/" + userId)).then(snapshot => {
        const user = snapshot.val()
        if (user) {
            callback(user)
        }
    })
}





export const saveGameData = (playerGameInfo: IEndOfGameInfoPlayer[], gameInfo: IEndOfGameInfoGame) => {
    const newGameKey = push(child(ref(database), gameDataRefPath)).key;
    const updates = {}
    updates[gameDataRefPath + "/" + newGameKey] = gameInfo
    for (let i = 0; i < playerGameInfo.length; i++) {
        if (playerGameInfo[i].playerId) {
            updates[usersRefPath + "/" + playerGameInfo[i].playerId + "/" + newGameKey] = playerGameInfo[i]
            updates[highscoreRefPath + "/" + gameInfo.trackType + "/" + gameInfo.numberOfLaps + "/" + playerGameInfo[i].playerId + "/" + newGameKey] = playerGameInfo[i]
        }
    }

    update(ref(database), updates)
}


// returns dict
// dict["track"]["numberOfLaps"] = IEndOfGameInfoPlayer[]
// then it is possible to view the highscore of each track - numberOfLaps combo
// and possibly just the bestLapTime of each track..
// I AM not sure what the best way to store the highscores is
type HighscoreStoreDict = { [trackKey: string]: { [numberOfLapsKey: number]: { [playerKeys: string]: { [gameKey: string]: IEndOfGameInfoPlayer } } } }
type HighscoreDict = { [trackKey: string]: { [numberOfLapsKey: number]: IEndOfGameInfoPlayer[] } }
export const getHighscore = (callback: (playerGameInfo: HighscoreDict, trackKeys: string[], numberOfLapsKeys: string[]) => void) => {
    get(ref(database, highscoreRefPath)).then((snap) => {
        if (snap.exists()) {
            const scores = snap.val() as HighscoreStoreDict
            const trackKeys = Object.keys(scores)
            const trackDict = {}
            let numberOfLapsKeys: string[]

            for (let trackKey of trackKeys) {
                trackDict[trackKey] = {}
                numberOfLapsKeys = Object.keys(scores[trackKey])
                for (let numberOfLapsKey of numberOfLapsKeys) {
                    // const trackNumberScores = scores[trackKey][numberOfLapsKey]
                    const gamesData: IEndOfGameInfoPlayer[] = []
                    const playerKeys = Object.keys(scores[trackKey][numberOfLapsKey])
                    for (let playerKey of playerKeys) {
                        const gameKeys = Object.keys(scores[trackKey][numberOfLapsKey][playerKey])
                        for (let gameKey of gameKeys) {
                            const gameData = scores[trackKey][numberOfLapsKey][playerKey][gameKey]
                            gamesData.push(gameData)
                        }
                    }
                    gamesData.sort((a: IEndOfGameInfoPlayer, b: IEndOfGameInfoPlayer) => {
                        return a.bestLapTime - b.bestLapTime
                    })
                    trackDict[trackKey][numberOfLapsKey] = gamesData
                }
            }
            callback(trackDict, trackKeys, numberOfLapsKeys)

        } else {
            callback({}, [], [])
            console.log("no highscores")
        }
    })
}