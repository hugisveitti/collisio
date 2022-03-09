import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, startAt, where } from "@firebase/firestore"
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer } from "../classes/Game"
import { IFlattendBracketNode } from "../classes/Tournament"
import { TrackName, VehicleType } from "../shared-backend/shared-stuff"
import { itemInArray } from "../utils/utilFunctions"
import { firestore } from "./firebaseInit"
import { saveTournamentRaceDataPlayer, saveTournamentRaceGame, TournamentFinishedResponse } from "./firestoreTournamentFunctions"



const bestHighscoresRefPath = "bestHighscores"
const singleplayerBestHighscoresRefPath = "singleplayerBestHighscores"
// for special vehicles such as simple sphere
const bestSpecialHighscoresRefPath = "bestSpecialHighscores"
const singleplayerBestSpecialHighscoresRefPath = "singleplayerBestSpecialHighscores"

const allHighscoresRefPath = "allHighscores"
const allGamesRefPath = "allGames"
const singleplayerAllHighscoresRefPath = "singleplayerAllHighscores"
const singleplayerAllGamesRefPath = "singleplayerAllGames"


export interface IBestTime {
    playerId: string
    bestTime?: number
    recordingFilename?: string
}


export const getPlayerBestScoreOnTrackAndLap = (playerId: string, trackName: TrackName, numberOfLaps: number, specialVehicle: boolean): Promise<IBestTime | undefined> => {
    return new Promise<IBestTime | undefined>(async (resolve, reject) => {
        const highscoreRef = specialVehicle ? bestSpecialHighscoresRefPath : bestHighscoresRefPath

        const highscoresRef = collection(firestore, highscoreRef)
        const q = query(highscoresRef, where("playerId", "==", playerId), where("trackName", "==", trackName), where("numberOfLaps", "==", numberOfLaps), orderBy("totalTime", "desc"), limit(1))
        const data = await getDocs(q)

        if (data.empty) {
            resolve({
                playerId,
            })
        } else {
            data.forEach(doc => {
                if (doc.exists()) {
                    const res = doc.data() as IEndOfRaceInfoPlayer
                    resolve({
                        playerId: res.playerId,
                        bestTime: res.totalTime,
                        recordingFilename: res.recordingFilename
                    })
                } else {
                    resolve({
                        playerId,
                    })
                }
            })
        }
    })
}

const specialVehicleTypes: VehicleType[] = ["simpleCylindar", "simpleSphere"]

/**
 * 
 * @param playerId 
 * @param data to save
 * @returns a Promise: with a [boolean, string[]]
 *      if boolean is true then the player set a PB
 *      A list of strings which contains info about the run.
 */
export const saveBestRaceData = async (playerId: string, data: IEndOfRaceInfoPlayer): Promise<[boolean, IBestTime]> => {
    return new Promise<[boolean, IBestTime]>((resolve, reject) => {

        let setPersonalBest = false
        //  const gameDataInfo: string[] = []
        const specialVehicle = itemInArray(data.vehicleType, specialVehicleTypes)
        let highscoreRef = specialVehicle ? bestSpecialHighscoresRefPath : bestHighscoresRefPath
        if (data.singleplayer) {
            highscoreRef = specialVehicle ? singleplayerBestSpecialHighscoresRefPath : singleplayerBestHighscoresRefPath
        }
        getPlayerBestScoreOnTrackAndLap(playerId, data.trackName, data.numberOfLaps, specialVehicle).then((pb) => {

            const highscoresRef = doc(firestore, highscoreRef, `${playerId}#${data.trackName}#${data.numberOfLaps}`)

            const overwriteData = () => {
                setDoc(highscoresRef, data).then(() => {
                }).catch(e => {
                    console.warn("Error saving best score", e)
                    reject()
                })
            }

            if (data.totalTime < pb?.bestTime) {
                setPersonalBest = true
                overwriteData()
                // gameDataInfo.push(
                //     `${data.playerName} set a personal best time.`
                // )

            } else if (pb?.bestTime) {
                //    gameDataInfo.push(`${data.playerName} was ${(data.totalTime - pb.bestTime).toFixed(2)} sec from setting a PB.`)
            } else {
                overwriteData()
                setPersonalBest = true
                //   gameDataInfo.push(`${data.playerName} raced this track and number-of-laps combination for the first time.`)
            }
            resolve([setPersonalBest, pb])
        })
    })
}

