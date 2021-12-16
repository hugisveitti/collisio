import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, where, writeBatch } from "@firebase/firestore";
import { Unsubscribe, User } from "firebase/auth";
import { ITournament, ITournamentUser, LocalTournament, Tournament } from "../classes/Tournament";
import { IUser } from "../classes/User";
import { firestore } from "./firebaseInit";
import { getUserFollowings } from "./firestoreFunctions"

const tournamentPath = "tournaments"
const tournamentPlayersPath = "players"


export const addTournament = async (tournament: LocalTournament): Promise<void> => {
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
                callback(qSnap.data() as ITournament)
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

export const getActiveTournaments = async (userId: string, callback: (tournaments: ITournament[]) => void) => {
    // this where makes no sence
    const q = query(collection(firestore, tournamentPath), where(userId, "in", "players.uid"), where("isFinished", "==", false))

    const docs = await getDocs(q)


    const tournaments: ITournament[] = []
    docs.forEach(doc => {
        tournaments.push(doc.data() as ITournament)
    })
    callback(tournaments)
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