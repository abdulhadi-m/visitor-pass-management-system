const passModel = require('../models/passModel')
const checklogModel = require('../models/checklogModel')
const mongoose = require('mongoose')

exports.checkIn = async(req,res)=>{
    const {passId} = req.body;
    if(!mongoose.Types.ObjectId.isValid(passId)){
        return res.status(400).json({error: `${passId} Pass not found`})
    }    
    try{
        const pass = await passModel.findById(passId)
        //  guardID
        const guardId = req.user._id;
        if(!pass){
            return res.status(404).json({error: 'Pass not found!'})
        }
        if(new Date() > pass.validUntil ){
            return res.status(400).json({error: 'The pass has expired'})
        }
        const checkInLog = await checklogModel.create({passId, guardId, checkIn: new Date()})
        await passModel.findByIdAndUpdate(passId, { status: 'Checked In' })
        res.status(201).json(checkInLog)
    }
    catch(error){
        res.status(400).json({error: error.message})
    }
}

exports.checkOut = async(req,res)=>{
    const {passId} = req.body;
    if(!mongoose.Types.ObjectId.isValid(passId)){
        return res.status(400).json({error: `${passId} Pass not found`})
    }
    try{
        const activeLog = await checklogModel.findOne({ passId: passId, checkOut: null })
        if(!activeLog){
            return res.status(400).json({error: 'Visitor is not currently checked in'})
        }
        activeLog.checkOut = new Date();
        await activeLog.save();
        await passModel.findByIdAndUpdate(passId, { status: 'Checked Out' })

        res.status(200).json(activeLog)
    }catch(error){
        res.status(400).json({error: error.message})
    }
}

exports.getAllLogs = async (req, res) => {
    try {
        const logs = await checklogModel.find()
            .sort({ createdAt: -1 })
            .populate('guardId', 'name email role')
            .populate({
                path: 'passId',
                populate: {
                    path: 'appointmentId',
                    populate: [
                        { path: 'visitorId', select: 'name email phone purpose photo_url' },
                        { path: 'hostId', select: 'name email' }
                    ]
                }
            })
        res.status(200).json(logs)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}