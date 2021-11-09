import { child, get, push, ref, set, update, onValue, remove, orderByValue, query, orderByChild, limitToLast } from "firebase/database";
import { toast } from "react-toastify";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer } from "../classes/Game";
import { IUserSettings } from "../classes/User";
import { TrackType } from "../shared-backend/shared-stuff";
import { database, } from "./firebaseInit";

export const usersRefPath = "users"

// all highscores is simply all of the highscores
export const allHighscoresRefPath = "all-highscores"
// unique is way to quickly retrieve a players fastest game
export const uniqueHighscoresRefPath = "unique-highscores"

export const playerGameDataRefPath = "player-game-data"
export const gameDataRefPath = "game-data"
export const userGamesRefPath = "games"

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

export const saveGameData = (playerGameInfo: IEndOfRaceInfoPlayer[], gameInfo: IEndOfRaceInfoGame, callback: (gameDataInfo: string[]) => void) => {
    // const newGameKey = push(child(ref(database), gameDataRefPath)).key;
    const newGameKey = gameInfo.gameId
    const updates = {}
    updates[gameDataRefPath + "/" + newGameKey] = gameInfo

    // Facts, like if a user got her personal best
    // If user got top 10 all time
    let gameDataInfo: string[] = []



    const userIds = playerGameInfo.map(p => p.playerId)
    getPlayersBestScoreOnTrackAndLap(userIds, gameInfo.trackType, gameInfo.numberOfLaps, (oldPersonalBests) => {
        getAllTimeBestScoresOnTrackAndLap(gameInfo.trackType, gameInfo.numberOfLaps, (bestScores) => {

            for (let i = 0; i < playerGameInfo.length; i++) {
                if (playerGameInfo[i].isAuthenticated) {
                    const pData = playerGameInfo[i]
                    updates[usersRefPath + "/" + pData.playerId + "/" + userGamesRefPath + "/" + newGameKey + "/" + userGamePlayerInfoPath] = pData
                    updates[usersRefPath + "/" + pData.playerId + "/" + userGamesRefPath + "/" + newGameKey + "/" + userGameGameInfoPath] = gameInfo
                    updates[allHighscoresRefPath + "/" + gameInfo.trackType + "/" + gameInfo.numberOfLaps + "/" + playerGameInfo[i].playerId + "/" + newGameKey] = pData


                    if (oldPersonalBests[pData.playerId].totalTime !== undefined && oldPersonalBests[pData.playerId].totalTime > pData.totalTime) {
                        gameDataInfo.push(
                            `${pData.playerName} set a personal best time.`
                        )
                        updates[uniqueHighscoresRefPath + "/" + gameInfo.trackType + "/" + gameInfo.numberOfLaps + "/" + playerGameInfo[i].playerId] = playerGameInfo[i]
                    } else if (oldPersonalBests[pData.playerId].totalTime !== undefined) {
                        gameDataInfo.push(`${pData.playerName} was ${(pData.totalTime - oldPersonalBests[pData.playerId].totalTime).toFixed(2)} sec from setting a PB.`)
                    } else {
                        gameDataInfo.push(`${pData.playerName} raced this track and number-of-laps combination for the first time.`)
                        updates[uniqueHighscoresRefPath + "/" + gameInfo.trackType + "/" + gameInfo.numberOfLaps + "/" + playerGameInfo[i].playerId] = playerGameInfo[i]
                    }
                    const totalTime = pData.totalTime
                    let place = 1
                    let gottenPlace = false
                    for (let bScores of bestScores) {
                        if (totalTime < bScores.totalTime && !gottenPlace) {
                            gottenPlace = true
                            gameDataInfo.push(
                                `${pData.playerName}'s time was number ${place} of all time.`
                            )
                        }
                        place += 1
                    }
                    if (bestScores.length > 0) {
                        gameDataInfo.push(
                            `${pData.playerName}'s time was ${(pData.totalTime - bestScores[0].totalTime).toFixed(2)} sec from the all time best record.`
                        )
                    }

                }
            }
            update(ref(database), updates).catch((err) => {
                console.log("error saving race", err)
                toast("Error saving race")
            })

            callback(gameDataInfo)
        })
    })


}

const getAllTimeBestScoresOnTrackAndLap = (trackType: TrackType, numberOfLaps: number, callback: (scores: IEndOfRaceInfoPlayer[]) => void) => {
    const bestScoreRef = query(ref(database, uniqueHighscoresRefPath + "/" + trackType + "/" + numberOfLaps), orderByChild("totalTime"), limitToLast(3))
    onValue(bestScoreRef, (snap) => {
        if (snap.exists()) {
            const bestScores = []

            const userIds = Object.keys(snap.val())
            for (let uk of userIds) {
                bestScores.push(snap.val()[uk])
            }

            callback(bestScores)

        } else {
            callback([])
        }
    }, { onlyOnce: true })

}

interface IBestTime {
    playerId: string
    totalTime: number | undefined
}

type IBestTimeD = { [userId: string]: IBestTime }

const getPlayerBestScoreOnTrackAndLap = (userId: string, trackType: TrackType, numberOfLaps: number, callback: (oldPersonalBest: IBestTime) => void) => {
    const playerBestScoreRef = ref(database, uniqueHighscoresRefPath + "/" + trackType + "/" + numberOfLaps + "/" + userId)

    onValue(playerBestScoreRef, (snap) => {
        if (snap.exists()) {
            const d = snap.val() as IEndOfRaceInfoPlayer
            callback({ playerId: d.playerId, totalTime: d.totalTime })
        } else {
            callback({ playerId: userId, totalTime: undefined })
        }
    }, { onlyOnce: true })
}

