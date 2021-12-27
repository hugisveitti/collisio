import { instanceOfSimpleVector, SimpleVector } from "../vehicles/IVehicle";
import { LowPolyTestVehicle } from "../vehicles/LowPolyTestVehicle";
import { IVehicleConfig, defaultVehicleConfig } from "../vehicles/VehicleConfigs";
import { LowPolyTestScene } from "./lowPolyTest";


export const createXYZInput = (currVec: SimpleVector, top: number, innerHtml: string, onChange: (vec: SimpleVector) => void, container: HTMLDivElement) => {
    let cVec = currVec
    let inputWidth = 60
    const inputDiv = document.createElement("div")
    inputDiv.setAttribute("class", "vehicle-input")
    inputDiv.setAttribute("style", `top:${top}px;`)
    inputDiv.innerHTML = innerHtml
    const inputX = document.createElement("input")

    inputX.setAttribute("type", "number")
    inputX.setAttribute("value", cVec.x + "")
    inputX.setAttribute("style", `width:${inputWidth}px;`)
    inputX.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
            e.target.value

            if (!isNaN(+e.target.value)) {
                cVec.x = +e.target.value
                onChange(cVec)
            }
        }
    })

    inputDiv.appendChild(inputX)

    const inputY = document.createElement("input")

    inputY.setAttribute("type", "number")
    inputY.setAttribute("value", cVec.y + "")
    inputY.setAttribute("style", `width:${inputWidth}px;`)
    inputY.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
            e.target.value

            if (!isNaN(+e.target.value)) {
                cVec.y = +e.target.value
                onChange(cVec)
            }
        }
    })

    inputDiv.appendChild(inputY)

    const inputZ = document.createElement("input")

    inputZ.setAttribute("type", "number")
    inputZ.setAttribute("value", cVec.z + "")
    inputZ.setAttribute("style", `width:${inputWidth}px;`)
    inputZ.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
            e.target.value

            if (!isNaN(+e.target.value)) {
                cVec.z = +e.target.value
                onChange(cVec)
            }
        }
    })

    inputDiv.appendChild(inputZ)


    container.appendChild(inputDiv)
}

export const createVehcileInput = (value: number | SimpleVector | boolean | string, top: number, innerHtml: string, onChange: (val: number | SimpleVector) => void, container: HTMLDivElement) => {

    if (instanceOfSimpleVector(value)) {
        createXYZInput(value, top, innerHtml, onChange, container)
    }

    const inputDiv = document.createElement("div")
    inputDiv.setAttribute("class", "vehicle-input")
    inputDiv.setAttribute("style", `top:${top}px;`)
    inputDiv.innerHTML = innerHtml
    const input = document.createElement("input")

    input.setAttribute("type", "number")
    input.setAttribute("value", value + "")
    input.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
            e.target.value

            if (!isNaN(+e.target.value)) {
                onChange(+e.target.value)
            }
        }
    })

    inputDiv.appendChild(input)
    container.appendChild(inputDiv)
}


