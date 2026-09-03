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
        required: false,
        ref: 'User'
    },
    hostName:{
        type: String,
        default: 'Security Desk'
    },
    purpose:{
        type: String,
        default: 'Official Visit'
    },
    status:{
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    dateTime:{
        type: Date,
        required: true,
        default: Date.now
    }
},{timestamps: true}) 

module.exports = mongoose.model("Appointment", appointmentSchema)