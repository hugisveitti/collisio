/** class that TrafficSchoolCourse and RaceCourse extend */
import { LoadingManager } from "three";
import { getDeviceType } from "../utils/settings";
import "./loadingManager.css"


// const loadImage = document.createElement("img")
const loadDiv = document.createElement("div")
const loadDivText = document.createElement("div")
const loadingBarContainer = document.createElement("div")
const loadingBarInner = document.createElement("div")


if (getDeviceType() === "desktop") {

    // loadImage.src = "https://imgur.com/rpPch3m.jpg"
    // loadImage.setAttribute("id", "load-image")
    loadDiv.classList.add("hide")



    document.body.appendChild(loadDiv)
    // loadDivText.appendChild(loadImage)

    loadDiv.setAttribute("id", "loading-screen")
    loadDiv.setAttribute("class", "game-text")
    loadDiv.setAttribute("style", "z-index:999; ")
    loadDiv.appendChild(loadDivText)

    loadDivText.classList.add("loading-screen__text")

    loadDivText.innerHTML = "Loading game files"

    loadingBarContainer.classList.add("loading-bar__container")

    loadingBarInner.classList.add("loading-bar__inner")

    loadingBarContainer.appendChild(loadingBarInner)
    loadDiv.appendChild(loadingBarContainer)
}


export const courseManager = new LoadingManager()

let dotTimeout: NodeJS.Timeout

let numDots = 0


const loadingScreenTips = ["Lock the orientation of your mobile phone.", "The leader can change tracks, using the settings on the mobile.", "The leader can restart a game from the mobile.", "If the game is lagging, plug in your computer and close all other tabs."]
let tipIndex = Math.floor(Math.random() * loadingScreenTips.length)

const setLoadingDivText = async (text: string) => {
    return
    window.clearTimeout(dotTimeout)
    // loadImage.classList.remove("hide")
    const createText = () => {

        let dotText = text + "<br>" + `Pro tip: ${loadingScreenTips[tipIndex]}` + "<br>"

        for (let i = 0; i < numDots; i++) {
            dotText += "."
        }

        //    loadDivText.innerHTML = dotText

        dotTimeout = setTimeout(async () => {
            numDots += 1
            if (numDots === 4) {
                numDots = 1
            }
            createText()
        }, 350)
    }
    createText()
}

const clearLoadingDivText = () => {
    return
    // loadDiv.classList.add("hide")
    //  loadDivText.innerHTML = ""
    window.clearTimeout(dotTimeout)
}

courseManager.onStart = (url: string, loaded: number, itemsTotal: number) => {
    return
    setLoadingDivText("Started loading files " + loaded + " / " + itemsTotal)
}

let progressRatio = 0
export const setLoaderProgress = (ratio: number) => {
    progressRatio = ratio
    if (ratio > 0 && ratio < 1) {
        loadDivText.innerHTML = "Loading game files"
        loadDiv.classList.add("show")
        loadingBarInner.setAttribute("style", `width:${progressRatio * 200}px`)
    }
    if (ratio >= 1) {
        loadDiv.classList.remove("show")
    }
}

courseManager.onProgress = (url: string, loaded: number, itemsTotal: number) => {
    return
    setLoadingDivText("Loading files " + loaded + " / " + itemsTotal)
}

courseManager.onLoad = () => {
    return
    clearLoadingDivText()
}

