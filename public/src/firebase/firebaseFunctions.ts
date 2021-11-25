import { limitToLast, onValue, orderByChild, query, Query, ref, remove, set, update } from "firebase/database";
import { toast } from "react-toastify";
import { v4 as uuid } from "uuid";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IRoomInfo } from "../classes/Game";
import { IUserSettings } from "../classes/User";
import { TrackName } from "../shared-backend/shared-stuff";
import { getDateNow } from "../utils/utilFunctions";
import { database } from "./firebaseInit";

export const usersRefPath = "users"

// all highscores is simply all of the highscores
export const allHighscoresRefPath = "all-highscores"
// unique is way to quickly retrieve a players fastest game
export const uniqueHighscoresRefPath = "unique-highscores"

export const playerGameDataRefPath = "player-game-data"
export const gameDataRefPath = "game-data"
export const roomDataRefPath = "room-data"
export const userGamesRefPath = "games"

const availableRoomsRefPath = "available-rooms"
const profilesRefPath = "profiles"

const userGamePlayerInfoPath = "player-info"
const userGameGameInfoPath = "game-info"

export interface IUser {
    displayName: string
    email: string
    photoURL: string
    uid: string
    isPremium: boolean,
}

export const createDBUser = (userData: IUser, callback?: (user: IUser) => void) => {
    // only create if not exists
    const dbUserRef = (ref(database, usersRefPath + "/" + userData.uid))

    onValue(dbUserRef, snapshot => {
        if (!snapshot.exists()) {
            userData["creationDate"] = getDateNow()
            set(ref(database, usersRefPath + "/" + userData.uid), userData).catch((err) => {
                console.warn("Error setting db user", err);
            })
            if (callback) {
                callback(userData)
            }
        } else {
            if (callback) {
                callback(snapshot.val())
            }
            const updates = {}
            updates[usersRefPath + "/" + userData.uid + "/" + "latestLogin"] = getDateNow()
            update(ref(database), updates).catch((err) => {
                console.warn("error updating user data", err)
            })

        }
    }, err => {
        console.warn("Error getting DBUser in create", err)
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
        console.warn("Error getting db user", err)
    }, { onlyOnce: true })
}

/** toDo this function
 * I am thinking of creating a firebase list
 * authenticated-users / ${uid} / authDetails
 * authDetails:
 * - date of buy
 * - amount payed
 *
 * can only be written to from the server after user has payed,
 * look into examples 
 */
