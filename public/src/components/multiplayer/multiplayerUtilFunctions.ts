import { getLocalDisplayName, getLocalUid } from "../../classes/localStorage";
import { IUser } from "../../classes/User";
import { IStore } from "../store";

export const getUserConfig = (store: IStore, user: IUser | undefined) => {

    return {
        userId: user?.uid ?? getLocalUid(),
        displayName:
            user?.displayName ?? getLocalDisplayName() ?? "Player" + Math.ceil(Math.random() * 20),
        // userSettings: store.userSettings,
        // vehicleSetup:
        //     store.vehiclesSetup[
        //     store.userSettings.vehicleSettings.vehicleType
        //     ],
        isAuthenticated: !!user,
        gameSettings: store.gameSettings
    };
}