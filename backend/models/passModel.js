const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passSchema = new Schema({
    appointmentId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: 'Appointment'
    },
    qrCode:{
        type: String,
        required: true,
    },
    pdfUrl:{
        type: String,
        required: true,
    },
    validUntil:{
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Issued', 'Checked In', 'Checked Out'],
        default: 'Issued'
    }
},{timestamps: true}) 

module.exports = mongoose.model("Pass", passSchema)