import { getBlob, ref, uploadBytes } from "@firebase/storage"
import { TrackName } from "../shared-backend/shared-stuff"
import { storage } from "./firebaseInit"
import { getBestScoresOnTrackAndLap } from "./firestoreGameFunctions"
import { getTorunamentBestTime, setTorunamentBestTime } from "./firestoreTournamentFunctions"

const ghostRef = "ghost"
const tournamentRef = "tournament"

export const uploadGhost = (filename: string, ghostRecording: string[]) => {
    const storageRef = ref(storage, ghostRef + "/" + filename)
    const blob = new Blob([ghostRecording.join("\n")], { type: "text/plain" })

    uploadBytes(storageRef, blob).then((snap) => {
        console.log("Uploaded ghost:", filename)
    }).catch(err => {
        console.warn("Error uploading ghost:", err)
    })
}

export const uploadTournamentGhost = (tournamentId: string, ghostRecording: string[], totalTime: number) => {

    getTorunamentBestTime(tournamentId).then(bestTime => {
        if (!bestTime || totalTime < bestTime) {
            uploadGhost(tournamentRef + "/" + tournamentId, ghostRecording)
            setTorunamentBestTime(tournamentId, totalTime)
        }
        console.log(" the best time:", bestTime, "total time:", totalTime)
    }).catch((err) => {
        console.warn("Error getting best time:", err)
    })
}

export const downloadGhost = (filename: string) => {
    return new Promise<string[] | undefined>((resolve, reject) => {

        const storageRef = ref(storage, ghostRef + "/" + filename)
        console.log("downloading ghost", filename)
        getBlob(storageRef).then(async (resBlob) => {
            console.log("Got ghost", resBlob)
            const text = await (new Response(resBlob)).text()
            resolve(text.split("\n"))
        }).catch((err) => {
            console.warn("Error getting ghost:", err)
            switch (err.code) {
                case 'storage/object-not-found':
                    // File doesn't exist
                    reject("Ghost does not exist.")
                    break;
                case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    reject("Unauthorized")
                    break;
                case 'storage/canceled':
                    // User canceled the upload
                    reject("Rejected")
                    break;

                case 'storage/unknown':
                    // Unknown error occurred, inspect the server response
                    reject()
                    break;
                default:
                    reject()
            }
        })
    })
}

export const getTournamentGhost = async (tournamentId: string) => {
    return new Promise<string[] | undefined>(async (resolve, reject) => {
        downloadGhost(tournamentRef + "/" + tournamentId).then(instructions => {
            console.log("instructions", instructions)
            resolve(instructions)
        }).catch(err => {
            console.warn("error getting tournament ghost", err)
            reject(err)
        })
    })
}

/**
 * 
 * @param trackName 
 * @param numberOfLaps 
 * @returns we only look in the top 3 for the ghost recording
 */
export const getFastestGhostFilename = (trackName: TrackName, numberOfLaps: number): Promise<string | undefined> => {
    return new Promise<string | undefined>(async (resolve, reject) => {
        const bestScores = await getBestScoresOnTrackAndLap(trackName, numberOfLaps, 3)
        console.log("best scores", bestScores)
        if (!bestScores) {
            resolve(undefined)
            return
        }
        for (let score of bestScores) {
            if (score.recordingFilename) {
                resolve(score.recordingFilename)
                return
            }
        }
        resolve(undefined)
    })
}