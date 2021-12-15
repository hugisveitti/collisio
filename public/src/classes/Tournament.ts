import { v4 as uuid } from "uuid";
import { IPreGamePlayerInfo, TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { shuffleArray } from "../utils/utilFunctions";

type TournamentType = "local" | "global"


interface ITournament {
    // store as key value pairs?
    players: IPreGamePlayerInfo[]
    tournamentType: TournamentType
    trackName: TrackName
    numberOfLaps: number
    /** if defined then everyone will have to use that vehicle */
    vehicleType: VehicleType | undefined
    /** id of leader */
    leader: string

    /** Name of tournament */
    name: string
}

class BracketGame {
    winnerBracket: BracketGame | undefined
    loserBracket: BracketGame | undefined
    player1Id: string
    player1Name: string
    player2Id: string
    player2Name: string
    /** 
     * if winner defined and brackets undefined then this is the final bracket 
     * 
    */
    winner: string | undefined
}

class Bracket {
    players: { [playerId: string]: BracketGame }
    preGamePlayers: IPreGamePlayerInfo[]
    constructor(preGamePlayers?: IPreGamePlayerInfo[]) {
        if (preGamePlayers) {

            shuffleArray(preGamePlayers)

            let hasOddplayers = preGamePlayers.length % 2 !== 0
            for (let i = 0; i < preGamePlayers.length; i += 2) {

            }
        }
    }

    setPlayers(preGamePlayers: IPreGamePlayerInfo[]) {
        this.preGamePlayers = preGamePlayers
    }

    shufflePlayers() {
        shuffleArray(this.preGamePlayers)
    }
}

interface ILocalTournament extends ITournament {
    bracket: Bracket
    useLowerbracket: boolean
    numberOfGamesInSeries: number
    name: string
    id: string
    useGroupStageToDetermineBracketPlacement: boolean
}

export class LocalTournament implements ILocalTournament {
    bracket: Bracket;
    useLowerbracket: boolean
    numberOfGamesInSeries: number
    vehicleType: VehicleType | undefined
    name: string
    id: string
    useGroupStageToDetermineBracketPlacement: boolean
    trackName: TrackName;
    players: IPreGamePlayerInfo[]
    tournamentType: TournamentType
    leader: string;
    numberOfLaps: number;


    constructor(leader: string) {
        this.tournamentType = "local"
        this.leader = leader
        this.players = []
        this.id = uuid()
        this.vehicleType = undefined
        this.trackName = "farm-track"
        this.numberOfGamesInSeries = 3
        this.name = ""
        this.bracket = new Bracket()
        this.useLowerbracket = false
        this.numberOfLaps = 2
    }
}

interface Validation {
    status: "success" | "error"
    message: string
}

export const validateTournament = (tournament: ITournament): Validation => {
    if (!tournament.name) {
        return {
            status: "error", message: "Tournament name cannot be empty"
        }
    }
    if (tournament.players.length < 2) {
        return {
            status: "error", message: "Not enough players"
        }
    }
    if (tournament.numberOfLaps < 0) {
        return {
            status: "error", message: "Number of laps must be positive"
        }
    }

    return {
        status: "success", message: ""
    }
}

interface ILocalGlobal extends ITournament {
    tournamentStart: number
    tournamentEnd: number
    runsPerPlayer: number | undefined

}