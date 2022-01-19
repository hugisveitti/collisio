import createTheme from "@mui/material/styles/createTheme"
import { Shadows } from "@mui/material/styles/shadows"


/** 
 * color1 is lightest and color4 is darkest
 */
const orange1 = "#ffc64c"
export const orange2 = "#fda000"
const orange3 = "#f07900"
const orange4 = "#c65600"

const blue1 = "#c1eaff"
const blue2 = "#8ec6e2"
const blue3 = "#4b93b8"
export const blue4 = "#185676"

export const green1 = "#d3e9a6"
const green2 = "#9cbc62"
const green3 = "#669132"
export const green4 = "#365b13"

export const yellow1 = "#f9f3a6"
export const yellow2 = "#f8e325"
export const yellow3 = "#dfb70a"
const yellow4 = "#af9000"

const beige1 = "#f8d5c9"
const beige2 = "#f1bca9"
const beige3 = "#d9a17b"
const beige4 = "#be916c"

const gray1 = "#c4d9e1"
const gray2 = "#97b0ba"
const gray3 = "#65787f"
const gray4 = "#374274"

export const red1 = "#fb4a1"
export const red2 = "#dc5a3a"
const red3 = "#ab3a1d"
export const red4 = "#7e1a09"

export const containerBackgroundColor = yellow1 // "#dbb165"

export const inputBackgroundColor = beige1//"wheat"

export const cardBackgroundColor = yellow3

export const modalBackgroundColorLight = beige3
export const modalBackgroundColor = beige2
export const modalBackgroundColorDark = beige3

export const premiumColor = blue3
export const standardColor = blue2
export const basicColor = gray1

export const themeOptions = createTheme({
    typography: {
        fontFamily: "monospace" // "Roboto"
    },


    palette: {

        primary: {

            // main: "#fff", //green3,// blue2 //'#2E604A',
            // light: "#eee", // green1,
            // dark: "#ccc", //green4,
            main: "#777", //green3,// blue2 //'#2E604A',
            light: "#777", // green1,
            dark: "#777", //green4,

        },
        secondary: {
            // main: "#000", //green3,// blue2 //'#2E604A',
            // light: "#111", // green1,
            // dark: "#222", //green4,
            main: "#777", //green3,// blue2 //'#2E604A',
            light: "#777", // green1,
            dark: "#777", //green4,
        },
    },
})

/**
 * 
 * @param _backgroundColor if you want the color to be black or white
 * will send the colors with alpha
 * @returns 
 */
export const getStyledColors = (_backgroundColor: "black" | "white") => {
    const color = _backgroundColor === "black" ? "white" : "black";
    const backgroundColor =
        _backgroundColor === "black" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.83)";

    return { color, backgroundColor }

}
