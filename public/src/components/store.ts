
import React from "react";
import { Socket } from "socket.io-client";
import { IGameSettings } from "../classes/localGameSettings";
import { IFlattendBracketNode, ITournament } from "../classes/Tournament";
import { IUserSettings } from "../classes/User";
import { ITokenData } from "../shared-backend/medalFuncions";
import { IPlayerInfo } from "../shared-backend/shared-stuff";
import { VehiclesSetup } from "../vehicles/VehicleSetup";


export interface IStore {
    roomId: string
    setRoomId: React.Dispatch<React.SetStateAction<string>>
    players: IPlayerInfo[]
    setPlayers: React.Dispatch<React.SetStateAction<IPlayerInfo[]>>
    player: IPlayerInfo
    setPlayer: React.Dispatch<React.SetStateAction<IPlayerInfo>>
    gameSettings: IGameSettings
    setGameSettings: React.Dispatch<React.SetStateAction<IGameSettings>>
    userSettings: IUserSettings
    setUserSettings: React.Dispatch<React.SetStateAction<IUserSettings>>
    // socket: Socket | undefined
    // setSocket: React.Dispatch<React.SetStateAction<Socket>>
    tournament: ITournament | undefined
    setTournament: React.Dispatch<React.SetStateAction<ITournament | undefined>>
    activeBracketNode: IFlattendBracketNode | undefined
    setActiveBracketNode: React.Dispatch<React.SetStateAction<IFlattendBracketNode | undefined>>
    previousPage: string
    setPreviousPage: React.Dispatch<React.SetStateAction<string>>
    tokenData: ITokenData
    setTokenData: React.Dispatch<React.SetStateAction<ITokenData>>
    vehiclesSetup: VehiclesSetup
    setVehiclesSetup: React.Dispatch<React.SetStateAction<VehiclesSetup>>
}