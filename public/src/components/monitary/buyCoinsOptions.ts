interface IBuyOption {
    euros: number
    coins: number
}

// get from database?
// put in products
export const buyOptions: IBuyOption[] = [
    {
        euros: 3,
        coins: 40 * (10 ** 3)
    },
    {
        euros: 5,
        coins: 80 * (10 ** 3)
    },
    {
        euros: 10,
        coins: 200 * (10 ** 3)
    },
    {
        euros: 20,
        coins: 500 * (10 ** 3) * 2
    },
    {
        euros: 30,
        coins: 1000 * (10 ** 3)
    },
]