const getPlayersBestScoreOnTrackAndLap = (userIds: string[], trackType: TrackType, numberOfLaps: number, callback: (oldPersonalBests: IBestTimeD) => void) => {


    let personalBests: { [userId: string]: IBestTime } = {}
    const getItem = (index: number) => {
        // const playerBestScoreRef = ref(database, uniqueHighscoresRefPath + "/" + trackType + "/" + numberOfLaps + "/" + userIds[index])
        getPlayerBestScoreOnTrackAndLap(userIds[index], trackType, numberOfLaps, (oldPersonalBest) => {
            personalBests[userIds[index]] = oldPersonalBest
            if (index === userIds.length - 1) {
                callback(personalBests)
            } else {
                getItem(index + 1)
            }
        })

    }

    getItem(0)

}





// returns dict
// dict["track"]["numberOfLaps"] = IEndOfRaceInfoPlayer[]
// then it is possible to view the highscore of each track - numberOfLaps combo
// and possibly just the bestLapTime of each track..
// I AM not sure what the best way to store the highscores is
type HighscoreStoreDict = { [trackKey: string]: { [numberOfLapsKey: number]: { [playerKeys: string]: { [gameKey: string]: IEndOfRaceInfoPlayer } } } }
type HighscoreDict = { [trackKey: string]: { [numberOfLapsKey: number]: IEndOfRaceInfoPlayer[] } }
export const getAllHighscore = (callback: (playerGameInfo: HighscoreDict, trackKeys: string[], numberOfLapsKeys: string[]) => void) => {
    const allHighscoreRef = ref(database, allHighscoresRefPath)

    onValue(allHighscoreRef, (snap) => {
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
                    const gamesData: IEndOfRaceInfoPlayer[] = []
                    const playerKeys = Object.keys(scores[trackKey][numberOfLapsKey])
                    for (let playerKey of playerKeys) {
                        const gameKeys = Object.keys(scores[trackKey][numberOfLapsKey][playerKey])
                        for (let gameKey of gameKeys) {
                            const gameData = scores[trackKey][numberOfLapsKey][playerKey][gameKey]
                            gamesData.push(gameData)
                        }
                    }
                    gamesData.sort((a: IEndOfRaceInfoPlayer, b: IEndOfRaceInfoPlayer) => {
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


export type UniqueHighscoreDict = { [userId: string]: { [trackType: string]: { [numberOfLaps: number]: IEndOfRaceInfoPlayer } } }
export const getUniqueHighscore = (callback: (highscoreDict: HighscoreDict) => void) => {

    /** limit to last first? */
    const allHighscoreRef = query(ref(database, uniqueHighscoresRefPath), orderByChild("totalTime"))
    // const allHighscoreRef = ref(database, uniqueHighscoresRefPath)

    onValue(allHighscoreRef, (snap) => {
        const uniqueHighscores: HighscoreDict = {}
        if (snap.exists()) {
            const scores = snap.val() as UniqueHighscoreDict
            const keys = Object.keys(scores)
            for (let key of keys) {
                if (key !== undefined && scores[key]) {
                    // @ts-ignore
                    uniqueHighscores[key] = scores[key]
                }
            }
        } else {

        }
        callback(uniqueHighscores)
    }, (err) => {
        console.warn("error getting unique highscroes", err)
    }, { onlyOnce: true })

}

export interface IPlayerGameData {
    playerInfo: IEndOfRaceInfoPlayer
    gameInfo: IEndOfRaceInfoGame
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
        }
    }, err => {
        console.warn("Error getting player data", err)
    }, {})

    return playerDataRef
}


/**
 * Users will not be able to delete games form uniqueHighscores
 */

export const deletePlayerGameData = (userId: string, gameId: string, trackName: string, numberOfLaps: number) => {
    const highscoreRef = ref(database, allHighscoresRefPath + "/" + trackName + "/" + numberOfLaps + "/" + userId + "/" + gameId)


    remove(highscoreRef).then((v) => {
        console.log("removed from highscore", v)
    }).catch(() => {
        console.warn("error removing from highscore")
    })


    const playerDataRef = (ref(database, usersRefPath + "/" + userId + "/" + userGamesRefPath + "/" + gameId))

    remove(playerDataRef).then((v) => {
        toast.success("Successfully removed game data")

    }).catch(err => {
        toast.error("Error when removing game data")
        console.warn("err when removing game data", err)
    })


}

const userSettingsRef = "settings"

export const setDBUserSettings = (userId: string, settings: IUserSettings) => {
    set(ref(database, usersRefPath + "/" + userId + "/" + userSettingsRef), settings).catch(err => {
        console.warn("Error saving user settings", err)
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
        console.warn("Error getting user settings", err)
    }, { onlyOnce: true })
}


export interface AvailableRoomsFirebaseObject {
    roomId: string
    displayName: string
}

export const addToAvailableRooms = (userId: string, object: AvailableRoomsFirebaseObject) => {

    set(ref(database, availableRoomsRefPath + "/" + userId), object).catch(err => {
        console.warn("error adding room to available rooms", object.roomId, userId, err)
    })
}

export const removeFromAvailableRooms = (userId: string) => {
    set(ref(database, availableRoomsRefPath + "/" + userId), null).catch(err => {
        console.error("error removing room to available rooms", userId, err)
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