export const createTestVehicleInputs = (testScene: LowPolyTestScene, vehicleInputsContainer: HTMLDivElement) => {

    while (vehicleInputsContainer.children.length > 0) {
        vehicleInputsContainer.removeChild(vehicleInputsContainer.children[0])
    }

    console.log("testScene.vehicle instanceof LowPolyTestVehicle", testScene.vehicle instanceof LowPolyTestVehicle)
    console.log("this vehice", testScene.vehicle)
    if (testScene.vehicle instanceof LowPolyTestVehicle) {

        let key: keyof IVehicleConfig = "engineForce"

        let topOffset = 25
        let top = 0
        createVehcileInput(testScene.vehicle.getVehicleConfigKey(key), top, key, (val) => {
            (testScene.vehicle as LowPolyTestVehicle).setVehicleConfigKey("engineForce", val)
        }, vehicleInputsContainer)



        key = "mass"
        top += topOffset
        createVehcileInput(testScene.vehicle.getVehicleConfigKey(key), top, key, (val) => (testScene.vehicle as LowPolyTestVehicle).updateMass(val as number), vehicleInputsContainer)

        key = "maxSpeed"
        top += topOffset
        createVehcileInput(testScene.vehicle.getVehicleConfigKey(key), top, key, (val) => (testScene.vehicle as LowPolyTestVehicle).updateMaxSpeed(val as number), vehicleInputsContainer)

        key = "breakingForce"
        top += topOffset
        createVehcileInput(testScene.vehicle.getVehicleConfigKey(key), top, key, (val) => (testScene.vehicle as LowPolyTestVehicle).setVehicleConfigKey(key, val), vehicleInputsContainer)

        /** These cannot be mass and inertia */
        const keys = ["suspensionDamping", "suspensionStiffness", "suspensionCompression", "suspensionRestLength", "maxSuspensionTravelCm", "maxSuspensionForce", "rollInfluence", "frictionSlip"]
        for (let key of keys) {
            key = key as keyof IVehicleConfig
            top += topOffset
            if (!(key in defaultVehicleConfig)) {
                console.warn(key, "is not a part the VehicleConfig")
            }
            createVehcileInput(testScene.vehicle.getVehicleConfigKey(key as keyof IVehicleConfig), top, key, (val) => (testScene.vehicle as LowPolyTestVehicle).setVehicleConfigKey(key as keyof IVehicleConfig, val), vehicleInputsContainer)

        }


        top += topOffset
        createXYZInput(testScene.vehicle.getInertia(), top, "inertia", (newI) => {
            (testScene.vehicle as LowPolyTestVehicle).setInertia(newI)
        }, vehicleInputsContainer)

        top += topOffset
        createXYZInput(testScene.vehicle.getCenterOfMass(), top, "Set position", (newCM) => {
            (testScene.vehicle as LowPolyTestVehicle).setCenterOfMass(newCM)
        }, vehicleInputsContainer)


        top += topOffset
        const useChaseCamButtontDiv = document.createElement("div")
        useChaseCamButtontDiv.setAttribute("class", "vehicle-input")
        useChaseCamButtontDiv.setAttribute("style", `top:${top}px;`)
        useChaseCamButtontDiv.innerHTML = "Chase cam"
        const useChaseCamButton = document.createElement("button")


        useChaseCamButton.innerHTML = testScene.vehicle.useChaseCamera ? "ON" : "OFF"
        useChaseCamButton.addEventListener("click", (e) => {
            window.localStorage.setItem("useChaseCamera", (!testScene.vehicle.useChaseCamera).toString())
            testScene.vehicle.updateVehicleSettings({
                ...testScene.vehicle.vehicleSettings,
                useChaseCamera: !testScene.vehicle.useChaseCamera
            })
            useChaseCamButton.innerHTML = testScene.vehicle.useChaseCamera ? "ON" : "OFF"

        })

        useChaseCamButtontDiv.appendChild(useChaseCamButton)
        vehicleInputsContainer.appendChild(useChaseCamButtontDiv)

        top += topOffset
        const resetDefaultBtnDiv = document.createElement("div")
        resetDefaultBtnDiv.setAttribute("class", "vehicle-input")
        resetDefaultBtnDiv.setAttribute("style", `top:${top}px;`)
        resetDefaultBtnDiv.innerHTML = "Reset to default"
        const resetDefaultBtn = document.createElement("button")


        resetDefaultBtn.innerHTML = "RESET "
        resetDefaultBtn.addEventListener("click", (e) => {
            (testScene.vehicle as LowPolyTestVehicle).resetConfigToDefault()
            createTestVehicleInputs(testScene, vehicleInputsContainer)

        })
        resetDefaultBtnDiv.appendChild(resetDefaultBtn)
        vehicleInputsContainer.appendChild(resetDefaultBtnDiv)

        top += topOffset
        const debugBtnDiv = document.createElement("div")
        debugBtnDiv.setAttribute("class", "vehicle-input")
        debugBtnDiv.setAttribute("style", `top:${top}px;`)
        debugBtnDiv.innerHTML = "use debug "
        const debugBtn = document.createElement("button")


        debugBtn.innerHTML = `Debug ${testScene.usingDebug ? "ON" : "OFF"}`
        debugBtn.addEventListener("click", (e) => {
            testScene.usingDebug = !testScene.usingDebug
            window.localStorage.setItem("usingDebug", testScene.usingDebug + "")
            if (testScene.usingDebug) {
                testScene.physics.debug.enable()
            } else {
                testScene.physics.debug.disable()
            }

        })
        debugBtnDiv.appendChild(debugBtn)
        vehicleInputsContainer.appendChild(debugBtnDiv)
    }
}