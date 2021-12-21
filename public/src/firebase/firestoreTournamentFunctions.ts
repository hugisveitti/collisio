import { arrayUnion, collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, Timestamp, updateDoc, where, writeBatch } from "@firebase/firestore";
import { Unsubscribe, User } from "firebase/auth";
import { IEndOfRaceInfoPlayer } from "../classes/Game";
import { GlobalTournament, ISingleRaceData, ITournament, ITournamentUser, LocalTournament, Tournament } from "../classes/Tournament";
import { IUser } from "../classes/User";
import { firestore } from "./firebaseInit";
import { getUserFollowings } from "./firestoreFunctions"

const tournamentPath = "tournaments"
const tournamentPlayersPath = "players"


export const setTournament = async (tournament: ITournament): Promise<void> => {
    const p = new Promise<void>(async (resolve, reject) => {
        console.log("tournament to add", tournament)

        try {
            await setDoc(doc(firestore, tournamentPath, tournament.id), tournament)
            resolve()
        } catch (e) {
            console.warn("Error creating tournament:", e)
            reject()
        }
    })
    return p
}

export const deleteTournament = (tournamentId: string): Promise<void> => {
    const p = new Promise<void>(async (resolve, reject) => {
        try {
            await deleteDoc(doc(firestore, tournamentPath, tournamentId))
            resolve()
        } catch (e) {
            console.warn("Error creating tournament:", e)
            reject()
        }
    })
    return p
}

// remove subsctibe
export const createGetTournametListener = (tournamentId: string, callback: (t: ITournament | undefined) => void): Unsubscribe => {

    const d = doc(firestore, tournamentPath, tournamentId)
    let unsub: Unsubscribe
    try {

        unsub = onSnapshot(d, (qSnap) => {
            if (qSnap.exists()) {
                const tournament = qSnap.data() as ITournament
                if (tournament?.tournamentType === "global") {
                    const gTournament = (tournament as GlobalTournament);
                    // @ts-ignore
                    if (gTournament.tournamentStart?.seconds) {

                        gTournament.tournamentStart = (gTournament.tournamentStart as unknown as Timestamp)?.toDate();
                    }

                    // @ts-ignore
                    if (gTournament.tournamentEnd?.seconds) {
                        gTournament.tournamentEnd = (gTournament.tournamentEnd as unknown as Timestamp)?.toDate();

                    }
                    callback(gTournament)
                } else {

                    callback(qSnap.data() as ITournament)
                }
            } else {
                callback(undefined)
            }
        }, (err) => {
            console.warn("Error getting tournament:", err)
        })
    } catch (err) {
        console.warn("error getting tournament listener", err)
    }
    return unsub
}

export const joinTournament = (user: IUser, tournamentId: string): Promise<void> => {
    const promise = new Promise<void>(async (resolve, reject) => {
        const d = doc(firestore, tournamentPath, tournamentId, tournamentPlayersPath, user.uid)
        try {
            const tournamentUser: ITournamentUser = {
                ...user,
                ranking: -1
            }
            await setDoc(d, tournamentUser)
            console.log("joined tournament")
            resolve()
        } catch (e) {
            console.log("Error joining tournament:", e)
            reject()
        }
    })
    return promise
}

export const leaveTournament = (user: IUser, tournamentId: string): Promise<void> => {
    const promise = new Promise<void>(async (resolve, reject) => {
        const d = doc(firestore, tournamentPath, tournamentId, tournamentPlayersPath, user.uid)
        try {
            await deleteDoc(d)
            resolve()
        } catch (e) {
            console.log("Error joining tournament:", e)
            reject()
        }
    })
    return promise
}

export const getPlayersInTournamentListener = (tournamentId: string, callback: (players: ITournamentUser[]) => void): Unsubscribe => {
    const d = collection(firestore, tournamentPath, tournamentId, tournamentPlayersPath)
    let unsub: Unsubscribe

    try {

        unsub = onSnapshot(d, (qSnap) => {
            if (qSnap.empty) {

                callback([])

            } else {
                const players: ITournamentUser[] = []
                qSnap.forEach(u => {
                    players.push(u.data() as ITournamentUser)
                })

                callback(players)

            }
        }, (err) => {
            console.warn("Error getting players in tournement:", err)
            callback([])
        })
    } catch (e) {
        console.warn("Error getting players in tournament:", e)
    }

    return unsub
}

