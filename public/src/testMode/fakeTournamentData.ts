import { createBracketTree, ITournamentUser, LocalTournament } from "../classes/Tournament";
import { setFirestorePrivateUser } from "../firebase/firestoreFunctions";
import { getTournamentWithId, joinTournament, setTournament } from "../firebase/firestoreTournamentFunctions";

const createTournamentUser = (name: string, id: string, ranking: number): ITournamentUser => {
    return {
        displayName: name,
        uid: id,
        photoURL: "",
        ranking,
        email: ""
    }
}

export const createFakeBrackets = () => {

    const players: ITournamentUser[] = []
    for (let i = 0; i < 7; i++) {
        players.push(createTournamentUser(`${i}player with the name ${i}`, `p${i}_id`, i))
    }

    const root = createBracketTree(players.length)

    root.populateTree(players)


    let game = root.findLatestUnplayedGame(players[players.length - 1].uid)
    if (game) {

        game.setWinner(2)
    }
    return root
}

export const addFakesToTournament = async (tournamentId: string, numberOfFakes: number) => {
    const players: ITournamentUser[] = []
    for (let i = 0; i < numberOfFakes; i++) {
        players.push(createTournamentUser(`${i}player with the name ${i}`, `p${i}_id`, i))
    }

    const batch = []
    for (let p of players) {
        batch.push(setFirestorePrivateUser({
            ...p,
            latestLogin: -1
        }))
    }

    await Promise.all(batch)

    for (let p of players) {
        joinTournament(p, tournamentId).then(() => {
        })
    }

    const tournament = await getTournamentWithId(tournamentId) as LocalTournament
    const root = createBracketTree(players.length)
    root.populateTree(players)
    tournament.hasStarted = true
    tournament.flattenBracket = root.flatten()

    setTournament(tournament)
}

