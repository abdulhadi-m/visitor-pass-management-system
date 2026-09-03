const mongoose = require('mongoose')
const VisitorModel = require('../models/visitorModel');
const AppointmentModel = require('../models/appointmentModel');

// register a visitor (Find or Create to handle returning visitors without E11000 errors)
exports.registerVisitor = async(req,res)=>{
    const {name, email, phone, purpose, hostName} = req.body;
    
    const emptyFields = []
    if(!name){emptyFields.push('Name')}
    if(!email){emptyFields.push('Email')}
    if(!phone){emptyFields.push('Phone Number')}
    if(!req.file && !req.body.photo_url){emptyFields.push('Photo')}
    if(emptyFields.length>0){
        return res.status(400).json({error: 
            'Please fill all the mandatory fields!', emptyFields
        })
    }

    try {
        let photo_url = req.body.photo_url || 'https://dummyimage.com/150x150'
        if(req.file){
            photo_url = `/uploads/${req.file.filename}`
        }

        const normalizedEmail = email.toLowerCase().trim();
        let visitor = await VisitorModel.findOne({ email: normalizedEmail });

        if (visitor) {
            // Returning visitor: update profile and reuse existing identity _id
            visitor.name = name;
            visitor.phone = phone;
            if (req.file) {
                visitor.photo_url = photo_url;
            }
            if (purpose) {
                visitor.purpose = purpose;
            }
            await visitor.save();
        } else {
            // New visitor: create identity document
            visitor = await VisitorModel.create({
                name,
                email: normalizedEmail,
                phone,
                purpose: purpose || 'Official Visit',
                photo_url
            });
        }

        // Automatically create a new Pending Visit / Appointment referencing the visitor
        const appointment = await AppointmentModel.create({
            visitorId: visitor._id,
            hostName: hostName || 'Security Desk',
            purpose: purpose || visitor.purpose || 'Official Visit',
            status: 'Pending',
            dateTime: new Date()
        });

        res.status(201).json({
            ...visitor.toObject(),
            appointmentId: appointment._id,
            appointment
        });

    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// getVisitors
exports.getVisitors = async(req,res)=>{
    try {
        const visitors = await VisitorModel.find().sort({createdAt: -1})
        
        // empty array will be sent so it's fine no need to add this
        // if(!visitors){
        //     return res.status(404).json({error: 'No visitors found'})
        // }

        res.status(200).json(visitors)
    } catch (error) {
        // res.status(404).json({error: 'No visitors found'})
        res.status(400).json({error: error.message})
    }
}

// get a single visitor
exports.getVisitor = async(req,res)=>{
    const {id} = req.params
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: `${id} Visitor not found`})
    }
    try {
        const visitor = await VisitorModel.findById(id)
        
        if(!visitor){
            return res.status(404).json({error: 'Visitor not found'})
        }

        res.status(200).json(visitor)
        
    } catch (error) {
        res.status(400).json({error: 'No visitors found'})
    }
}
