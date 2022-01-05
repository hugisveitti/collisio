import { v4 as uuid } from "uuid";
import { TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { IUser } from "./User";

export type TournamentType = "local" | "global"

export interface ITournamentUser extends IUser {
    ranking: number
    raceData?: ISingleRaceData[]
}

// global tournaments in firestore both have a map value players and a collection players
// the collection is copied into the map when the tournament starts
// but the collection is still updated since the race data is saved there
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
    /** useful for queries */
    playersIds: string[]
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
    playersIds: string[]

    constructor(leaderId: string, leaderName: string) {
        this.tournamentType = "local"
        this.leaderId = leaderId
        this.leaderName = leaderName
        this.players = {}
        this.id = uuid().slice(0, 8)

        this.trackName = "farm-track"
        this.name = ""

        this.numberOfLaps = 2

        this.isFinished = false
        this.hasStarted = false
        this.private = false

        this.creationDate = new Date()
        this.playersIds = []
    }
}

export interface IFlattendBracketNode {
    player1?: ITournamentUser
    player2?: ITournamentUser
    player1Score: number
    player2Score: number
    height: number
    id: string
    parentId?: string
    child1Id?: string
    child2Id?: string
    seriesFinished: boolean
}

export class BracketTree {
    player1?: ITournamentUser
    player2?: ITournamentUser
    player1Score: number
    player2Score: number
    child1?: BracketTree
    child2?: BracketTree
    parent?: BracketTree
    height: number
    // id of root is "root"
    // id of child is either `${this.id}_left` or `${this.id}_right`
    id: string
    seriesFinished: boolean

    constructor(height: number, parent?: BracketTree, id?: string) {
        this.height = height
        this.seriesFinished = false
        if (parent) {
            this.parent = parent
        }
        if (id) {
            this.id = id
        } else {
            this.id = "root"
        }
        this.player1Score = 0
        this.player2Score = 0

    }

    splitRight() {
        this.child1 = new BracketTree(this.height + 1, this, `${this.id}_right`)

    }

    splitLeft() {
        this.child2 = new BracketTree(this.height + 1, this, `${this.id}_left`)
    }

    populateTree(unorderedPlayers: ITournamentUser[]) {

        // order players by ranking
        unorderedPlayers.sort((a, b) => a.ranking - b.ranking)

        // now ordere players for the recursive step,
        // this makes sure players with rank 0 and 1 will be in the finals if they win all
        const orderPlayers = (players: ITournamentUser[], n: number) => {

            if (players.length < n * 4) return players
            const half1 = players.slice(0, players.length / 2)
            const half2 = players.slice(players.length / 2).reverse()

            const newPlayers = []
            for (let i = 0; i < players.length / 2; i += n) {
                for (let j = i; j < n + i; j++) {
                    if (j < half1.length) {

                        newPlayers.push(half1[j])
                    }
                }
                for (let j = i; j < n + i; j++) {
                    if (j < half2.length) {

                        newPlayers.push(half2[j])
                    }
                }
            }

            return orderPlayers(newPlayers, n * 2)
        }



        const orderdPlayers = orderPlayers(unorderedPlayers, 1)

        orderdPlayers.reverse()
        console.log("ordered players", orderdPlayers)

        let i = 0
        // let node: BracketTree = this
        const recursePopulate = (node: BracketTree) => {
            if (!node.child1) {
                node.player1 = orderdPlayers[i]
                i += 1
                node.player2 = orderdPlayers[i]
                i += 1
            } else if (!node.child2) {
                node.player2 = orderdPlayers[i]
                i += 1
            }
            if (node.child1) {
                recursePopulate(node.child1)
            }
            if (node.child2) {
                recursePopulate(node.child2)
            }
        }
        recursePopulate(this)
    }

    setPlayer(player: ITournamentUser) {
        if (!this.player1) {
            this.player1 = player
        } else if (!this.player2) {
            this.player2 = player
        } else {
            console.warn("Players have been set on node", this)
        }
    }

    setWinner(winner: 1 | 2) {
        if (!this.parent) {
            console.log("Tournament over")
        } else {

            if (winner === 1) {
                this.parent.setPlayer(this.player1)

            } else {
                this.parent.setPlayer(this.player2)
            }
        }
    }

    getTreeHeight() {
        let node = this as BracketTree
        while (node.child1) {
            node = node.child1
        }
        return node.height
    }

    findLatestUnplayedGame(playerId: string): BracketTree | undefined {

        const recurseFindPlayer = (node: BracketTree) => {

            if (node.player1?.uid === playerId) {
                return node
            }
            if (node.player2?.uid === playerId) {
                return node
            }
            if (node.child1) {
                const player = recurseFindPlayer(node.child1)
                if (player) return node
            }
            if (node.child2) {
                const player = recurseFindPlayer(node.child2)
                if (player) return node
            }
            return undefined
        }
        return recurseFindPlayer(this)
    }


