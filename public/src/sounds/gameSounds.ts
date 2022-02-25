import { bios } from "systeminformation";
import { AudioLoader, Audio, AudioListener, PerspectiveCamera } from "three";
import { getDeviceType, getStaticPath } from "../utils/settings";




//let engineBuffer: AudioBuffer

export const loadEngineSoundBuffer = (): Promise<AudioBuffer> => {
    const audioLoader = new AudioLoader();
    console.log("load engine sound buffer")
    return new Promise((resolve, reject) => {
        audioLoader.load(getStaticPath("sound/engine.mp3"), (buffer: AudioBuffer) => {
            //   engineBuffer = buffer
            resolve(buffer)
        }, () => { }, (err) => {
            console.warn("Error loading engine sound.")
            reject()
        })
    })
}

export const loadSkidSoundBuffer = (): Promise<AudioBuffer> => {
    console.log("load skid sound buffer")
    const audioLoader = new AudioLoader();
    return new Promise<AudioBuffer>((resolve, reject) => {
        audioLoader.loadAsync(getStaticPath("sound/skid5.ogg")).then((buffer: AudioBuffer) => {
            //  engineBuffer = buffer
            console.log("skid5 loaded")

            resolve(buffer)
        }).catch((err) => {
            console.warn("Error loading skid sound.")
            reject()
        })
    })
}

export const getBeep = async (path: string, listener: AudioListener, callback: (beep: Audio) => void) => {
    const audioLoader = new AudioLoader();
    audioLoader.load(path, (buffer: AudioBuffer) => {
        const sound = new Audio(listener)
        sound.setBuffer(buffer)
        sound.setLoop(false)
        sound.setVolume(0.5)
        callback(sound)
    })
}

export const loadMusic = (file: string): Promise<AudioBuffer> => {
    const audioLoader = new AudioLoader();
    return new Promise<AudioBuffer>((resolve, reject) => {
        console.log("loading async")
        audioLoader.loadAsync(getStaticPath(`music/${file}`)).then((buffer: AudioBuffer) => {
            //      engineBuffer = buffer

            resolve(buffer)
        }).catch((err) => {
            console.warn("Error loading music sound.", file)
            reject()
        })
    })
}

let music: Audio

export const addMusic = async (volume: number, camera: PerspectiveCamera, filename: string, notAutoStart?: boolean) => {
    if (camera && getDeviceType() === "desktop" && !music) {
        const listener = new AudioListener()
        camera.add(listener)
        music = new Audio(listener)
        loadMusic(filename).then((buffer) => {
            music.setBuffer(buffer)
            music.setLoop(true)
            if (!isFinite(volume)) {
                console.warn("volume not finite", volume)
                volume = 0
                return
            }
            music.setVolume(volume)
            if (!notAutoStart) {
                music.play()
            }
        })
    }
}

export const setMusicVolume = (volume: number) => {
    if (!isFinite(volume)) {
        volume = 0
        console.warn("volume not finite", volume)
        music?.stop()
        return
    }
    music?.setVolume(volume)
}

export const stopMusic = () => {
    console.log("stopping music")
    if (!music || !music.isPlaying) return
    try {

        music?.stop()
    } catch (err) {
        console.log("error when stopping music", err)
    }
}

export const removeMusic = () => {
    music?.stop()
    music = undefined
}

export const startMusic = () => {
    if (!music?.isPlaying) {
        music?.play()
    }
}

export const pauseMusic = () => {
    music?.pause()
}