export const getIsPremiumUser = (userId: string, callback: (isPremium: boolean) => void) => {
    callback(false)
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

export const saveRaceDataPlayer = (playerGameInfo: IEndOfRaceInfoPlayer, callback: (gameDataInfo: string[]) => void) => {
    const newGameKey = playerGameInfo.gameId

    const updates = {}
    const gameDataInfo: string[] = []
    const { trackName, numberOfLaps } = playerGameInfo

    getPlayerBestScoreOnTrackAndLap(playerGameInfo.playerId, trackName, numberOfLaps, (oldPersonalBest) => {
        getAllTimeBestScoresOnTrackAndLap(trackName, numberOfLaps, 5, (bestScores) => {

            if (playerGameInfo.isAuthenticated) {
                const pData = playerGameInfo
                updates[usersRefPath + "/" + pData.playerId + "/" + userGamesRefPath + "/" + newGameKey + "/" + userGamePlayerInfoPath] = pData
                updates[allHighscoresRefPath + "/" + trackName + "/" + numberOfLaps + "/" + playerGameInfo.playerId + "/" + newGameKey] = pData
                if (oldPersonalBest.totalTime !== undefined && oldPersonalBest.totalTime > pData.totalTime) {
                    gameDataInfo.push(
                        `${pData.playerName} set a personal best time.`
                    )
                    updates[uniqueHighscoresRefPath + "/" + trackName + "/" + numberOfLaps + "/" + playerGameInfo.playerId] = playerGameInfo
                } else if (oldPersonalBest.totalTime !== undefined) {
                    gameDataInfo.push(`${pData.playerName} was ${(pData.totalTime - oldPersonalBest.totalTime).toFixed(2)} sec from setting a PB.`)
                } else {
                    gameDataInfo.push(`${pData.playerName} raced this track and number-of-laps combination for the first time.`)
                    updates[uniqueHighscoresRefPath + "/" + trackName + "/" + numberOfLaps + "/" + playerGameInfo.playerId] = playerGameInfo
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
            update(ref(database), updates).catch((err) => {
                console.warn("error saving player data", err)
                toast.error("Error saving player data")
            })

            callback(gameDataInfo)
        })
    })
}


export const saveRaceDataGame = (playerId: string, gameInfo: IEndOfRaceInfoGame,) => {
    const updates = {}
    updates[usersRefPath + "/" + playerId + "/" + userGamesRefPath + "/" + gameInfo.gameId + "/" + userGameGameInfoPath] = gameInfo
    update(ref(database), updates).catch((err) => {
        console.warn("error saving game data", err)
        toast.error("Error saving game data")
    })
}

/**
 * Save data about game that is started
 * So we can keep track of games started and not finished
 * @param gameInfo 
 */
export const saveRoom = (roomId: string, roomInfo: IRoomInfo) => {
    const updates = {}
    const roomKey = uuid()
    updates[roomDataRefPath + "/" + roomKey] = roomInfo
    update(ref(database), updates).catch((err) => {
        console.log("error saving room data", err)
    })
}

export const saveGameFinished = (gameInfo: IEndOfRaceInfoGame) => {

    const newGameKey = gameInfo.gameId
    const updates = {}
    updates[gameDataRefPath + "/" + newGameKey] = gameInfo
    update(ref(database), updates).catch((err) => {
        console.log("error saving game data", err)
        toast.error("Error saving game data")
    })
}

/**
 * 
 * @param trackName :TrackName
 * @param numberOfLaps key
 * @param nFastest : top n fastest, if n < 1 then will get all 
 * @param callback : to return the thing
 */
const getAllTimeBestScoresOnTrackAndLap = (trackName: TrackName, numberOfLaps: number, nFastest: number, callback: (scores: IEndOfRaceInfoPlayer[]) => void) => {

    let bestScoreRef: Query
    if (nFastest > 1) {
        bestScoreRef = query(ref(database, uniqueHighscoresRefPath + "/" + trackName + "/" + numberOfLaps), orderByChild("totalTime"), limitToLast(nFastest))
    } else {
        bestScoreRef = query(ref(database, uniqueHighscoresRefPath + "/" + trackName + "/" + numberOfLaps), orderByChild("totalTime"))
    }


    onValue(bestScoreRef, (snap) => {
        if (snap.exists()) {
            const bestScores = []
            console.log("All time best")
            snap.forEach(child => {
                console.log("ordred", child.val())
                bestScores.push(child.val())
            })
            // const userIds = Object.keys(snap.val())
            // for (let uk of userIds) {
            //     bestScores.push(snap.val()[uk])
            // }

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

export const getPlayerBestScoreOnTrackAndLap = (userId: string, trackName: TrackName, numberOfLaps: number, callback: (oldPersonalBest: IBestTime) => void) => {
    const playerBestScoreRef = ref(database, uniqueHighscoresRefPath + "/" + trackName + "/" + numberOfLaps + "/" + userId)

    onValue(playerBestScoreRef, (snap) => {
        if (snap.exists()) {
            const d = snap.val() as IEndOfRaceInfoPlayer
            callback({ playerId: d.playerId, totalTime: d.totalTime })
        } else {
            callback({ playerId: userId, totalTime: undefined })
        }
    }, { onlyOnce: true })
}

const getPlayersBestScoreOnTrackAndLap = (userIds: string[], trackName: TrackName, numberOfLaps: number, callback: (oldPersonalBests: IBestTimeD) => void) => {

    let personalBests: { [userId: string]: IBestTime } = {}
    // index is to index the userId
    // Using this recursion to do it async
    const getItem = (index: number) => {
        // const playerBestScoreRef = ref(database, uniqueHighscoresRefPath + "/" + trackName + "/" + numberOfLaps + "/" + userIds[index])
        getPlayerBestScoreOnTrackAndLap(userIds[index], trackName, numberOfLaps, (oldPersonalBest) => {
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
export type HighscoreDict = { [trackKey: string]: { [numberOfLapsKey: number]: IEndOfRaceInfoPlayer[] } }



export type UniqueHighscoreDict = { [trackName: string]: { [numberOfLaps: number]: { [userId: string]: IEndOfRaceInfoPlayer } } }
export const getUniqueHighscore = (callback: (highscoreDict: UniqueHighscoreDict) => void) => {

    /** limit to last first? */
    /** cannot get the order to work */
    const allHighscoreRef = ref(database, uniqueHighscoresRefPath)
    // const allHighscoreRef = ref(database, uniqueHighscoresRefPath)


    onValue(allHighscoreRef, (snap) => {
        let uniqueHighscores: UniqueHighscoreDict = {}
        if (snap.exists()) {
            const scores = snap.val() as UniqueHighscoreDict

            uniqueHighscores = snap.val()
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
            /** TODO there is some fail here
             * I think it has to do with how I save the data
             */
            console.log("data", data)
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