    /**
     * Returns a list where each element is given an id 
     * and knows its parent, and children ids
     */
    flatten() {
        const list: IFlattendBracketNode[] = []

        const recurse = (node: BracketTree) => {
            list.push(node.getListItem())
            if (node.child1) recurse(node.child1)
            if (node.child2) recurse(node.child2)
        }

        recurse(this)
        return list
    }

    findNode(searchList: string[]): BracketTree {
        if (searchList.length === 0) return this
        if (searchList[0] === "right") return this.child1.findNode(searchList.slice(1))
        if (searchList[0] === "left") return this.child2.findNode(searchList.slice(1))

        console.warn("Error finding node", searchList)
        return undefined
    }



    setFromListItem(item: IFlattendBracketNode): void {
        this.id = item.id
        this.player1 = item.player1
        this.player2 = item.player2
        this.player1Score = item.player1Score
        this.player2Score = item.player2Score
    }


    getListItem(): IFlattendBracketNode {
        const obj = {
            height: this.height,
            id: this.id,
            player1: this.player1,
            player2: this.player2,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            parentId: this.parent?.id,
            child1Id: this.child1?.id,
            child2Id: this.child2?.id,
            seriesFinished: this.seriesFinished
        }
        Object.keys(obj).forEach(key => obj[key] === undefined ? delete obj[key] : {});
        return obj
    }

    static Deflatten(list: IFlattendBracketNode[], numberOfPlayers: number): BracketTree {
        const root = createBracketTree(numberOfPlayers)
        const rootItem = list.find(item => item.id === "root")
        if (!rootItem) {
            console.warn("Currupted list", list)
        }
        root.setFromListItem(rootItem)

        for (let item of list) {
            if (item.id === "root") {
                // already found   
            } else {
                const node = root.findNode(item.id.split("_").slice(1))
                if (node) {
                    node.setFromListItem(item)
                }
            }
        }
        return root
    }

    static FindActiveBracketNode(list: IFlattendBracketNode[], playerId: string): IFlattendBracketNode | undefined {
        let currentItem: IFlattendBracketNode
        console.log("player id", playerId)
        for (let item of list) {
            console.log("item.player1?.uid === playerId || item.player2?.uid", item.player1?.uid === playerId, item.player2?.uid === playerId,)
            if (!item.seriesFinished && (item.player1?.uid === playerId || item.player2?.uid === playerId)) {
                console.log("currentiiitttem", item)
                if (!currentItem) {
                    console.log("current item", item)

                    currentItem = item
                }
                else if (currentItem.height < item.height) {
                    // this func should probably not be reached..
                    console.log("current item", item)
                    currentItem = item
                }
            }
        }
        return currentItem
    }

    static FindParentBracketNode(list: IFlattendBracketNode[], id: string): IFlattendBracketNode | undefined {
        const splitId = id.split("_")
        const parentId = splitId.slice(0, splitId.length - 1).join("_")
        for (let item of list) {
            if (item.id === parentId) {
                return item
            }
        }
        return undefined
    }

    static AdvancePlayer(list: IFlattendBracketNode[], id: string, winner: ITournamentUser) {
        const splitId = id.split("_")
        const parentId = splitId.slice(0, splitId.length - 1).join("_")
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === parentId) {
                if (!list[i].player1) {
                    list[i].player1 = winner
                } else if (!list[i].player2) {
                    list[i].player2 = winner
                } else {
                    console.warn("Both players have been set", list)
                }
            }
        }
        return list
    }
}

export const getBracketNameFromHeight = (height: number) => {
    switch (height) {
        case 1:
            return "Final"
        case 2:
            return "Semi finals"
        case 3:
            return "Quarter finals"
        case 4:
            return "Eighth finals"
        case 5:
            return "16th finals"
        case 6:
            return "32th finals"
        default:
            return `${2 ** (height - 1)}th finals`
    }
}

const rootHeight = 1
export const createBracketTree = (numberOfPlayers: number) => {
    let slotsCreated = 2
    const root = new BracketTree(rootHeight)

    const maxHeight = Math.ceil(Math.log2(numberOfPlayers))
    const totalSlotsInMaxHeight = (numberOfPlayers - (2 ** (maxHeight - 1))) * 2
    let slotsInMaxHeight = 0


    // if we havent reach the max height then simply create the slots
    // (each leaf has two slots)
    // if in max height, count the number of possible slots to create
    const recurseSplit = (currentNode: BracketTree) => {

        const inMaxHeight = maxHeight === currentNode.height + 1
        if (maxHeight > (currentNode.height)) {
            if (!inMaxHeight || (inMaxHeight && slotsInMaxHeight < totalSlotsInMaxHeight)) {

                slotsCreated += 1
                currentNode.splitRight()

                if (inMaxHeight) {
                    slotsInMaxHeight += 2
                }

                recurseSplit(currentNode.child1)
            }
            if (!inMaxHeight || (inMaxHeight && slotsInMaxHeight < totalSlotsInMaxHeight)) {

                slotsCreated += 1
                currentNode.splitLeft()

                if (inMaxHeight) {
                    slotsInMaxHeight += 2
                }
                recurseSplit(currentNode.child2)
            }
        }
    }
    console.log("number of players", numberOfPlayers)
    if (numberOfPlayers > 2) {

        recurseSplit(root)
        if (slotsCreated !== numberOfPlayers) {
            console.warn("Error creating brackets tree, slotsCreated, numberOfPlayers", slotsCreated, numberOfPlayers)
        }
        if (slotsInMaxHeight !== totalSlotsInMaxHeight) {
            console.warn("Error creating brackets tree, slotsInMaxHeight, totalSlotsInMaxHeight", slotsInMaxHeight, totalSlotsInMaxHeight)
        }
    }

    return root
}

