const appointmentModel = require('../models/appointmentModel');
const mongoose = require('mongoose')

exports.requestAppointment = async(req,res)=>{
    const {visitorId, hostId, dateTime} = req.body;

    // checking for empty fields
    const emptyFields = []
    if(!visitorId){emptyFields.push('Visitor_ID')}
    if(!hostId){emptyFields.push('Host_ID')}
    if(!dateTime){emptyFields.push('Time')}
    if(emptyFields.length>0){
        return res.status(400).json({error: 
            'Please fill all the mandatory field!', emptyFields
        })
    }
    try {
        const appointment = await appointmentModel.create({visitorId, hostId, dateTime})
        res.status(201).json(appointment)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

exports.updateAppointmentStatus = async (req,res)=>{
    const {id} = req.params;
    const {status} = req.body;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'Invalid ID'})
    }
    try{
        const updatedAppointment = await appointmentModel.findByIdAndUpdate(id, {status}, {new: true})
        
        if(!updatedAppointment){
            return res.status(404).json({error: 'Appointment not found'})
        }
        res.status(200).json(updatedAppointment)
        
    }catch(error){
        res.status(404).json({error: error.message})
    }
}

exports.getPendingAppointment = async(req, res)=>{
    try{
        const appointments = await appointmentModel.find({status: 'Pending'})
        .populate('visitorId')
        .populate('hostId', 'name email')
        .sort({createdAt: -1})

        res.status(200).json(appointments)
    }
    catch(error){
        res.status(400).json({ error: error.message })
    }
}