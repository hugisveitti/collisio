// const cors = require('cors')({ origin: true });

const functions = require("firebase-functions")
const admin = require("firebase-admin")


admin.initializeApp()

const stripe = require("stripe")(functions.config().stripe.token);

const productsPath = "products"
const transactionsPath = "transactions"
const tokensPath = "tokens"

const getProduct = (productId) => {
    return new Promise(async (resolve, reject) => {
        const ref = admin.firestore().collection(productsPath).doc(productId)

        const res = await ref.get()
        if (res.exists) {
            resolve(res.data())
        } else {
            resolve(undefined)
        }
    })
}

exports.createStripeCheckout = functions.region("europe-west1").https.onCall(async (data, context) => {
    // exports.createStripeCheckout = functions.https.onCall(async (data, context) => {

    const { userId, productId } = data
    console.log("userId", userId, "productId", productId)
    const product = await getProduct(productId)
    if (!product) {
        return
    }

    // since metadata can only contain string values


    const stripe = require("stripe")(functions.config().stripe.secret);
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url: "https://collisio.club/successfulpayment",
        cancel_url: "https://collisio.club/cancelpayment",
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: product.currency,
                    unit_amount: product.euros * 100,
                    product_data: {
                        name: product.name
                    }
                }
            }
        ],
        metadata: {
            productName: product.name,
            coins: product.coins.toString(),
            euros: product.euros.toString(),
            type: product.type,
            id: product.id,
            currenty: product.currency,
            userId
        }
    })
    return {
        id: session.id
    }
})



exports.stripeWebhook = functions.region("europe-west1").https.onRequest(async (req, res) => {
    //exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    let event;

    try {
        const whSec = functions.config().stripe.payments_webhook_secret;

        event = stripe.webhooks.constructEvent(
            req.rawBody,
            req.headers["stripe-signature"],
            whSec,
        );
    } catch (err) {
        console.error("Webhook signature verification failed.");
        return res.sendStatus(400);
    }

    if (event.data.object.object !== "checkout.session") {
        console.log("metadata", event.data.object.metadata)
        console.warn("wrong event", event.data.object.object)
        return res.sendStatus(400)
    }

    const dataObject = event.data.object;
    const { userId, coins } = dataObject.metadata
    if (!coins) {
        console.warn("Coins wrong, aborting", coins)
        return res.sendStatus(400)
    }

    await admin.firestore().collection(`${transactionsPath}`).doc(userId).collection("coins").doc().set({
        checkoutSessionId: dataObject.id,
        automaticTax: dataObject.automatic_tax,
        customerDetails: dataObject.customer_details,
        paymentStatus: dataObject.payment_status,
        amount: dataObject.amount_total,
        metadata: dataObject.metadata,
        date: admin.firestore.FieldValue.serverTimestamp()
    });

    const ref = admin.firestore().collection(tokensPath).doc(userId)
    const tokenRes = await ref.get()

    if (tokenRes.exists) {
        const update = {
            coins: admin.firestore.FieldValue.increment(+coins)
        }

        ref.update(update).then(() => {
            console.log(`UPDATE: user: ${userId}, bought: ${coins} coins`)
        }).catch((err) => {
            console.warn("Error UPDATE buying coins:", err, "userId:", userId)
            return res.sendStatus(500)
        })
    } else {
        const tokens = { coins: +coins, XP: 0 }
        ref.set(tokens).then(() => {
            console.log(`SET: user: ${userId}, bought: ${coins} coins`)
        }).catch((err) => {
            console.warn("Error SET buying coins:", err, "userId:", userId)
            return res.sendStatus(500)
        })

    }

    return res.sendStatus(200);
});