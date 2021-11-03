import { child, get, push, ref, set, update, onValue, remove } from "firebase/database";
import { toast } from "react-toastify";
import { IEndOfGameInfoGame, IEndOfGameInfoPlayer } from "../classes/Game";
import { IUserSettings } from "../classes/User";
import { database, gameDataRefPath, highscoreRefPath, userGamesRefPath, usersRefPath } from "./firebaseInit";

const availableRoomsRefPath = "available-rooms"
const profilesRefPath = "profiles"

const userGamePlayerInfoPath = "player-info"
const userGameGameInfoPath = "game-info"

export interface IUser {
    displayName: string
    email: string
    photoURL?: string
    uid: string
}

export const createDBUser = (userData: IUser, callback?: (user: IUser) => void) => {
    // only create if not exists
    const dbUserRef = (ref(database, usersRefPath + "/" + userData.uid))

    onValue(dbUserRef, snapshot => {
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
    }, err => {
        console.log("Error getting DBUser in create", err)
    }, { onlyOnce: true })
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

export interface IProfile {
    displayName: string
    photoURL: string
    uid: string
}

export const setDBUserProfile = (userId: string, data: IProfile) => {
    set(ref(database, profilesRefPath + "/" + userId), data)
}

export const getDBUserProfile = (userId: string, callback: (data: IProfile | undefined) => void) => {
    const profileRef = ref(database, profilesRefPath + "/" + userId)
    onValue(profileRef, (snap => {
        if (snap.exists()) {
            callback(snap.val())
        } else {
            callback(undefined)
        }
    }), { onlyOnce: true })
}

export const saveGameData = (playerGameInfo: IEndOfGameInfoPlayer[], gameInfo: IEndOfGameInfoGame) => {
    // const newGameKey = push(child(ref(database), gameDataRefPath)).key;
    const newGameKey = gameInfo.gameId
    const updates = {}
    updates[gameDataRefPath + "/" + newGameKey] = gameInfo

    for (let i = 0; i < playerGameInfo.length; i++) {
        if (playerGameInfo[i].isAuthenticated) {
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
    const highscoreRef = ref(database, highscoreRefPath)

    onValue(highscoreRef, (snap) => {
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
                        return a.totalTime - b.totalTime
                    })
                    trackDict[trackKey][numberOfLapsKey] = gamesData
                }
            }
            numberOfLapsKeys.sort()
            numberOfLapsKeys = [...new Set(numberOfLapsKeys)]


            callback(trackDict, trackKeys, numberOfLapsKeys)

        } else {
            callback({}, [], [])
        }
    }, (err) => {
        console.log("Error getting highscores", err)
    }, { onlyOnce: true })
}

export interface IPlayerGameData {
    playerInfo: IEndOfGameInfoPlayer
    gameInfo: IEndOfGameInfoGame
}

export const getPlayerGameData = (userId: string, callback: (gamesData: IPlayerGameData[] | undefined) => void) => {
    const playerDataRef = ref(database, usersRefPath + "/" + userId + "/" + userGamesRefPath)


    onValue(playerDataRef, snap => {
        if (snap.exists()) {
            const data = snap.val()
            const gamesData = [] as IPlayerGameData[]
            const keys = Object.keys(data)
            for (let key of keys) {
                gamesData.unshift({ playerInfo: data[key][userGamePlayerInfoPath], gameInfo: data[key][userGameGameInfoPath] })
            }

            callback(gamesData)

        } else {
            callback(undefined)
            console.log("player game data does not exists")
        }
    }, err => {
        console.log("Error getting player data", err)
    }, {})

    return playerDataRef
}

export const deletePlayerGameData = (userId: string, gameId: string, trackName: string, numberOfLaps: number) => {
    const highscoreRef = ref(database, highscoreRefPath + "/" + trackName + "/" + numberOfLaps + "/" + userId + "/" + gameId)


    remove(highscoreRef).then((v) => {
        console.log("removed from highscore", v)
    }).catch(() => {
        console.log("error removing from highscore")
    })


    const playerDataRef = (ref(database, usersRefPath + "/" + userId + "/" + userGamesRefPath + "/" + gameId))

    remove(playerDataRef).then((v) => {
        toast.success("Successfully removed game data")

    }).catch(err => {
        toast.error("Error when removing game data")
        console.log("err when removing game data", err)
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


export interface AvailableRoomsFirebaseObject {
    roomId: string
    displayName: string
}

export const addToAvailableRooms = (userId: string, object: AvailableRoomsFirebaseObject) => {

    set(ref(database, availableRoomsRefPath + "/" + userId), object).catch(err => {
        console.log("error adding room to available rooms", object.roomId, userId, err)
    })
}

export const removeFromAvailableRooms = (userId: string) => {
    set(ref(database, availableRoomsRefPath + "/" + userId), null).catch(err => {
        console.log("error removing room to available rooms", userId, err)
    })
}


export const createAvailableRoomsListeners = (userId: string, callback: (roomIds: AvailableRoomsFirebaseObject[]) => void) => {
    const availableRoomsRef = ref(database, availableRoomsRefPath + "/" + userId)

    onValue(availableRoomsRef, (snap) => {
        if (snap.exists()) {
            // TODO: include friends 
            const roomId = snap.val() as AvailableRoomsFirebaseObject
            callback([roomId])
        } else {
            callback([])
        }
    })

    return availableRoomsRef
}