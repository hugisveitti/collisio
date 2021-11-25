import createTheme from "@mui/material/styles/createTheme"


/** 
 * color1 is lightest and color4 is darkest
 */
const orange1 = "#ffc64c"
const orange2 = "#fda000"
const orange3 = "#f07900"
const orange4 = "#c65600"

const blue1 = "#c1eaff"
const blue2 = "#8ec6e2"
const blue3 = "#4b93b8"
const blue4 = "#185676"

const green1 = "#d3e9a6"
const green2 = "#9cbc62"
const green3 = "#669132"
const green4 = "#365b13"

const yellow1 = "#f9f3a6"
const yellow2 = "#f8e325"
const yellow3 = "#dfb70a"
const yellow4 = "#af9000"

const beige1 = "#f8d5c9"
const beige2 = "#f1bca9"
const beige3 = "#d9a17b"
const beige4 = "#be916c"

const gray1 = "#c4d9e1"
const gray2 = "#97b0ba"
const gray3 = "#65787f"
const gray4 = "#374274"

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
        "fontFamily": "monospace"
    },
    palette: {
        primary: {
            main: green3,// blue2 //'#2E604A',
            light: green1,
            dark: green4,

        },
        secondary: {
            main: yellow3, // '#D1362F',
            light: yellow2, //"wheat",
            dark: yellow4,//  "#dbb165"
        },
    },

}
)
