import { IStore } from "../components/store";
import { itemInArray } from "../utils/utilFunctions";

export const checkIfCanStartGame = (store: IStore): { canStartGame: boolean, message: string } => {

    if (store.activeBracketNode) {
        const activeIds = [store.activeBracketNode.player1?.uid, store.activeBracketNode.player2?.uid]
        if (store.players.length === 2 && itemInArray(store.players[0].id, activeIds) && itemInArray(store.players[1].id, activeIds)) {
            return {
                canStartGame: true,
                message: ""
            }
        }
        else {
            return {
                canStartGame: false,
                message: `Incorrect players are connected to play this tournament bracket, the only connected players should be ${store.activeBracketNode.player1?.displayName} and ${store.activeBracketNode.player2.displayName}.`
            }
        }

    }
    return { canStartGame: true, message: "" }
}