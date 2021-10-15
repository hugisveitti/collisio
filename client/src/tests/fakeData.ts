import { IEndOfGameInfoGame, IEndOfGameInfoPlayer, IPlayerGameInfo, TrackType } from "../classes/Game";
import { saveGameData } from "../firebase/firebaseFunctions";

const id1 = "LdEGkMu2r2QCdJ8wMerp1bkRrqd2"
const id2 = "LEzfm3UQl7b6CKUupasInidva9W2"
const id3 = null

const name1 = "test-player-1"
const name2 = "test-player-2"
const name3 = "test-player-3"


const players = [
    {
        playerName: name1,
        playerId: id1
    },
    {
        playerName: name2,
        playerId: id2
    },
    {
        playerName: name3,
        playerId: id3
    }
]

const numberOfFakeGames = 30
const possibleTracks: TrackType[] = ["track", "town-track"]

export const createFakeHighscoreData = () => {
    console.log("Creating fake data")
    for (let i = 0; i < numberOfFakeGames; i++) {
        const trackType: TrackType = possibleTracks[Math.floor(Math.random() * possibleTracks.length)]
        const gameId = `test-fakeGameId-${trackType}-${i}`
        const numberOfLaps = Math.floor((Math.random() * 6) + 2)
        const roomId = "test"
        const playerNames = []
        const playerIds = []
        const playerTotalTimes = []
        const playerLapTimes = []

        const playerData: IEndOfGameInfoPlayer[] = []

        const playerGameInfos: IPlayerGameInfo[] = []
        for (let player of players) {
            playerNames.push(player.playerName)
            playerIds.push(player.playerId ?? "undefined")
            const lapTimes = []
            let tt = 0
            let bestLapTime = 100000
            for (let j = 0; j < numberOfLaps; j++) {
                const lT = Math.round(Math.random() * 80 + 20)
                tt += lT
                lapTimes.push(lT)
                bestLapTime = Math.min(lT, bestLapTime)
            }
            playerLapTimes.push(lapTimes)
            playerTotalTimes.push(tt)

            playerData.push({
                playerName: player.playerName,
                playerId: player.playerId,
                lapTimes,
                bestLapTime,
                gameId,
                trackType,
                totalTime: tt,
                numberOfLaps,
                date: new Date()
            })
            playerGameInfos.push({
                id: player.playerId ?? "undefined",
                name: player.playerName,
                lapTimes,
                totalTime: tt
            })
        }
        const gameData: IEndOfGameInfoGame = {
            playersInfo: playerGameInfos,
            numberOfLaps,
            gameId,
            roomId,
            trackType,
            date: new Date()
        }

        console.log("###saving data")
        console.log("GAMEDATA", gameData)
        console.log("PlayerDATA", playerData)
        saveGameData(playerData, gameData)
    }
}