const User = require('../models/userModel')
const jwt = require('jsonwebtoken')

const createToken = (_id)=>{
    return jwt.sign({_id}, process.env.SECRET, {expiresIn: '10d'})
}

// login
exports.loginUser = async(req,res)=>{
    const {email, password} = req.body

    try {
        const user = await User.login(email, password)
        const token = createToken(user._id)
        res.status(200).json({_id: user._id, email, name: user.name, role: user.role, token})
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// signup
exports.signupUser = async(req,res)=>{
    const {email, name, role, password} = req.body
    try {
        const user = await User.signup(email, name, role, password)
        const token = createToken(user._id)

        res.status(200).json({_id: user._id, email, name: user.name, role: user.role, token})
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}