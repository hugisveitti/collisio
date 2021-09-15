import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io-client/build/typed-events";
import { IPlayerInfo } from "../classes/Game";
import { initGryoscope } from "../mobile/mobileController";
import { getDeviceType } from "../utils/settings";
import { MobileControls } from "../mobile/mobileGui";
import { VehicleControls } from "../utils/controls";
import { startGameOneMonitor } from "../one-monitor-game/one-monitor-game";



const playerList = document.getElementById("player-list")
const waitingRoom = document.getElementById("waiting-room")
let startBtn = document.createElement("button")

const createPlayerNamesList = (players: IPlayerInfo[]) => {
    while (playerList?.childNodes.length! > 0) {
        playerList?.removeChild(playerList.childNodes[0])
    }
    for (let i = 0; i < players.length; i++) {
        const playerInfo = document.createElement("div")
        playerInfo.setAttribute("class", "player-name")

        const playerInfoName = document.createElement("span")
        playerInfoName.setAttribute("style", "padding-right:55px")
        playerInfoName.innerHTML = players[i].playerName
        playerInfo.appendChild(playerInfoName)

        const playerTeamInfo = document.createElement("span")
        playerTeamInfo.setAttribute("style", "padding-right:40px")
        playerTeamInfo.innerHTML = "TEAM: " + players[i].teamName
        playerInfo.appendChild(playerTeamInfo)

        const playerInfoBothConnected = document.createElement("span")
        playerInfoBothConnected.innerHTML = players[i].bothConnected ? "Mobile connected" : "Needs to connect mobile"
        playerInfo.appendChild(playerInfoBothConnected)

        playerList?.appendChild(playerInfo)
    }
}

const createTeamSelectRadio = (socket: Socket) => {

    const teamOptions = [{ value: "1", label: "Team 1" }, { value: "2", label: "Team 2" }]
    let teamRadioButton1: HTMLInputElement
    let teamRadioButton2: HTMLInputElement
    for (let i = 0; i < teamOptions.length; i++) {

        const teamSelect = document.createElement("input")
        teamSelect.type = "radio"
        teamSelect.id = "team-select-" + teamOptions[i].label
        teamSelect.name = "team-select"
        teamSelect.value = teamOptions[i].value
        if (i === 0) {
            teamSelect.setAttribute("checked", "true")
            teamRadioButton1 = teamSelect
        } else if (i === 1) {
            teamRadioButton2 = teamSelect
        }

        const label = document.createElement("label")
        label.htmlFor = "team-select-" + teamOptions[i].label

        const labelTitle = document.createTextNode(teamOptions[i].label)
        label.appendChild(labelTitle)

        waitingRoom?.appendChild(teamSelect)
        waitingRoom?.appendChild(label)
        waitingRoom?.appendChild(document.createElement("br"))
    }
    const sendTeamChange = (teamNumber: number) => {
        socket.emit("team-change", teamNumber)
    }

    teamRadioButton1!.addEventListener("change", () => {
        sendTeamChange(1)
    })

    teamRadioButton2!.addEventListener("change", () => {
        sendTeamChange(2)
    })



}

export const createWaitingRoom = (socket: Socket, data: any, playerName: string) => {
    const deviceType = getDeviceType()
    const { roomName, isLeader } = data
    console.log("create waiting room")
    const joinRoom = document.getElementById("join-room")
    joinRoom?.setAttribute("style", "display:none")


    waitingRoom?.setAttribute("style", "display:block")
    const roomNameInfo = document.getElementById("room-name-info")
    roomNameInfo!.innerHTML = roomName

    const playerNameInfo = document.getElementById("player-name-info")
    playerNameInfo!.innerHTML = playerName

    if (deviceType === "desktop") {
        createTeamSelectRadio(socket)
    }

    socket.on("player-joined", (data) => {
        const { players, canStartGame } = data
        console.log("can start game", canStartGame)
        canStartGame ? startBtn.removeAttribute("disabled") : startBtn.setAttribute("disabled", "true")
        createPlayerNamesList(players)
    })

    if (isLeader) {
        startBtn.innerHTML = "Start game"

        startBtn.addEventListener("click", () => {

            socket.emit("leader-start-game", {})

        })

        waitingRoom?.appendChild(startBtn)
    } else {
        const waitingForLeader = document.createElement("div")
        waitingForLeader.innerHTML = "Waiting for the leader to start the game"
        waitingRoom?.appendChild(waitingForLeader)
    }


    if (deviceType === "desktop") {
        socket.on("start-game", ({ players }) => {
            waitingRoom?.setAttribute("style", "display:none")
            startGameOneMonitor(socket, players, { ballRadius: 1 })
        })
    } else {
        socket.on("start-game", ({ players, playerNumber }) => {
            waitingRoom?.setAttribute("style", "display:none")
            initGryoscope(socket)
        })
    }

    const _players: IPlayerInfo[] = [
        {
            playerName: "test1",
            bothConnected: true,
            isLeader: true,
            teamName: "0",
            playerNumber: 0,
            teamNumber: 0,
            mobileControls: new MobileControls()
            , vehicleControls: new VehicleControls()
        }, {
            playerName: "test2",
            bothConnected: true,
            isLeader: false,
            teamName: "1",
            playerNumber: 1,
            teamNumber: 1,
            mobileControls: new MobileControls()
            , vehicleControls: new VehicleControls()
        },
        {
            playerName: "test3",
            bothConnected: true,
            isLeader: false,
            teamName: "1",
            playerNumber: 2,
            teamNumber: 1,
            mobileControls: new MobileControls()
            , vehicleControls: new VehicleControls()
        },
        {
            playerName: "test4",
            bothConnected: true,
            isLeader: false,
            teamName: "0",
            playerNumber: 1,
            teamNumber: 0,
            mobileControls: new MobileControls()
            , vehicleControls: new VehicleControls()
        }
    ]
    // startGameOneMonitor(socket, _players)
    // waitingRoom?.setAttribute("style", "display:none")
}