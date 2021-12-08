import { IPlayerInfo, IPreGamePlayerInfo, VehicleType } from "../shared-backend/shared-stuff";
import { shuffleArray } from "../utils/utilFunctions";
import { IGameSettings } from "./localGameSettings";

type TournamentType = "local" | "global"


interface ITournament {
    players: IPreGamePlayerInfo
    tournamentType: TournamentType
    gameSettings: IGameSettings
    /** if defined then everyone will have to use that vehicle */
    vehicleType: VehicleType | undefined
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

    constructor(preGamePlayers: IPreGamePlayerInfo[]) {
        shuffleArray(preGamePlayers)

        let hasOddplayers = preGamePlayers.length % 2 !== 0
        for (let i = 0; i < preGamePlayers.length; i += 2) {

        }
    }
}

interface ILocalTournament extends ITournament {
    bracket: Bracket
    useLowerbracket: boolean
    numberOfGamesInSeries: number

}

interface ILocalGlobal extends ITournament {
    tournamentStart: number
    tournamentEnd: number
    runsPerPlayer: number | undefined

}