export const updatePlayersInTournament = (tournamentId: string, players: ITournamentUser[]) => {
    const _players: { [userId: string]: ITournamentUser } = {}
    for (let player of players) {
        _players[player.uid] = player
    }

    const batch = writeBatch(firestore)
    players.forEach(player => {
        const ref = doc(firestore, tournamentPath, tournamentId, tournamentPlayersPath, player.uid)
        batch.set(ref, player)
    })

    batch.commit().then(() => {
        console.log("successfully commited players batch")
    }).catch((err) => {
        console.warn("Error updating players:", err)
    })
}

export const getAvailableTournamentsListener = async (userId: string, callback: (tournaments: ITournament[]) => void) => {

    const followings = await getUserFollowings(userId, (followings) => { })
    let fIds = followings.map(f => f.uid)
    fIds = fIds.concat(userId)

    console.warn("fids length needs a fix getAvailableTournamentsListener")
    if (fIds.length > 10) {
        fIds = fIds.slice(fIds.length - 10, fIds.length)
    }

    const q = query(collection(firestore, tournamentPath), where("leaderId", "in", fIds), where("hasStarted", "==", false), where("isFinished", "==", false))
    const unsub = onSnapshot(q, (qSnap) => {
        const tournaments: ITournament[] = []
        qSnap.forEach(doc => {
            tournaments.push(doc.data() as ITournament)
        })
        callback(tournaments)
    }, (err) => {
        console.warn("Error getting available tournaments:", err)
    })

    return (unsub)
}

export const getAvailableTournaments = async (userId: string): Promise<ITournament[]> => {
    return new Promise(async (resolve, reject) => {
        const followings = await getUserFollowings(userId, (followings) => { })
        let fIds = followings.map(f => f.uid)
        fIds = fIds.concat(userId)

        const collectionPath = collection(firestore, tournamentPath)

        let batches = []
        try {

            while (fIds.length) {
                const batch = fIds.splice(0, 10)

                batches.push(new Promise(async (res) => {

                    const docs = await getDocs(query(collectionPath, where("leaderId", "in", batch), where("hasStarted", "==", false), where("isFinished", "==", false)))
                    const rooms = []
                    docs.forEach(d => rooms.push(d.data()))
                    res(rooms)
                }
                ))
            }


            Promise.all(batches).then(content => {

                resolve(content.flat())
            })
        } catch (err) {
            console.warn("Error getting rooms:", err)
        }
    })
}

export const getActiveTournaments = async (userId: string): Promise<ITournament[]> => {
    return new Promise<ITournament[]>(async (resolve, reject) => {


        console.log("userId", userId)
        const q = query(collection(firestore, tournamentPath), where("playersIds", "array-contains", userId), where("isFinished", "==", false), where("hasStarted", "==", true))

        try {
            const docs = await getDocs(q)


            const tournaments: ITournament[] = []
            docs.forEach(doc => {
                tournaments.push(doc.data() as ITournament)
            })
            resolve(tournaments)
        } catch (err) {
            reject()
            console.warn("Error getting active tournaments:", err)
        }
    })
}

export const getAllUserTournaments = async (userId: string): Promise<Tournament[]> => {
    const p = new Promise<Tournament[]>(async (resolve, reject) => {
        const q = query(collection(firestore, tournamentPath), where(userId, "==", "leaderId"))
        try {

            const docs = await getDocs(q)
            const tournaments: ITournament[] = []
            docs.forEach(doc => {
                tournaments.push(doc.data() as ITournament)
            })
            resolve(tournaments)
        } catch (err) {
            console.warn("Error getting all user tournaments")
            reject()
        }
    })

    return p
}


export const saveTournamentRaceData = async (data: IEndOfRaceInfoPlayer) => {
    console.log("saving to tournament")
    if (data.tournamentId && data.isAuthenticated) {
        const ref = doc(firestore, tournamentPath, data.tournamentId, tournamentPlayersPath, data.playerId)

        const singleRace: ISingleRaceData = {
            vehicleType: data.vehicleType,
            totalTime: data.totalTime,
            lapTimes: data.lapTimes,
        }

        try {
            await updateDoc(ref, {
                raceData: arrayUnion(singleRace)
            })
        } catch (err) {
            console.warn("Error adding values to tournament:", err)
        }

    } else {
        console.log("No tournament id and not saving tournament")
    }
}