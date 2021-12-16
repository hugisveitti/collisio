import { v4 as uuid } from "uuid";
import { IPreGamePlayerInfo, TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { getDateNow, shuffleArray } from "../utils/utilFunctions";
import { IUser } from "./User";

type TournamentType = "local" | "global"

export interface ITournamentUser extends IUser {
    ranking: number
}

export interface ITournament {
    // store as key value pairs?
    players: { [userId: string]: ITournamentUser }


    tournamentType: TournamentType
    trackName: TrackName
    numberOfLaps: number
    /** if defined then everyone will have to use that vehicle */
    vehicleType?: VehicleType
    /** id of leader */
    leaderId: string
    leaderName: string

    /** Name of tournament */
    name: string
    id: string

    hasStarted: boolean
    isFinished: boolean

    /** if private then can only get to it with link */
    private: boolean

    creationDate: Date
}


export class Tournament implements ITournament {

    vehicleType?: VehicleType
    name: string
    id: string
    trackName: TrackName;
    players: { [userId: string]: ITournamentUser }
    tournamentType: TournamentType
    leaderId: string;
    leaderName: string
    numberOfLaps: number;
    hasStarted: boolean
    isFinished: boolean
    private: boolean
    creationDate: Date;

    constructor(leaderId: string, leaderName: string) {
        this.tournamentType = "local"
        this.leaderId = leaderId
        this.leaderName = leaderName
        this.players = {}
        this.id = uuid()

        this.trackName = "farm-track"
        this.name = ""

        this.numberOfLaps = 2

        this.isFinished = false
        this.hasStarted = false
        this.private = false

        this.creationDate = new Date()
    }
}

class BracketGame {
    winnerBracket?: BracketGame
    loserBracket?: BracketGame
    player1Id: string
    player1Name: string
    player2Id: string
    player2Name: string
    /** 
     * if winner defined and brackets undefined then this is the final bracket 
     * 
    */
    winner: string | false
}

class Bracket {
    bracketPlayers: { [playerId: string]: BracketGame }
    players: ITournamentUser[]
    constructor() {


        // let hasOddplayers = preGamePlayers.length % 2 !== 0
        // for (let i = 0; i < preGamePlayers.length; i += 2) {

        // }

    }

    setPlayers(players: ITournamentUser[]) {
        this.players = players
    }

    shufflePlayers() {
        shuffleArray(this.players)
    }
}

interface ILocalTournament extends ITournament {
    bracket?: Bracket
    useLowerbracket: boolean
    numberOfGamesInSeries: number
    useGroupStageToDetermineBracketPlacement: boolean
}



export class LocalTournament extends Tournament implements ILocalTournament {
    bracket?: Bracket;
    useLowerbracket: boolean
    numberOfGamesInSeries: number
    useGroupStageToDetermineBracketPlacement: boolean

    constructor(leaderId: string, leaderName: string) {
        super(leaderId, leaderName)
        this.tournamentType = "local"
        this.numberOfGamesInSeries = 3
        this.useLowerbracket = false
    }
}

interface Validation {
    status: "success" | "error"
    message: string
}

export const validateStartTournament = (tournament: ITournament): Validation => {
    if (Object.keys(tournament.players).length < 2) {
        return {
            status: "error",
            message: "Not enough players to start tournament."
        }
    }
    return {
        status: "success",
        message: ""
    }
}

/**
 * 
 * @param tournament as tournament object, either local or global
 * @returns Validation if the tournament can be created
 */
export const validateCreateTournament = (tournament: ITournament): Validation => {
    if (!tournament.name) {
        return {
            status: "error", message: "Tournament name cannot be empty"
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

interface IGlobalTournament extends ITournament {
    tournamentStart: number
    tournamentEnd: number
    runsPerPlayer: number | undefined
}

export class GlobalTournament extends Tournament implements IGlobalTournament {

    tournamentStart: number
    tournamentEnd: number
    runsPerPlayer: number

    constructor(leaderId: string, leaderName: string) {
        super(leaderId, leaderName)
        this.tournamentType = "global"
        this.tournamentStart = -1
        this.tournamentEnd = -1
        this.runsPerPlayer = -1
    }
}