// export interface IBracketPlayer {
//     name: string
//     id: string
// }

// export class BracketGame {
//     winnerBracket?: BracketGame
//     loserBracket?: BracketGame
//     player1: ITournamentUser
//     player2: ITournamentUser
//     /** 
//      * if winner defined and brackets undefined then this is the final bracket 
//      * 
//     */
//     winner: string | false
//     constructor(player1: ITournamentUser, player2: ITournamentUser) {
//         this.player1 = player1
//         this.player2 = player2
//         this.winner = false
//     }

//     setWinner(winner: 1 | 2) {
//         if (winner === 1) {
//             this.winner = this.player1.uid
//         } else {
//             this.winner = this.player2.uid
//         }
//     }

//     setWinnerBracket(winnerBracket: BracketGame) {
//         this.winnerBracket = winnerBracket
//     }

//     setLoserBracket(loserBracket: BracketGame) {
//         this.loserBracket = loserBracket
//     }

//     getResults() {
//         if (!this.winner) {
//             console.warn("Winner hasnt been declared")
//             return { winner: undefined, loser: undefined }
//         } else if (this.winner === this.player1.uid) {
//             return { winner: this.player1, loser: this.player2 }
//         } else {
//             return { winner: this.player2, loser: this.player1 }
//         }
//     }

//     getBracketPlayers() {
//         const obj = {}
//         obj[this.player1.uid] = this
//         obj[this.player2.uid] = this
//         return obj
//     }

//     getWinnerName() {
//         if (!this.winner) return ""
//         if (this.winner === this.player1.uid) return this.player1.displayName
//         return this.player2.displayName
//     }


//     static createNewBracketGames(bracket1: BracketGame, bracket2: BracketGame) {

//         const { winner: winner1, loser: loser1 } = bracket1.getResults()
//         const { winner: winner2, loser: loser2 } = bracket2.getResults()

//         const winnerBracket = new BracketGame(winner1, winner2)
//         const loserBracket = new BracketGame(loser1, loser2)
//         bracket1.setWinnerBracket(winnerBracket)
//         bracket2.setWinnerBracket(winnerBracket)

//         bracket1.setLoserBracket(loserBracket)
//         bracket2.setLoserBracket(loserBracket)

//         return { winnerBracket, loserBracket }
//     }
// }

// export class Bracket {
//     bracketPlayers: { [playerId: string]: BracketGame }
//     players: ITournamentUser[]
//     constructor() {


//         // let hasOddplayers = preGamePlayers.length % 2 !== 0
//         // for (let i = 0; i < preGamePlayers.length; i += 2) {

//         // }

//     }

//     setPlayers(players: ITournamentUser[]) {
//         this.players = players
//     }

//     shufflePlayers() {
//         shuffleArray(this.players)
//     }
// }

interface ILocalTournament extends ITournament {
    flattenBracket?: IFlattendBracketNode[]
    useLowerbracket: boolean
    numberOfGamesInSeries: number
    useGroupStageToDetermineBracketPlacement: boolean
}



export class LocalTournament extends Tournament implements ILocalTournament {
    flattenBracket?: IFlattendBracketNode[];
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
    if (tournament.tournamentType === "global") {
        const t = tournament as GlobalTournament
        if (t.tournamentStart > t.tournamentEnd) {
            return {
                status: "error", message: "Tournament cannot start after it ends"
            }
        }
        // runsPerPlayer is either false or a number for firestore
        if (t.runsPerPlayer !== false && t.runsPerPlayer < 1) {
            return {
                status: "error", message: "Number of runs must be greater than 0."
            }
        }
    }

    return {
        status: "success", message: ""
    }
}

interface IGlobalTournament extends ITournament {
    tournamentStart: Date
    tournamentEnd: Date
    runsPerPlayer: number | false


}

export class GlobalTournament extends Tournament implements IGlobalTournament {

    tournamentStart: Date
    tournamentEnd: Date
    runsPerPlayer: number | false

    constructor(leaderId: string, leaderName: string) {
        super(leaderId, leaderName)
        this.tournamentType = "global"
        this.tournamentStart = new Date()
        this.tournamentEnd = new Date(Date.now() + 1000 * 60 * 60 * 2)
        this.runsPerPlayer = false
    }
}

export interface ISingleRaceData {
    vehicleType: VehicleType
    totalTime: number
    lapTimes: number[]

}

// interface IGlobalTournamentRaceData {
//     playerName: string
//     date: Date
//     uid: string
//     photoUrl: string
//     raceData: ISingleRaceData[]
// }

