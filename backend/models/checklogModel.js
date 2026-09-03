const mongoose = require('mongoose')
const Schema = mongoose.Schema
const checklogSchema = new Schema({
    passId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Pass'
    },
    guardId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    checkIn:{
        type: Date,
        required: true
    },
    checkOut:{
        type: Date,
        default: null
    }
},{timestamps: true}) 
    

module.exports = mongoose.model("CheckLog", checklogSchema)