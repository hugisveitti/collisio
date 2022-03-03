/** class that TrafficSchoolCourse and RaceCourse extend */
import { LoadingManager } from "three";
import { getDeviceType } from "../utils/settings";
import "./loadingManager.css"


const loadImage = document.createElement("img")
const loadDiv = document.createElement("div")
const loadDivText = document.createElement("div")
const loadingBarContainer = document.createElement("div")
const loadingBarInner = document.createElement("div")

const controllerImg = "https://imgur.com/raqOTkA.png"
const gamesettingsImg = "https://imgur.com/63DUaJx.png"
const lockOrientationImg = "https://imgur.com/6JaOzSR.png"

const tipImgs = [controllerImg, gamesettingsImg, lockOrientationImg]

if (getDeviceType() === "desktop") {
    // loadImage.src = "https://imgur.com/rpPch3m.jpg"
    loadDiv.classList.add("hide")

    loadDiv.appendChild(loadImage)

    loadImage.src = controllerImg // controllerImg
    loadImage.setAttribute("id", "load-image")

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

const loadingScreenTips = ["Lock the orientation of your mobile phone.", "The leader can change tracks, using the settings on the mobile.", "The leader can restart a game from the mobile.", "If the game is lagging, plug in your computer and close all other tabs."]
let tipIndex = Math.floor(Math.random() * loadingScreenTips.length)



let progressRatio = 0
export const setLoaderProgress = (ratio: number) => {
    progressRatio = ratio
    if (ratio => 0 && ratio < 1) {
        loadDivText.innerHTML = "Loading game files"
        loadDiv.classList.add("show")
        loadingBarInner.setAttribute("style", `width:${progressRatio * 200}px`)
    }
    if (ratio >= 1) {

    }
}

export const hideLoadDiv = () => {
    const rIndex = Math.floor(Math.random() * tipImgs.length)
    loadImage.src = tipImgs[rIndex]
    loadDiv.classList.remove("show")
}


// setLoaderProgress(.3)


// setInterval(() => {
//     setLoaderProgress(.8)
//     hideLoadDiv()
//     loadDiv.classList.add("show")
// }, 2000)