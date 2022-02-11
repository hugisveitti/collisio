interface IBuyOption {
    euros: number
    coins: number
}

// get from database?
export const buyOptions: IBuyOption[] = [
    {
        euros: 3,
        coins: 20 * (10 ** 3)
    },
    {
        euros: 5,
        coins: 40 * (10 ** 3)
    },
    {
        euros: 10,
        coins: 100 * (10 ** 3)
    },
    {
        euros: 20,
        coins: 250 * (10 ** 3)
    },
    {
        euros: 30,
        coins: 500 * (10 ** 3)
    },
]