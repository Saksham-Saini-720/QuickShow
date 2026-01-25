import Show from "../models/Show.js"
import Booking from "../models/Booking.js"
import stripe from "stripe";

// function to check availability of selected seata for a movie
const checkSeatsAvailability = async (showId, selectedSeats) =>{
    try{
        const showData = await Show.findById(showId)
        if(!showData) return false
        
        const occupiedSeats = showData.occupiedSeats;
        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat])

        return isAnySeatTaken
    } catch (error) {
        console.log(error);
        return false
    }
}


export const createBooking = async (req, res) =>{
    try {
        const {showId, selectedSeats} = req.body;
        const {userId} = req.auth();
        const {origin} = req.headers;

        //check seat availability
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)

        if(isAvailable){
            return res.json({success : false, message : "Selected Seats are already booked. Please choose different seats."})
        }      

        // get the show details
        const showData = await Show.findById(showId).populate('movie');

        // create a new booking
        const booking = await Booking.create({
            user : userId,
            show : showId,
            amount : showData.showPrice * selectedSeats.length,
            bookedSeats : selectedSeats
        })

        selectedSeats.map(seat => {
            showData.occupiedSeats[seat] = userId
        })

        showData.markModified('occupiedSeats')

        await showData.save()

        //stripe gateway initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // creating line items to for stripe
        const line_items = [
            {
                price_data : {  
                    currency : 'usd',
                    product_data : {
                        name : showData.movie.title,    
                    },
                    unit_amount : Math.floor(booking.amount ) *100
                },
                quantity : 1
            }
        ]

        const session = await stripeInstance.checkout.sessions.create({
            success_url : `${origin}/loading/my-bookings`,
            cancel_url : `${origin}/my-bookings`,
            line_items : line_items,
            mode : 'payment',
            metadata : {
                bookingId : booking._id.toString()
            },
            expires_at : Math.floor(Date.now() / 1000) + 30 * 60 // 30 minutes from now
        })

        booking.paymentLink = session.url;
        await booking.save()

        res.json({success : true, message : "Booking created successfully", url : session.url})

    } catch (error) { 
        console.log(error);
        res.json({success : false, message : error.message})
    }   

}

export const getOccupiedSeats = async (req, res) =>{
    try {
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success : true, occupiedSeats})
        
    } catch (error) {
        console.log(error);
        res.json({success : false, message : error.message})
    }
}