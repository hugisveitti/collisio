/** class that TrafficSchoolCourse and RaceCourse extend */
import { LoadingManager } from "three";
import "./course.css";


const loadImage = document.createElement("img")

loadImage.src = "https://imgur.com/rpPch3m.jpg"
loadImage.setAttribute("id", "load-image")
loadImage.classList.add("hide")

document.body.appendChild(loadImage)

const loadDiv = document.createElement("div")
loadDiv.setAttribute("id", "load-screen")
loadDiv.setAttribute("class", "game-text")
loadDiv.setAttribute("style", "z-index:999;")
document.body.appendChild(loadDiv)

export const courseManager = new LoadingManager()

let dotTimeout: NodeJS.Timeout

let numDots = 0


const loadingScreenTips = ["Lock the orientation of your mobile phone.", "The leader can change tracks, using the settings on the mobile.", "The leader can restart a game from the mobile.", "If the game is lagging, plug in your computer and close all other tabs."]
let tipIndex = Math.floor(Math.random() * loadingScreenTips.length)

const setLoadingDivText = async (text: string) => {
    window.clearTimeout(dotTimeout)
    loadImage.classList.remove("hide")



    const createText = () => {

        let dotText = text + "<br>" + `Pro tip: ${loadingScreenTips[tipIndex]}` + "<br>"

        for (let i = 0; i < numDots; i++) {
            dotText += "."

        }

        loadDiv.innerHTML = dotText

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
    loadImage.classList.add("hide")
    loadDiv.innerHTML = ""
    window.clearTimeout(dotTimeout)
}

courseManager.onStart = (url: string, loaded: number, itemsTotal: number) => {
    setLoadingDivText("Started loading files " + loaded + " / " + itemsTotal)
}


courseManager.onProgress = (url: string, loaded: number, itemsTotal: number) => {
    setLoadingDivText("Loading files " + loaded + " / " + itemsTotal)
}

courseManager.onLoad = () => {
    clearLoadingDivText()
}