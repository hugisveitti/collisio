import { child, get, push, ref, set, update, onValue } from "firebase/database";
import { toast } from "react-toastify";
import { IEndOfGameInfoGame, IEndOfGameInfoPlayer } from "../classes/Game";
import { IUserSettings } from "../classes/User";
import { database, gameDataRefPath, highscoreRefPath, userGamesRefPath, usersRefPath } from "./firebaseInit";


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
    const dbRef = ref(database, usersRefPath + "/" + userId)

    onValue(dbRef, snapshot => {
        const user = snapshot.val()
        if (user) {
            callback(user)
        }
    }, err => {
        console.log("Error getting db user", err)
    }, { onlyOnce: true })
}



const userGamePlayerInfoPath = "player-info"
const userGameGameInfoPath = "game-info"

export const saveGameData = (playerGameInfo: IEndOfGameInfoPlayer[], gameInfo: IEndOfGameInfoGame) => {
    const newGameKey = push(child(ref(database), gameDataRefPath)).key;
    const updates = {}
    updates[gameDataRefPath + "/" + newGameKey] = gameInfo
    for (let i = 0; i < playerGameInfo.length; i++) {
        if (playerGameInfo[i].playerId) {
            updates[usersRefPath + "/" + playerGameInfo[i].playerId + "/" + userGamesRefPath + "/" + newGameKey + "/" + userGamePlayerInfoPath] = playerGameInfo[i]
            updates[usersRefPath + "/" + playerGameInfo[i].playerId + "/" + userGamesRefPath + "/" + newGameKey + "/" + userGameGameInfoPath] = gameInfo
            updates[highscoreRefPath + "/" + gameInfo.trackType + "/" + gameInfo.numberOfLaps + "/" + playerGameInfo[i].playerId + "/" + newGameKey] = playerGameInfo[i]
        }
    }

    update(ref(database), updates).catch((err) => {
        console.log("error saving race", err)
        toast("Error saving race")
    })
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

            let numberOfLapsKeys: string[] = []

            for (let trackKey of trackKeys) {
                trackDict[trackKey] = {}
                const currNumberOfLapsKeys = Object.keys(scores[trackKey])
                numberOfLapsKeys = numberOfLapsKeys.concat(currNumberOfLapsKeys)
                for (let numberOfLapsKey of currNumberOfLapsKeys) {
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
            numberOfLapsKeys.sort()
            numberOfLapsKeys = [...new Set(numberOfLapsKeys)]


            callback(trackDict, trackKeys, numberOfLapsKeys)

        } else {
            callback({}, [], [])
            console.log("no highscores")
        }
    })
}

export interface IPlayerGameData {
    playerInfo: IEndOfGameInfoPlayer
    gameInfo: IEndOfGameInfoGame
}

export const getPlayerGameData = (userId: string, callback: (gamesData: IPlayerGameData[] | undefined) => void) => {
    get(ref(database, usersRefPath + "/" + userId + "/" + userGamesRefPath)).then(snap => {
        if (snap.exists()) {
            const data = snap.val()
            const gamesData = [] as IPlayerGameData[]
            const keys = Object.keys(data)
            for (let key of keys) {
                gamesData.push({ playerInfo: data[key][userGamePlayerInfoPath], gameInfo: data[key][userGameGameInfoPath] })
            }
            callback(gamesData)

        } else {
            callback(undefined)
            console.log("player game data does not exists")
        }
    })
}

const userSettingsRef = "settings"

export const setDBUserSettings = (userId: string, settings: IUserSettings) => {
    set(ref(database, usersRefPath + "/" + userId + "/" + userSettingsRef), settings).catch(err => {
        console.log("Error saving user settings", err)
        toast.error("Error saving user settings", err)
    })
}


export const getDBUserSettings = (userId: string, callback: (settings: IUserSettings | undefined) => void) => {
    const settingsRef = ref(database, usersRefPath + "/" + userId + "/" + userSettingsRef)
    onValue(settingsRef, snap => {
        if (snap.exists()) {
            callback(snap.val())
        } else {
            callback(undefined)
        }
    }, err => {
        console.log("Error getting user settings", err)
    }, { onlyOnce: true })
}