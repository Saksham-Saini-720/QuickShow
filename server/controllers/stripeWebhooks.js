import stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebhooks = async (req, res) => {
    console.log("Stripe webhook received");
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        console.log("Received event:", event.type);
        switch (event.type) {
            case `payment_intent.succeeded`:{
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });
                const session = sessionList.data[0];
                const {bookingId} = session.metadata;
                console.log("Payment succeeded for booking:", bookingId);
                await Booking.findByIdAndUpdate(bookingId, {
                    isPaid: true,
                    paymentLink : ""
                });
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }    
        res.json({received: true});
    } catch (err) {
        console.log(`Webhook processing Error: ${err}`);
        res.status(500).send("Internal Server Error");
    }   
};
