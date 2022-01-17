import { AudioLoader, Audio, AudioListener } from "three";
import { getStaticPath } from "../utils/settings";


const audioLoader = new AudioLoader();


let engineBuffer: AudioBuffer

export const loadEngineSoundBuffer = (): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {

        audioLoader.load(getStaticPath("sound/engine.mp3"), (buffer: AudioBuffer) => {
            engineBuffer = buffer
            resolve(engineBuffer)
        }, () => { }, (err) => {
            console.warn("Error loading engine sound.")
            reject()
        })
    })
}

export const loadSkidSoundBuffer = (): Promise<AudioBuffer> => {
    return new Promise<AudioBuffer>((resolve, reject) => {
        audioLoader.load(getStaticPath("sound/skid3.ogg"), (buffer: AudioBuffer) => {
            engineBuffer = buffer
            resolve(engineBuffer)
        }, () => { }, (err) => {
            console.warn("Error loading skid sound.")
            reject()
        })
    })
}

export const getBeep = async (path: string, listener: AudioListener, callback: (beep: Audio) => void) => {
    audioLoader.load(path, (buffer: AudioBuffer) => {
        const sound = new Audio(listener)
        sound.setBuffer(buffer)
        sound.setLoop(false)
        sound.setVolume(0.5)
        callback(sound)
    })
}