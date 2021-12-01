import { collection, doc, orderBy, query, getDoc, limit, where, getDocs, updateDoc, arrayUnion, setDoc, onSnapshot, deleteDoc } from "@firebase/firestore"

import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IPlayerGameInfo, IRoomInfo } from "../classes/Game"
import { TrackName } from "../shared-backend/shared-stuff"
import { firestore } from "./firebaseInit"

const highscoresRefPath = "highscores"
const bestHighscoresRefPath = "bestHighscores"
const allHighscoresRefPath = "allHighscores"
const allGamesRefPath = "allGames"


interface IBestTime {
    playerId: string
    totalTime: number | undefined
}

type IBestTimeD = { [userId: string]: IBestTime }




export const getPlayerBestScoreOnTrackAndLap = async (playerId: string, trackName: TrackName, numberOfLaps: number, callback: (pb: IBestTime | undefined) => void) => {

    //  const highscoresRef = collection(firestore, highscoresRefPath, playerId, bestHighscoresRefPath)
    const highscoresRef = collection(firestore, bestHighscoresRefPath)
    const q = query(highscoresRef, where("playerId", "==", playerId), where("trackName", "==", trackName), where("numberOfLaps", "==", numberOfLaps), orderBy("totalTime", "desc"), limit(1))
    const data = await getDocs(q)

    if (data.empty) {

        callback(undefined)
    } else {

        data.forEach(doc => {
            if (doc.exists()) {
                callback(doc.data() as IBestTime)
            } else {
                callback(undefined)
            }
        })

    }
}

export const saveBestRaceData = async (playerId: string, data: IEndOfRaceInfoPlayer, callback: (_gameDataInfo: string[]) => void) => {

    const gameDataInfo: string[] = []
    getPlayerBestScoreOnTrackAndLap(playerId, data.trackName, data.numberOfLaps, (pb) => {
        const highscoresRef = doc(firestore, bestHighscoresRefPath, `${playerId}#${data.trackName}#${data.numberOfLaps}`)

        const overwriteData = () => {

            setDoc(highscoresRef, data).then(() => {

            }).catch(e => {
                console.warn("Error saving best score", e)
            })

        }

        if (data.totalTime < pb?.totalTime) {

            overwriteData()
            gameDataInfo.push(
                `${data.playerName} set a personal best time.`
            )

        } else if (pb?.totalTime) {

            gameDataInfo.push(`${data.playerName} was ${(data.totalTime - pb.totalTime).toFixed(2)} sec from setting a PB.`)
        } else {
            overwriteData()

            gameDataInfo.push(`${data.playerName} raced this track and number-of-laps combination for the first time.`)
        }
        callback(gameDataInfo)
    })
}

const getAllHighscoreKey = (playerId: string, gameId: string) => `${playerId}#${gameId}`

export const saveRaceData = async (playerId: string, data: IEndOfRaceInfoPlayer, callback: (gameDataInfo: string[]) => void) => {


    let gameDataInfo: string[] = []
    // const highscoresRef = doc(firestore, highscoresRefPath, playerId, allHighscoresRefPath, data.gameId)
    // const highscoresRef = doc(firestore, highscoresRefPath, allHighscoresRefPath, playerId, data.gameId)
    const highscoresRef = doc(firestore, allHighscoresRefPath, getAllHighscoreKey(playerId, data.gameId))

    setDoc(highscoresRef, data).then(() => {

    }).catch(e => {
        console.warn("error saving race", e)
    })

    getBestScoresOnTrackAndLap(data.trackName, data.numberOfLaps, 3, (bestScores) => {

        if (bestScores && bestScores.length > 0) {
            let place = -1
            for (let i = 0; i < bestScores.length; i++) {
                if (data.totalTime < bestScores[i].totalTime) {
                    place = i + 1

                    break
                }
            }
            if (place !== -1) {
                gameDataInfo.push(`${data.playerName}'s time was number ${place} of all time`)
            }
            gameDataInfo.push(
                `${data.playerName}'s time was ${(data.totalTime - bestScores[0].totalTime).toFixed(2)} sec from the all time best record.`
            )
        } else {
            gameDataInfo.push(`${data.playerName} set a all time best record!`)
        }
        saveBestRaceData(playerId, data, (_gameInfo) => {
            gameDataInfo = gameDataInfo.concat(_gameInfo)
            callback(gameDataInfo)

        })
    })
}

/**
 * unique to each player
 * stored on highscores/userId/bestHighscoresRefPath
 */
export const getBestScoresOnTrackAndLap = async (trackName: TrackName, numberOfLaps: number, limitToN: number | undefined, callback: (data: IBestTime[] | undefined) => void) => {
    const highscoresRef = collection(firestore, bestHighscoresRefPath)
    let q = query(highscoresRef, where("trackName", "==", trackName), where("numberOfLaps", "==", numberOfLaps), orderBy("totalTime", "asc"))
    if (limitToN) {
        q = query(q, limit(limitToN))
    }
    const data = await getDocs(q)

    if (data.empty) {

        callback(undefined)
    } else {
        const arr: IBestTime[] = []
        data.forEach(doc => {
            const item = doc.data() as IEndOfRaceInfoPlayer
            arr.push({
                playerId: item.playerId,
                totalTime: item.totalTime
            })
        })
        callback(arr)
    }
}

export const saveRaceDataGame = async (gameInfo: IEndOfRaceInfoGame) => {
    const gameRef = doc(firestore, allGamesRefPath, gameInfo.gameId)
    try {
        await setDoc(gameRef, gameInfo)
    } catch (e) {
        console.warn("Error saving race:", e)
    }
}

export const getPlayerBestScores = async (playerId: string, callback: (data: IEndOfRaceInfoPlayer[] | undefined) => void) => {
    const bestScoreRef = collection(firestore, bestHighscoresRefPath)
    const q = query(bestScoreRef, where("playerId", "==", playerId))

    const data = await getDocs(q)

    if (data.empty) {
        callback(undefined)
    } else {
        const arr = []
        data.forEach(doc => {
            arr.push(doc.data())
        })
        callback(arr)
    }
}

export type BestTrackScore = {
    [numberOfLaps: number]: IEndOfRaceInfoPlayer[]
}
export const getBestScoresOnTrack = async (trackName: string, callback: (data: BestTrackScore) => void) => {
    const bestScoreRef = collection(firestore, bestHighscoresRefPath)
    const q = query(bestScoreRef, where("trackName", "==", trackName), orderBy("totalTime", "asc"))

    const dict = {}
    const data = await getDocs(q)
    data.forEach(doc => {
        const val = doc.data() as IEndOfRaceInfoPlayer
        if (!(val.numberOfLaps in dict)) {
            dict[val.numberOfLaps] = []
        }
        dict[val.numberOfLaps].push(val)
    })
    callback(dict)
}


export const getPlayerGameDataListener = (userId: string, callback: (games: IEndOfRaceInfoPlayer[]) => void) => {
    const gameRef = collection(firestore, allHighscoresRefPath)
    const q = query(gameRef, where("playerId", "==", userId))

    const unsub = onSnapshot(q,
        (qSnap) => {

            const games: IEndOfRaceInfoPlayer[] = []

            qSnap.forEach(doc => {
                games.push(doc.data() as IEndOfRaceInfoPlayer)
            })

            callback(games)
        })
    return unsub
}

export const deletePlayerGameData = (userId: string, gameId: string) => {
    const gameRef = doc(firestore, allHighscoresRefPath, getAllHighscoreKey(userId, gameId))

    deleteDoc(gameRef).then(() => {

    }).catch(e => {
        console.warn("Error deleting game", e)
    })
}