import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        user : {type : mongoose.Schema.Types.ObjectId, required : true, ref:'User'},
        show : {type : String, required : true, ref : "Show"},
        amount : {type : Number, required : true},
        // bookedSeats : {type : Array, required : true},
        isPaid : {type : Boolean, default : false},
        paymentLink: {type: String},
        bookedSeats: {
        type: [String],
        },
    }, {timestamps : true}
)

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking;
 