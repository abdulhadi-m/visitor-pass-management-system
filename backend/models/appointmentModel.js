const mongoose = require('mongoose')
const Schema = mongoose.Schema
const appointmentSchema = new Schema({
    visitorId:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Visitor'
    },
    hostId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status:{
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    dateTime:{
        type: Date,
        required: true
    }
},{timestamps: true}) 

module.exports = mongoose.model("Appointment", appointmentSchema)