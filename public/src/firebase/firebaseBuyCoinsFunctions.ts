import { collection, getDocs, orderBy, query, where } from "@firebase/firestore"
import { firestore, functions } from "./firebaseInit"
import { httpsCallable } from "@firebase/functions"

const productsRefPath = "products"


export interface IBuyOption {
    euros: number
    coins: number
    type: "coins"
    id: string
    name: string
    currency: string
}


export const getCoinsBuyOptions = () => {

    return new Promise<IBuyOption[]>(async (resolve, reject) => {
        const ref = collection(firestore, productsRefPath)
        const q = query(ref, where("type", "==", "coins"), orderBy("euros", "asc"))
        const docs = await getDocs(q)
        const arr = []
        try {

            docs.forEach(d => {
                if (d.exists()) {
                    arr.push(d.data())
                }
            })
            resolve(arr)
        } catch (err) {
            console.warn("Error fetching coin products", err)
            // TODO how to handle error
            resolve([])
        }
    })
}
const stripePublicKey = inDevelopment ? "pk_test_V8RLXWQsXMTEZDD3hQIv8Pfg" : "pk_live_QYyQV8tNjrnhAQUYO2jBczsI"
// import Stripe from "stripe"

// const stripe = new Stripe(stripePublicKey, {
//     apiVersion: null
// })

import { loadStripe } from '@stripe/stripe-js';
import { toast } from "react-toastify"
import { inDevelopment } from "../utils/settings"


interface IStripeCheckoutData {
    userId: string
    productId: string
}

interface IStripeCheckoutCallback {
    id: string
}
export const buyCoins = (userId: string, productId: string): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {

        const stripe = await loadStripe(stripePublicKey);


        const createStripeCheckout = httpsCallable<IStripeCheckoutData, IStripeCheckoutCallback>(functions, "createStripeCheckout")
        createStripeCheckout({ userId, productId }).then(async (response) => {
            console.log("results of checkout", response)
            const sessionId = response.data.id
            stripe.redirectToCheckout({ sessionId }).then((res) => {
                console.log("Checkout finished", res)
            }).catch((err) => {
                console.warn("Error redirecting to checkout", err)
            })

        }).catch((err) => {
            console.warn("Error checking out:", err)
            toast.error("An error occured while checking out" + err)
            reject()
        })
    })
}