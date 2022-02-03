import { collection, deleteDoc, doc, endBefore, getDocs, limit, limitToLast, onSnapshot, orderBy, query, setDoc, startAfter, startAt, where } from "@firebase/firestore"
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer } from "../classes/Game"
import { IFlattendBracketNode } from "../classes/Tournament"
import { TrackName } from "../shared-backend/shared-stuff"
import { firestore } from "./firebaseInit"
import { saveTournamentRaceDataPlayer, saveTournamentRaceGame, TournamentFinishedResponse } from "./firestoreTournamentFunctions"


const highscoresRefPath = "highscores"
const bestHighscoresRefPath = "bestHighscores"
const allHighscoresRefPath = "allHighscores"
const allGamesRefPath = "allGames"


interface IBestTime {
    playerId: string
    totalTime: number | undefined
    recordingFilename?: string
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

/**
 * 
 * @param playerId 
 * @param data to save
 * @returns a Promise: with a [boolean, string[]]
 *      if boolean is true then the player set a PB
 *      A list of strings which contains info about the run.
 */
export const saveBestRaceData = async (playerId: string, data: IEndOfRaceInfoPlayer): Promise<[boolean, string[]]> => {
    return new Promise<[boolean, string[]]>((resolve, reject) => {

        let setPersonalBest = false
        const gameDataInfo: string[] = []
        getPlayerBestScoreOnTrackAndLap(playerId, data.trackName, data.numberOfLaps, (pb) => {
            const highscoresRef = doc(firestore, bestHighscoresRefPath, `${playerId}#${data.trackName}#${data.numberOfLaps}`)

            const overwriteData = () => {
                setDoc(highscoresRef, data).then(() => {
                }).catch(e => {
                    console.warn("Error saving best score", e)
                    reject()
                })

            }

            if (data.totalTime < pb?.totalTime) {
                setPersonalBest = true
                overwriteData()
                gameDataInfo.push(
                    `${data.playerName} set a personal best time.`
                )

            } else if (pb?.totalTime) {
                gameDataInfo.push(`${data.playerName} was ${(data.totalTime - pb.totalTime).toFixed(2)} sec from setting a PB.`)
            } else {
                overwriteData()
                setPersonalBest = true
                gameDataInfo.push(`${data.playerName} raced this track and number-of-laps combination for the first time.`)
            }
            resolve([setPersonalBest, gameDataInfo])
        })
    })
}


const getAllHighscoreKey = (playerId: string, gameId: string) => `${playerId}#${gameId}`

/**
 * 
 * @param playerId 
 * @param data to save
 * @returns a Promise: with a [boolean, string[]]
 *      if boolean is true then the player set a PB
 *      A list of strings which contains info about the run.
 */
export const saveRaceData = async (playerId: string, data: IEndOfRaceInfoPlayer): Promise<[boolean, string[]]> => {


    return new Promise<[boolean, string[]]>(async (resolve, reject) => {

        saveTournamentRaceDataPlayer(data)

        let gameDataInfo: string[] = []
        // const highscoresRef = doc(firestore, highscoresRefPath, playerId, allHighscoresRefPath, data.gameId)
        // const highscoresRef = doc(firestore, highscoresRefPath, allHighscoresRefPath, playerId, data.gameId)
        const highscoresRef = doc(firestore, allHighscoresRefPath, getAllHighscoreKey(playerId, data.gameId))

        setDoc(highscoresRef, data).then(() => {

        }).catch(e => {
            console.warn("error saving race", e)
        })

        const bestScores = await getBestScoresOnTrackAndLap(data.trackName, data.numberOfLaps, 0, 3)

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
        saveBestRaceData(playerId, data).then(([setPersonalBest, _gameInfo]) => {
            gameDataInfo = gameDataInfo.concat(_gameInfo)
            console.log("Set personal best", setPersonalBest)
            resolve([setPersonalBest, gameDataInfo])
        }).catch((err) => {
            console.warn("Error saving data", err)
            reject()
        })
    })

}

/**
* unique to each player
* stored on highscores/userId/bestHighscoresRefPath
*/
// export const getBestScoresOnTrackAndLap = async (trackName: TrackName, numberOfLaps: number, limitToN: number | undefined): Promise<IBestTime[] | undefined> => {
//     return new Promise<IBestTime[] | undefined>(async (resolve, reject) => {

//         const highscoresRef = collection(firestore, bestHighscoresRefPath)
//         let q = query(highscoresRef, where("trackName", "==", trackName), where("numberOfLaps", "==", numberOfLaps), orderBy("totalTime", "asc"))
//         if (limitToN) {
//             q = query(q, limit(limitToN))
//         }
//         const data = await getDocs(q)

//         if (data.empty) {

//             resolve(undefined)
//         } else {
//             const arr: IBestTime[] = []
//             data.forEach(doc => {
//                 const item = doc.data() as IEndOfRaceInfoPlayer
//                 arr.push({
//                     playerId: item.playerId,
//                     totalTime: item.totalTime,
//                     recordingFilename: item.recordingFilename
//                 })
//             })
//             resolve(arr)
//         }
//     })
// }

export const saveRaceDataGame = async (gameInfo: IEndOfRaceInfoGame, callback: (res: TournamentFinishedResponse) => void, activeBracketNode?: IFlattendBracketNode) => {

    saveTournamentRaceGame(gameInfo, activeBracketNode, callback)

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

export type BestTrackScore = IEndOfRaceInfoPlayer[]

export const getBestScoresOnTrackAndLap = async (trackName: string, numberOfLaps: number, startNumber: number, numberOfItems: number): Promise<IEndOfRaceInfoPlayer[]> => {
    return new Promise<IEndOfRaceInfoPlayer[]>(async (resolve, reject) => {
        const bestScoreRef = collection(firestore, bestHighscoresRefPath)
        // TODO maybe have list of vehicles that are in a different highscore list
        const q = query(bestScoreRef, orderBy("vehicleType", "asc"), where("vehicleType", "!=", "simpleSphere"), where("trackName", "==", trackName), where("numberOfLaps", "==", numberOfLaps), orderBy("totalTime", "asc"), startAt(startNumber), limit(numberOfItems))

        const arr = []

        const data = await getDocs(q)
        data.forEach(doc => {
            const val = doc.data() as IEndOfRaceInfoPlayer
            arr.push(val)

        })
        console.log("arr", arr)
        resolve(arr)
    })
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

// export const moveHighscores = () => {
//     const ref = collection(firestore, bestHighscoresRefPath)

//     const scores = {}

//     getDocs(ref).then(docs => {
//         docs.forEach(d => {
//             scores[d.id] = d.data()
//             const newRef = doc(firestore, bestHighscoresRefPath + "19012021", d.id)
//             setDoc(newRef, d.data())
//         })
//         console.log("moved", Object.keys(scores).length)
//     })
// }

export const deleteBestScore = (playerId: string, trackName: TrackName, numberOfLaps: number) => {
    console.log("`${playerId}#${trackName}#${numberOfLaps}`", `${playerId}#${trackName}#${numberOfLaps}`)
    return new Promise<void>((resolve, reject) => {

        const gameRef = doc(firestore, bestHighscoresRefPath, `${playerId}#${trackName}#${numberOfLaps}`)

        deleteDoc(gameRef).then(() => {
            resolve()
        }).catch(e => {
            console.warn("Error deleting game", e)
            reject
        })
    })
}