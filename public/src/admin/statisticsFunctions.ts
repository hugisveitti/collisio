import { IEndOfRaceInfoGame } from "../classes/Game";
import { itemInArray } from "../utils/utilFunctions";

export const calculateGamesDataStats = (gamesData: IEndOfRaceInfoGame[], only24Hours: boolean): string[] => {

    if (!only24Hours) return getStatsOnGames(gamesData)

    const now = new Date()

    const yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000))

    const todayGames = []

    for (let game of gamesData) {
        if (new Date(game.date) > yesterday) {
            todayGames.push(game)
        }
    }

    return getStatsOnGames(todayGames)


}

const getStatsOnGames = (gamesData: IEndOfRaceInfoGame[]): string[] => {
    const stats = [] as string[]

    const playerIds = []

    let numberOfNonauthPlays = 0
    let gameTicks = 0

    let numberOfLapsD = {}
    let trackNameD = {}

    const roomTickD = {}

    const pings = []
    const fpss = []

    const gameTypeD = {}
    const numberOfPlayersD = {}

    const vehicleTypeD = {}
    const gamesWithRoomId = {}

    for (let game of gamesData) {
        gameTicks += game.gameTicks
        for (let p of game.playersInfo) {


            if (!itemInArray(p.id, playerIds) && p.isAuthenticated) {
                playerIds.push(p.id)
            } else if (!p.isAuthenticated) {
                numberOfNonauthPlays += 1
            }

            const vT = p.vehicleType
            if (!(vT in vehicleTypeD)) {
                vehicleTypeD[vT] = 1
            } else {
                vehicleTypeD[vT] += 1
            }
        }
        const numLaps = game.roomSettings.numberOfLaps
        if (!(numLaps in numberOfLapsD)) {
            numberOfLapsD[numLaps] = 1
        } else {
            numberOfLapsD[numLaps] += 1
        }



        const trackName = game.roomSettings.trackName
        if (!(trackName in trackNameD)) {
            trackNameD[trackName] = 1
        } else {
            trackNameD[trackName] += 1
        }

        const roomId = game.roomId
        if (!(roomId in roomTickD)) {
            roomTickD[roomId] = game.roomTicks
        } else {
            roomTickD[roomId] = Math.max(roomTickD[roomId], game.roomTicks)
        }

        if (!(roomId in gamesWithRoomId)) {
            gamesWithRoomId[roomId] = 1
        } else {
            gamesWithRoomId[roomId] += 1
        }

        const gameType = game.roomSettings.gameType
        if (!(gameType in gameTypeD)) {
            gameTypeD[gameType] = 1
        } else {
            gameTypeD[gameType] += 1
        }

        const numberOfPlayers = game.playersInfo.length
        if (!(numberOfPlayers in numberOfPlayersD)) {
            numberOfPlayersD[numberOfPlayers] = 1
        } else {
            numberOfPlayersD[numberOfPlayers] += 1
        }

        pings.push(game.avgPing)
        fpss.push(game.avgFps)
    }

    let numGames = gamesData.length
    stats.push("####DATA INFO####")
    stats.push(`Number of games: ${numGames}`)
    stats.push(`Number unique authenticated players: ${playerIds.length}`)
    stats.push(`Number non authenticated plays: ${numberOfNonauthPlays}`)

    stats.push("----------------")
    stats.push("Number of laps")
    for (let key of Object.keys(numberOfLapsD)) {
        stats.push(`Games played with ${key} number of laps: ${numberOfLapsD[key]}`)
    }

    stats.push("----------------")

    stats.push("Trackname")
    for (let key of Object.keys(trackNameD)) {
        const num = trackNameD[key]
        stats.push(`Games played with track ${key}: ${num}, (${num / numGames})`)
    }

    stats.push("----------------")
    stats.push("Game types")
    for (let key of Object.keys(gameTypeD)) {
        const num = gameTypeD[key]
        stats.push(`Games played with gametype ${key}: ${num},  (${num / numGames})`)
    }
    stats.push("----------------")
    stats.push("Number of players")
    for (let key of Object.keys(numberOfPlayersD)) {
        const num = numberOfPlayersD[key]
        stats.push(`Games played with ${key} number of players: ${num}, (${num / numGames})`)
    }
    stats.push("----------------")
    stats.push("Vehicle types")
    for (let key of Object.keys(vehicleTypeD)) {
        const num = vehicleTypeD[key]
        stats.push(`Games played with vehicle ${key}: ${num}, (${num / numGames})`)
    }
    stats.push("----------------")
    const [avgRoomTicks, maxRoomTicks, minRoomTicks] = getAvgMaxMin(Object.values(roomTickD))
    stats.push("Room ticks")
    stats.push(`- Avg: ${avgRoomTicks}`)
    stats.push(`- Max: ${maxRoomTicks}`)
    stats.push(`- Min: ${minRoomTicks}`)

    const [avgGamesWithRoomId, maxGamesWithRoomId, minGamesWithRoomId] = getAvgMaxMin(Object.values(gamesWithRoomId))
    stats.push("Games with same roomId")
    stats.push(`- Avg: ${avgGamesWithRoomId}`)
    stats.push(`- Max: ${maxGamesWithRoomId}`)
    stats.push(`- Min: ${minGamesWithRoomId}`)

    const [avgFpss, maxFpss, minFpss] = getAvgMaxMin(fpss)
    stats.push("FPS AVERAGE")
    stats.push(`- Avg: ${avgFpss}`)
    stats.push(`- Max: ${maxFpss}`)
    stats.push(`- Min: ${minFpss}`)

    const [avgPings, maxPings, minPings] = getAvgMaxMin(pings)
    stats.push("Ping AVERAGE")
    stats.push(`- Avg: ${avgPings}`)
    stats.push(`- Max: ${maxPings}`)
    stats.push(`- Min: ${minPings}`)




    const avgGameTicks = numGames === 0 ? 0 : gameTicks / numGames

    stats.push(`Avg game ticks: ${avgGameTicks.toFixed(2)}`)


    stats.push(`Est. avg number of mins played ${((+avgRoomTicks / +avgFpss) / 60).toFixed(2)}`)

    // we could maybe calc this more 
    stats.push(`Est. max number of mins played ${((+maxRoomTicks / +avgFpss) / 60).toFixed(2)}`)



    return stats
}


const getAvgMaxMin = (nums: number[]) => {
    let avg = 0
    let total = 0
    let max = -Infinity
    let min = Infinity
    for (let num of nums) {
        if (num !== -1) {

            total += 1
            avg += num
            max = Math.max(max, num)
            min = Math.min(min, num)
        }
    }
    avg = avg / total

    return [avg.toFixed(2), max.toFixed(2), min.toFixed(2)]
}