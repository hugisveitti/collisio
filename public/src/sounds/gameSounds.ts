import { bios } from "systeminformation";
import { AudioLoader, Audio, AudioListener, PerspectiveCamera } from "three";
import { getDeviceType, getStaticPath } from "../utils/settings";




//let engineBuffer: AudioBuffer

export const loadEngineSoundBuffer = (): Promise<AudioBuffer> => {
    const audioLoader = new AudioLoader();
    let engineSoundPath = "engine.ogg"
    //   let engineSoundPath = "f1engine2.mp3" // "engine.mp3"
    return new Promise((resolve, reject) => {
        audioLoader.load(getStaticPath(`sound/${engineSoundPath}`), (buffer: AudioBuffer) => {
            //   engineBuffer = buffer
            resolve(buffer)
        }, () => { }, (err) => {
            console.warn("Error loading engine sound.")
            reject()
        })
    })
}

export const loadSkidSoundBuffer = (): Promise<AudioBuffer> => {
    const audioLoader = new AudioLoader();
    return new Promise<AudioBuffer>((resolve, reject) => {
        audioLoader.loadAsync(getStaticPath("sound/skid5.ogg")).then((buffer: AudioBuffer) => {
            //  engineBuffer = buffer

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
        sound.setVolume(0.25)
        callback(sound)
    })
}

export const loadMusic = (file: string): Promise<AudioBuffer> => {
    const audioLoader = new AudioLoader();
    return new Promise<AudioBuffer>((resolve, reject) => {
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
let musicFile: string | undefined
export const addMusic = async (volume: number, camera: PerspectiveCamera, filename: string, notAutoStart?: boolean) => {
    if (music && music.isPlaying && musicFile !== filename) {
        music.stop()
        music = undefined
    }
    if (camera && getDeviceType() === "desktop" && !music) {
        const listener = new AudioListener()
        camera.add(listener)
        music = new Audio(listener)
        loadMusic(filename).then((buffer) => {
            musicFile = filename
            music.setBuffer(buffer)
            music.setLoop(true)
            if (!isFinite(volume)) {
                console.warn("volume not finite", volume)
                volume = 0
                return
            }
            music.setVolume(volume)
            if (!notAutoStart && volume > 0) {
                if (music.isPlaying) {
                    music?.stop()
                }
                music.play()
            }
        })
    }
}

export const setMusicVolume = (volume: number) => {
    if (!music) return
    if (!isFinite(volume)) {
        volume = 0
        console.warn("volume not finite", volume)
        music?.stop()
        return
    }

    music?.setVolume(volume)
    if (!music?.isPlaying) {
        music.play()
    } else if (volume === 0) {
        music.stop()
    }
}

export const stopMusic = () => {
    if (!music || !music.isPlaying) return

    music?.stop()

}

export const removeMusic = () => {
    if (!music || !music.isPlaying) return
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

let playSounds = true

export const setPlaySounds = (_playSounds: boolean) => {
    playSounds = _playSounds
}

const soundsVolume = 0.15
let gameStartSound: HTMLMediaElement
export const createGameStartSound = () => {
    if (gameStartSound) return
    gameStartSound = document.createElement("audio")
    gameStartSound.src = "/sound/game-start1.ogg"
    gameStartSound.load()
    gameStartSound.volume = soundsVolume
}

export const playGameStartSound = () => {
    if (gameStartSound && playSounds) {
        gameStartSound.play()
    }
}

let btnClickSound: HTMLMediaElement
export const createBtnClickSound = () => {
    if (btnClickSound) return
    btnClickSound = document.createElement("audio")
    btnClickSound.src = "/sound/btn-click2.ogg"
    btnClickSound.load()
    btnClickSound.volume = soundsVolume
}

export const playBtnClickSound = () => {
    if (btnClickSound && playSounds) {
        btnClickSound.play
        btnClickSound.play()
    }
}