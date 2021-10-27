import { Howl, Howler } from "howler"

export const beepC4 = new Howl({
    src: ["./sound/beepC4.mp3"],
    html5: true,
    onend: () => {
        console.log("beepc4 played")
    },
    onload: () => {
        console.log("beepC4 loaded")
    }
})

export const beepE4 = new Howl({
    src: ["./sound/beepE4.mp3"],
    html5: true
})

