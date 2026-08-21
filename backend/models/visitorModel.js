// Name, Phone, Email, Photo URL
const mongoose = require('mongoose')

// will validator and bcrypt come here ? prolly no only validator to check the email

const Schema = mongoose.Schema
const visitorSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    phone:{
        // cuz type: NUMBER will not recognize 0 or +91 
        type: String,
        required: true,
    },
    purpose:{
        type: String,
        required: true,
    },
    photo_url:{
        type: String,
        required: true,
    }
},{timestamps:true})

module.exports = mongoose.model("Visitor", visitorSchema)