export const getPersonalBestInfo = (pb: IBestTime, data: { playerName: string, totalTime: number }) => {
    const gameDataInfo = []

    if (data.totalTime < pb?.bestTime) {

        gameDataInfo.push(
            `Set a personal best time.`
        )

    } else if (pb?.bestTime) {
        gameDataInfo.push(`Was ${(data.totalTime - pb.bestTime).toFixed(2)} sec from setting a PB.`)
    } else {
        gameDataInfo.push(`Raced this track and number-of-laps combination for the first time.`)
    }
    return gameDataInfo
}


const getAllHighscoreKey = (playerId: string, gameId: string) => `${playerId}#${gameId}`

// interface IGameDataInfo {
//     [playerId: string]: IPlayerGameDataInfo
// }

/**
 * 
 * @param playerId 
 * @param data to save
 * @returns a Promise: with a [boolean, string[]]
 *      if boolean is true then the player set a PB
 *      A list of strings which contains info about the run.
 */
export const saveRaceData = async (playerId: string, data: IEndOfRaceInfoPlayer): Promise<[boolean, IBestTime]> => {


    return new Promise<[boolean, IBestTime]>(async (resolve, reject) => {

        saveTournamentRaceDataPlayer(data)

        //  let gameDataInfo: IGameDataInfo = {}
        // const highscoresRef = doc(firestore, highscoresRefPath, playerId, allHighscoresRefPath, data.gameId)
        // const highscoresRef = doc(firestore, highscoresRefPath, allHighscoresRefPath, playerId, data.gameId)

        const path = data.singleplayer ? singleplayerAllHighscoresRefPath : allHighscoresRefPath
        const highscoresRef = doc(firestore, path, getAllHighscoreKey(playerId, data.gameId))

        setDoc(highscoresRef, data).then(() => {

        }).catch(e => {
            console.warn("error saving saveRaceData", e)
        })
        saveBestRaceData(playerId, data).then(([setPersonalBest, _gameInfo]) => {
            resolve([setPersonalBest, _gameInfo])
        }).catch((err) => {
            console.warn("Error saving data", err)
            reject()
        })
    })
}

export const getScoreInfo = (bestScores: IEndOfRaceInfoPlayer[], data: { playerName: string, totalTime: number }): string[] => {
    let gameDataInfo = []
    if (bestScores && bestScores.length > 0) {
        let place = -1
        for (let i = 0; i < bestScores.length; i++) {
            if (data.totalTime < bestScores[i].totalTime) {
                place = i + 1
                break
            }
        }
        if (place !== -1) {
            gameDataInfo.push(`Number ${place} of all time.`)
        }
        gameDataInfo.push(
            `${(data.totalTime - bestScores[0].totalTime).toFixed(2)} sec from the all time best record.`
        )
    } else {
        gameDataInfo.push(`Set a all time best record!`)
    }
    return gameDataInfo
}

/**
 * 
 * @param gameInfo 
 * @param callback Callback will included info to be shown on the endOfRaceModal
 * @param activeBracketNode 
 */
export const saveRaceDataGame = async (gameInfo: IEndOfRaceInfoGame, callback: (res: TournamentFinishedResponse) => void, activeBracketNode?: IFlattendBracketNode) => {

    saveTournamentRaceGame(gameInfo, activeBracketNode, callback)

    const path = gameInfo.singleplayer ? singleplayerAllGamesRefPath : allGamesRefPath
    const gameRef = doc(firestore, path, gameInfo.gameId)
    try {
        await setDoc(gameRef, gameInfo)
    } catch (e) {
        console.warn("Error saving saveRaceDataGame:", e)
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

export const getBestScoresOnTrackAndLap = async (trackName: string, numberOfLaps: number, startNumber: number, numberOfItems: number, singleplayer: boolean): Promise<IEndOfRaceInfoPlayer[]> => {
    return new Promise<IEndOfRaceInfoPlayer[]>(async (resolve, reject) => {
        const path = singleplayer ? singleplayerBestHighscoresRefPath : bestHighscoresRefPath
        const bestScoreRef = collection(firestore, path)
        // TODO maybe have list of vehicles that are in a different highscore list
        const q = query(bestScoreRef, where("trackName", "==", trackName), where("numberOfLaps", "==", numberOfLaps), orderBy("totalTime", "asc"), startAt(startNumber), limit(numberOfItems))

        const arr = []

        const data = await getDocs(q)
        data.forEach(doc => {
            const val = doc.data() as IEndOfRaceInfoPlayer
            arr.push(val)

        })
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

export const deleteBestScore = (playerId: string, trackName: TrackName, numberOfLaps: number) => {
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