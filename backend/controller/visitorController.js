const mongoose = require('mongoose')
const VisitorModel = require('../models/visitorModel');

// register a visitor
exports.registerVisitor = async(req,res)=>{
    const {name, email, phone, purpose, photo_url} = req.body;
    
    // copying from workout buddy for empty fields error
    const emptyFields = []
    if(!name){emptyFields.push('Name')}
    if(!email){emptyFields.push('Email')}
    if(!phone){emptyFields.push('Phone Number')}
    if(!purpose){emptyFields.push('Purpose')}
    if(!photo_url){emptyFields.push('Photo')}
    if(emptyFields.length>0){
        return res.status(400).json({error: 
            'Please fill all the mandatory field!', emptyFields
        })
    }

    try {
        const visitor = await VisitorModel.create({name, email, phone, purpose, photo_url})
        res.status(201).json(visitor)
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
