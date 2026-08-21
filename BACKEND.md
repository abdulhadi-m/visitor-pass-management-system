# Project Structure

```
├── backend
│   ├── controller
│   │   ├── appointmentController.js
│   │   ├── checklogController.js
│   │   ├── passController.js
│   │   ├── userController.js
│   │   └── visitorController.js
│   ├── middleware
│   │   ├── requireAuth.js
│   │   └── requireRole.js
│   ├── models
│   │   ├── appointmentModel.js
│   │   ├── checklogModel.js
│   │   ├── passModel.js
│   │   ├── userModel.js
│   │   └── visitorModel.js
│   ├── routes
│   │   ├── appointment.js
│   │   ├── checklog.js
│   │   ├── pass.js
│   │   ├── user.js
│   │   └── visitor.js
│   ├── package-lock.json
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── frontend
│   ├── dist
│   │   ├── assets
│   │   │   ├── index-d2v2WEKY.css
│   │   │   └── index-D9eNc3Bt.js
│   │   ├── favicon.svg
│   │   └── index.html
│   ├── public
│   │   └── favicon.svg
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   │   ├── AppointmentForm.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── VisitorForm.jsx
│   │   ├── context
│   │   │   ├── AuthContext.jsx
│   │   │   └── PassContext.jsx
│   │   ├── hooks
│   │   │   ├── useAuthContext.jsx
│   │   │   ├── useCreateAppointment.jsx
│   │   │   ├── useCreateVisitor.jsx
│   │   │   ├── useGeneratePass.jsx
│   │   │   ├── useLogin.jsx
│   │   │   ├── useLogout.jsx
│   │   │   ├── usePassContext.jsx
│   │   │   └── useSignup.jsx
│   │   ├── pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── BACKEND.md
└── README.md
```

# File Contents

## backend/controller/appointmentController.js

```javascript
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
```

## backend/controller/checklogController.js

```javascript
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
```

## backend/controller/passController.js

```javascript
const passModel = require('../models/passModel')
const appointmentModel = require('../models/appointmentModel')
const mongoose = require('mongoose')
const QRCode = require('qrcode')
const PDFDocument = require('pdfkit')
const nodemailer = require('nodemailer')

// Mock/Live Nodemailer Transporter Configuration
const createTransporter = async () => {
    // 1. Custom SMTP configuration (e.g. Brevo, SendGrid, Mailtrap, etc.)
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })
    }

    // 2. Gmail / preset service configuration
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })
    }

    // 3. Zero-config fallback: Ethereal mock test account (prints clickable preview URL in terminal)
    const testAccount = await nodemailer.createTestAccount()
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    })
}

const generatePDFBase64 = (visitor, validUntil, qrCodeDataUrl) => {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: [250, 400], margin: 0 })
        const buffers = []

        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers)
            resolve(`data:application/pdf;base64,${pdfData.toString('base64')}`)
        })
        doc.rect(0, 0, 250, 60).fill('#1e3a8a')
        doc.fillColor('#ffffff').fontSize(16).text('VISITOR PASS', 0, 22, { align: 'center' })

        doc.fillColor('#111827').fontSize(18).text(visitor.name, 0, 90, { align: 'center' })
        doc.fillColor('#6b7280').fontSize(12).text(visitor.purpose, { align: 'center' })

        const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
        doc.image(qrImageBuffer, 50, 150, { width: 150 })

        doc.fillColor('#6b7280').fontSize(10).text('Valid Until:', 0, 320, { align: 'center' })
        doc.fillColor('#1e3a8a').fontSize(12).text(new Date(validUntil).toLocaleString(), { align: 'center' })

        doc.end()
    })
}

exports.generatePass = async(req,res)=>{
    const {appointmentId} = req.body;

    try{
        if(!mongoose.Types.ObjectId.isValid(appointmentId)){
            return res.status(400).json({error: `${appointmentId} Appointment not found`})
        }        
        const appointment = await appointmentModel.findById(appointmentId).populate('visitorId')
        if(!appointment){
            return res.status(400).json({error: 'Appointment not found'})
        }
        if(!(appointment.status == 'Approved')){
            return res.status(400).json({error: 'Cannot generate pass: Appointment is not approved.'})
        }
        const qrData = JSON.stringify({appointmentId: appointment._id})

        const qrCode = await QRCode.toDataURL(qrData)

        const validUntil = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)

        const pdfUrl = await generatePDFBase64(appointment.visitorId, validUntil, qrCode)

        const pass = await passModel.create({ appointmentId, qrCode, pdfUrl, validUntil })

        // Send Email Notification to Visitor
        try {
            const transporter = await createTransporter()
            const pdfBase64Buffer = Buffer.from(pdfUrl.split(',')[1], 'base64')
            const appointmentTimeFormatted = new Date(appointment.dateTime).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short'
            })

            const mailOptions = {
                from: process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `"VPMS Security Desk" <${process.env.EMAIL_USER}>` : '"VPMS Security Desk" <no-reply@vpms.local>'),
                to: appointment.visitorId.email,
                subject: 'Your Visitor Pass is Approved - VPMS',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Visitor Pass Approved</h1>
                        </div>
                        <div style="padding: 24px; background-color: #ffffff;">
                            <p style="font-size: 16px; margin-bottom: 16px;">Hello <strong>${appointment.visitorId.name}</strong>,</p>
                            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                                We are pleased to inform you that your visitor pass request has been <strong>approved</strong>.
                            </p>
                            
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #1e3a8a; font-size: 15px;">Appointment Details</h3>
                                <p style="margin: 6px 0; font-size: 14px;"><strong>Appointment Time:</strong> ${appointmentTimeFormatted}</p>
                                <p style="margin: 6px 0; font-size: 14px;"><strong>Purpose of Visit:</strong> ${appointment.visitorId.purpose || 'Official Visit'}</p>
                                <p style="margin: 6px 0; font-size: 14px;"><strong>Pass Valid Until:</strong> ${new Date(validUntil).toLocaleString()}</p>
                            </div>

                            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                                📄 <strong>Your digital visitor pass PDF is attached to this email.</strong> Please have it ready on your device or present the attached QR code at the security reception desk upon your arrival.
                            </p>
                            
                            <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                                If you need to reschedule or have any security inquiries, please contact the front desk.
                            </p>
                        </div>
                        <div style="background-color: #f8fafc; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                            &copy; ${new Date().getFullYear()} Visitor Pass Management System (VPMS). All rights reserved.
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Visitor_Pass_${appointment.visitorId.name.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBase64Buffer,
                        contentType: 'application/pdf'
                    }
                ]
            }

            const info = await transporter.sendMail(mailOptions)
            console.log('Pass notification email sent successfully:', info.messageId)
            const previewUrl = nodemailer.getTestMessageUrl(info)
            if (previewUrl) {
                console.log('Preview Ethereal Email URL:', previewUrl)
            }
        } catch (emailError) {
            console.error('Failed to send visitor pass email:', emailError)
        }

        res.status(201).json(pass)
    }
    catch(error){
        res.status(400).json({error: error.message})
    }
}

exports.getPasses = async(req,res)=>{
    const passes = await passModel.find({ status: { $ne: 'Checked Out' } }).sort({createdAt: -1})
    res.status(200).json(passes)
}

```

## backend/controller/userController.js

```javascript
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
```

## backend/controller/visitorController.js

```javascript
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

```

## backend/middleware/requireAuth.js

```javascript
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const requireAuth = async(req, res, next)=>{
    const {authorization} = req.headers
    if(!authorization){return res.status(401).json({error: 'Authentication token required!'})}
    const token = authorization.split(' ')[1]
    try{
        const {_id} = jwt.verify(token, process.env.SECRET)
        req.user = await User.findOne({_id}).select('_id role')
        next()
    }
    catch(error){
        console.log(error);
        res.status(401).json({error: 'Request not authorized'})
    }
}
module.exports = requireAuth
```

## backend/middleware/requireRole.js

```javascript
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is already set by requireAuth.js
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: You do not have the permission this action.' });
        }
        next();
    }
}

module.exports = requireRole;
```

## backend/models/appointmentModel.js

```javascript
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
```

## backend/models/checklogModel.js

```javascript
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
        // Not required, because they haven't left yet!
    }
},{timestamps: true}) 
    

module.exports = mongoose.model("CheckLog", checklogSchema)
```

## backend/models/passModel.js

```javascript
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
```

## backend/models/userModel.js

```javascript
const mongoose = require("mongoose");

// validator and bcrypt here later
const bcrypt = require('bcrypt')
const validator = require('validator')


const Structure = mongoose.Schema;
const userStructure = new Structure({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'Security', 'Employee', 'Visitor'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
},{
    timestamps:true
});

// signup()
userStructure.statics.signup=async function (email, name, role, password){
  const exist = await this.findOne({email})

  if(!email || !password || !name || !role){
    throw Error('Please fill all the required fields!')
  }
  if(!validator.isEmail(email)){
    throw Error('Please enter a valid Email ID')
  }
  if(!validator.isStrongPassword(password)){
    throw Error('Please create a strong password')
  }
  if(exist){
    throw Error('Email already exists!')
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  const user = await this.create({email, name, role, password:hash})

  return user
}

// login()
userStructure.statics.login = async function(email, password){
  if(!email || !password){
    throw Error('Please fill all the required fields!')
  }

  const user = await this.findOne({email})

  if(!user){
    throw Error('Incorrect Email!')
  }

  const match = await bcrypt.compare(password, user.password)

  if(!match){
    throw Error('Incorrect Password')
  }

  return user
}



module.exports = mongoose.model("User", userStructure);

```

## backend/models/visitorModel.js

```javascript
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
```

## backend/package-lock.json

```json
{
  "name": "backend",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "backend",
      "version": "1.0.0",
      "license": "ISC",
      "dependencies": {
        "bcrypt": "^6.0.0",
        "cors": "^2.8.6",
        "dotenv": "^17.4.2",
        "express": "^5.2.1",
        "jsonwebtoken": "^9.0.3",
        "mongoose": "^9.7.3",
        "nodemailer": "^9.0.5",
        "pdfkit": "^0.19.1",
        "qrcode": "^1.5.4",
        "validator": "^13.15.35"
      }
    },
    "node_modules/@mongodb-js/saslprep": {
      "version": "1.4.11",
      "resolved": "https://registry.npmjs.org/@mongodb-js/saslprep/-/saslprep-1.4.11.tgz",
      "integrity": "sha512-o9rAHc0IpIjuPSxRutWpE1F62x7n+4mVS4rCNHkzhIUMQcc18bb6xEq5wd2NdN0WjepIyXIppRshYI2kQDOZVA==",
      "license": "MIT",
      "dependencies": {
        "sparse-bitfield": "^3.0.3"
      }
    },
    "node_modules/@noble/ciphers": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@noble/ciphers/-/ciphers-1.3.0.tgz",
      "integrity": "sha512-2I0gnIVPtfnMw9ee9h1dJG7tp81+8Ob3OJb3Mv37rx5L40/b0i7djjCVvGOVqc9AEIQyvyu1i6ypKdFw8R8gQw==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@noble/hashes": {
      "version": "1.8.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-1.8.0.tgz",
      "integrity": "sha512-jCs9ldd7NwzpgXDIf6P3+NrHh9/sD6CQdxHyjQI+h/6rDNo88ypBxxz45UDuZHz9r3tNz7N/VInSVoVdtXEI4A==",
      "license": "MIT",
      "engines": {
        "node": "^14.21.3 || >=16"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@standard-schema/spec": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
      "license": "MIT"
    },
    "node_modules/@swc/helpers": {
      "version": "0.5.23",
      "resolved": "https://registry.npmjs.org/@swc/helpers/-/helpers-0.5.23.tgz",
      "integrity": "sha512-5lSsMOTXURePglDfvuAQUqkGek9Hg2kksOYay2m0+XR++b2NWYL/4sWyuvVBIs8oKnJaxkdi9whaL/sqN13afw==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.8.0"
      }
    },
    "node_modules/@types/webidl-conversions": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/@types/webidl-conversions/-/webidl-conversions-7.0.3.tgz",
      "integrity": "sha512-CiJJvcRtIgzadHCYXw7dqEnMNRjhGZlYK05Mj9OyktqV8uVT8fD2BFOB7S1uwBE3Kj2Z+4UyPmFw/Ixgw/LAlA==",
      "license": "MIT"
    },
    "node_modules/@types/whatwg-url": {
      "version": "13.0.0",
      "resolved": "https://registry.npmjs.org/@types/whatwg-url/-/whatwg-url-13.0.0.tgz",
      "integrity": "sha512-N8WXpbE6Wgri7KUSvrmQcqrMllKZ9uxkYWMt+mCSGwNc0Hsw9VQTW7ApqI4XNrx6/SaM2QQJCzMPDEXE058s+Q==",
      "license": "MIT",
      "dependencies": {
        "@types/webidl-conversions": "*"
      }
    },
    "node_modules/accepts": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-2.0.0.tgz",
      "integrity": "sha512-5cvg6CtKwfgdmVqY1WIiXKc3Q1bkRqGLi+2W/6ao+6Y7gu/RCwRuAhGEzh5B4KlszSuTLgZYuqFqo5bImjNKng==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "^3.0.0",
        "negotiator": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/bcrypt": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/bcrypt/-/bcrypt-6.0.0.tgz",
      "integrity": "sha512-cU8v/EGSrnH+HnxV2z0J7/blxH8gq7Xh2JFT6Aroax7UohdmiJJlxApMxtKfuI7z68NvvVcmR78k2LbT6efhRg==",
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "node-addon-api": "^8.3.0",
        "node-gyp-build": "^4.8.4"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/body-parser": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-2.3.0.tgz",
      "integrity": "sha512-2cGmJupaNgg+QUwVLAucDuWuoMZ6EX9iHDRswZ5lsNYEmwPaRknMPCLZz07yTzVq/83p4o/wzbDZbBrTvGGTIw==",
      "license": "MIT",
      "dependencies": {
        "bytes": "^3.1.2",
        "content-type": "^2.0.0",
        "debug": "^4.4.3",
        "http-errors": "^2.0.1",
        "iconv-lite": "^0.7.2",
        "on-finished": "^2.4.1",
        "qs": "^6.15.2",
        "raw-body": "^3.0.2",
        "type-is": "^2.1.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/body-parser/node_modules/content-type": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.0.0.tgz",
      "integrity": "sha512-j/O/d7GcZCyNl7/hwZAb606rzqkyvaDctLmckbxLzHvFBzTJHuGEdodATcP3yIRoDrLHkIATJuvzbFlp/ki2cQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/brotli": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/brotli/-/brotli-1.3.3.tgz",
      "integrity": "sha512-oTKjJdShmDuGW94SyyaoQvAjf30dZaHnjJ8uAF+u2/vGJkJbJPJAT1gDiOJP5v1Zb6f9KEyW/1HpuaWIXtGHPg==",
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.1.2"
      }
    },
    "node_modules/browserify-zlib": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/browserify-zlib/-/browserify-zlib-0.2.0.tgz",
      "integrity": "sha512-Z942RysHXmJrhqk88FmKBVq/v5tqmSkDz7p54G/MGyjMnCFFnC79XWNbg+Vta8W6Wb2qtSZTSxIGkJrRpCFEiA==",
      "license": "MIT",
      "dependencies": {
        "pako": "~1.0.5"
      }
    },
    "node_modules/bson": {
      "version": "7.3.1",
      "resolved": "https://registry.npmjs.org/bson/-/bson-7.3.1.tgz",
      "integrity": "sha512-h/C0qe6857pQhcSJHLfsR1uYGj98Ge3wKAD3Ed9KqH3wcVh+BM4Jq4xISD7vs9OPuT07n+q3QQVjslJ286j6ag==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/camelcase": {
      "version": "5.3.1",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-5.3.1.tgz",
      "integrity": "sha512-L28STB170nwWS63UjtlEOE3dldQApaJXZkOI1uMFfzf3rRuPegHaHesyee+YxQ+W6SvRDQV6UrdOdRiR153wJg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/cliui": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-6.0.0.tgz",
      "integrity": "sha512-t6wbgtoCXvAzst7QgXxJYqPt0usEfbgQdftEPbLL/cvv6HPE5VgvqCuAIDR0NgU52ds6rFwqrgakNLrHEjCbrQ==",
      "license": "ISC",
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.0",
        "wrap-ansi": "^6.2.0"
      }
    },
    "node_modules/clone": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/clone/-/clone-2.1.2.tgz",
      "integrity": "sha512-3Pe/CF1Nn94hyhIYpjtiLhdCoEoz0DqQ+988E9gmeEdQZlojxnOb74wctFyuwWQHzqyf9X7C7MG8juUpqBJT8w==",
      "license": "MIT",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "license": "MIT"
    },
    "node_modules/content-disposition": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-1.1.0.tgz",
      "integrity": "sha512-5jRCH9Z/+DRP7rkvY83B+yGIGX96OYdJmzngqnw2SBSxqCFPd0w2km3s5iawpGX8krnwSGmF0FW5Nhr0Hfai3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/content-type": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.2.2.tgz",
      "integrity": "sha512-D76uU73ulSXrD1UXF4KE2TMxVVwhsnCgfAyTg9k8P6KGZjlXKrOLe4dJQKI3Bxi5wjesZoFXJWElNWBjPZMbhg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.6.0"
      }
    },
    "node_modules/cors": {
      "version": "2.8.6",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.6.tgz",
      "integrity": "sha512-tJtZBBHA6vjIAaF6EnIaq6laBBP9aq/Y3ouVJjEfoHbRBcHBAHYcMh/w8LDrk2PvIMMq8gmopa5D4V8RmbrxGw==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decamelize": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-1.2.0.tgz",
      "integrity": "sha512-z2S+W9X73hAUUki+N+9Za2lBlun89zigOyGrsax+KUQ6wKW4ZoWpEYBkGhQjwAjjDCkWxhY0VKEhk8wzY7F5cA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/dfa": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/dfa/-/dfa-1.2.0.tgz",
      "integrity": "sha512-ED3jP8saaweFTjeGX8HQPjeC1YYyZs98jGNZx6IiBvxW7JG5v492kamAQB3m2wop07CvU/RQmzcKr6bgcC5D/Q==",
      "license": "MIT"
    },
    "node_modules/dijkstrajs": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/dijkstrajs/-/dijkstrajs-1.0.3.tgz",
      "integrity": "sha512-qiSlmBq9+BCdCA/L46dw8Uy93mloxsPSbwnm5yrKn2vMPiy8KyAskTF6zuV/j5BMsmOGZDPs7KjU+mjb670kfA==",
      "license": "MIT"
    },
    "node_modules/dotenv": {
      "version": "17.4.2",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-17.4.2.tgz",
      "integrity": "sha512-nI4U3TottKAcAD9LLud4Cb7b2QztQMUEfHbvhTH09bqXTxnSie8WnjPALV/WMCrJZ6UV/qHJ6L03OqO3LcdYZw==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT"
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/express": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/express/-/express-5.2.1.tgz",
      "integrity": "sha512-hIS4idWWai69NezIdRt2xFVofaF4j+6INOpJlVOLDO8zXGpUVEVzIYk12UUi2JzjEzWL3IOAxcTubgz9Po0yXw==",
      "license": "MIT",
      "dependencies": {
        "accepts": "^2.0.0",
        "body-parser": "^2.2.1",
        "content-disposition": "^1.0.0",
        "content-type": "^1.0.5",
        "cookie": "^0.7.1",
        "cookie-signature": "^1.2.1",
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "finalhandler": "^2.1.0",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.0",
        "merge-descriptors": "^2.0.0",
        "mime-types": "^3.0.0",
        "on-finished": "^2.4.1",
        "once": "^1.4.0",
        "parseurl": "^1.3.3",
        "proxy-addr": "^2.0.7",
        "qs": "^6.14.0",
        "range-parser": "^1.2.1",
        "router": "^2.2.0",
        "send": "^1.1.0",
        "serve-static": "^2.2.0",
        "statuses": "^2.0.1",
        "type-is": "^2.0.1",
        "vary": "^1.1.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "license": "MIT"
    },
    "node_modules/finalhandler": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-2.1.1.tgz",
      "integrity": "sha512-S8KoZgRZN+a5rNwqTxlZZePjT/4cnm0ROV70LedRHZ0p8u9fRID0hJUZQpkKLzro8LfmC8sx23bY6tVNxv8pQA==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "on-finished": "^2.4.1",
        "parseurl": "^1.3.3",
        "statuses": "^2.0.1"
      },
      "engines": {
        "node": ">= 18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/find-up": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-4.1.0.tgz",
      "integrity": "sha512-PpOwAdQ/YlXQ2vj8a3h8IipDuYRi3wceVQQGYWxNINccq40Anw7BlsEXCMbt1Zt+OLA6Fq9suIpIWD0OsnISlw==",
      "license": "MIT",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/fontkit": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/fontkit/-/fontkit-2.0.4.tgz",
      "integrity": "sha512-syetQadaUEDNdxdugga9CpEYVaQIxOwk7GlwZWWZ19//qW4zE5bknOKeMBDYAASwnpaSHKJITRLMF9m1fp3s6g==",
      "license": "MIT",
      "dependencies": {
        "@swc/helpers": "^0.5.12",
        "brotli": "^1.3.2",
        "clone": "^2.1.2",
        "dfa": "^1.2.0",
        "fast-deep-equal": "^3.1.3",
        "restructure": "^3.0.0",
        "tiny-inflate": "^1.0.3",
        "unicode-properties": "^1.4.0",
        "unicode-trie": "^2.0.0"
      }
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-2.0.0.tgz",
      "integrity": "sha512-Rx/WycZ60HOaqLKAi6cHRKKI7zxWbJ31MhntmtwMoaTeF7XFH9hhBp8vITaMidfljRQ6eYWCKkaTK+ykVJHP2A==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "license": "ISC",
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/http-errors": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
      "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "~2.0.0",
        "inherits": "~2.0.4",
        "setprototypeof": "~1.2.0",
        "statuses": "~2.0.2",
        "toidentifier": "~1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.7.2.tgz",
      "integrity": "sha512-im9DjEDQ55s9fL4EYzOAv0yMqmMBSZp6G0VvFyTMPKWxiSBHUj9NW/qqLmXUwXrrM7AvqSlTCfvqRb0cM8yYqw==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-promise": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/is-promise/-/is-promise-4.0.0.tgz",
      "integrity": "sha512-hvpoI6korhJMnej285dSg6nu1+e6uxs7zG3BYAm5byqDsgJNWwxzM6z6iZiAgQR4TJ30JmBTOwqZUw3WlyH3AQ==",
      "license": "MIT"
    },
    "node_modules/js-md5": {
      "version": "0.8.3",
      "resolved": "https://registry.npmjs.org/js-md5/-/js-md5-0.8.3.tgz",
      "integrity": "sha512-qR0HB5uP6wCuRMrWPTrkMaev7MJZwJuuw4fnwAzRgP4J4/F8RwtodOKpGp4XpqsLBFzzgqIO42efFAyz2Et6KQ==",
      "license": "MIT"
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.3",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.3.tgz",
      "integrity": "sha512-MT/xP0CrubFRNLNKvxJ2BYfy53Zkm++5bX9dtuPbqAeQpTVe0MQTFhao8+Cp//EmJp244xt6Drw/GVEGCUj40g==",
      "license": "MIT",
      "dependencies": {
        "jws": "^4.0.1",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jwa": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",
      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.1.tgz",
      "integrity": "sha512-EKI/M/yqPncGUUh44xz0PxSidXFr/+r0pA70+gIYhjv+et7yxM+s29Y+VGDkovRofQem0fs7Uvf4+YmAdyRduA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/kareem": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/kareem/-/kareem-3.3.0.tgz",
      "integrity": "sha512-kpSuLD3/7RenBnjnJdOHXCKC8dTd1JzeOiJhN0necWWci6cC+qX+VuwPnMVgb+a4+KNJSfgqahpnfWaeDXCimw==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/linebreak": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/linebreak/-/linebreak-1.1.0.tgz",
      "integrity": "sha512-MHp03UImeVhB7XZtjd0E4n6+3xr5Dq/9xI/5FptGk5FrbDR3zagPa2DS6U8ks/3HjbKWG9Q1M2ufOzxV2qLYSQ==",
      "license": "MIT",
      "dependencies": {
        "base64-js": "0.0.8",
        "unicode-trie": "^2.0.0"
      }
    },
    "node_modules/linebreak/node_modules/base64-js": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-0.0.8.tgz",
      "integrity": "sha512-3XSA2cR/h/73EzlXXdU6YNycmYI7+kicTxks4eJg2g39biHR84slg2+des+p7iHYhbRg/udIS4TD53WabcOUkw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/locate-path": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-5.0.0.tgz",
      "integrity": "sha512-t7hw9pI+WvuwNJXwk5zVHpyhIqzg2qTlklJOf0mVxGSbe3Fp2VieZcduNYjaLDoy6p9uGpQEGWG87WpMKlNq8g==",
      "license": "MIT",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-1.1.0.tgz",
      "integrity": "sha512-aisnrDP4GNe06UcKFnV5bfMNPBUw4jsLGaWwWfnH3v02GnBuXX2MCVn5RbrWo0j3pczUilYblq7fQ7Nw2t5XKw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/memory-pager": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/memory-pager/-/memory-pager-1.5.0.tgz",
      "integrity": "sha512-ZS4Bp4r/Zoeq6+NLJpP+0Zzm0pR8whtGPf1XExKLJBAczGMnSi3It14OiNCStjQjM6NU1okjQGSxgEZN8eBYKg==",
      "license": "MIT"
    },
    "node_modules/merge-descriptors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-2.0.0.tgz",
      "integrity": "sha512-Snk314V5ayFLhp3fkUREub6WtjBfPdCPY1Ln8/8munuLuiYhsABgBVWsozAG+MWMbVEvcdcpbi9R7ww22l9Q3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mime-db": {
      "version": "1.54.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.54.0.tgz",
      "integrity": "sha512-aU5EJuIN2WDemCcAp2vFBfp/m4EAhWJnUNSSw0ixs7/kXbd6Pg64EmwJkNdFhB8aWt1sH2CTXrLxo/iAGV3oPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-3.0.2.tgz",
      "integrity": "sha512-Lbgzdk0h4juoQ9fCKXW4by0UJqj+nOOrI9MJ1sSj4nI8aI2eo1qmvQEie4VD1glsS250n15LsWsYtCugiStS5A==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "^1.54.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/mongodb": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/mongodb/-/mongodb-7.2.0.tgz",
      "integrity": "sha512-F/2+BMZtLVhY30ioZp0dAmZ+IRZMBqI+nrv6t5+9/1AIwCa8sMRC3jBf81lpxMhnZgqq8CoUD503Z1oZWq1/sw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@mongodb-js/saslprep": "^1.3.0",
        "bson": "^7.2.0",
        "mongodb-connection-string-url": "^7.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "peerDependencies": {
        "@aws-sdk/credential-providers": "^3.806.0",
        "@mongodb-js/zstd": "^7.0.0",
        "gcp-metadata": "^7.0.1",
        "kerberos": "^7.0.0",
        "mongodb-client-encryption": ">=7.0.0 <7.1.0",
        "snappy": "^7.3.2",
        "socks": "^2.8.6"
      },
      "peerDependenciesMeta": {
        "@aws-sdk/credential-providers": {
          "optional": true
        },
        "@mongodb-js/zstd": {
          "optional": true
        },
        "gcp-metadata": {
          "optional": true
        },
        "kerberos": {
          "optional": true
        },
        "mongodb-client-encryption": {
          "optional": true
        },
        "snappy": {
          "optional": true
        },
        "socks": {
          "optional": true
        }
      }
    },
    "node_modules/mongodb-connection-string-url": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/mongodb-connection-string-url/-/mongodb-connection-string-url-7.0.1.tgz",
      "integrity": "sha512-h0AZ9A7IDVwwHyMxmdMXKy+9oNlF0zFoahHiX3vQ8e3KFcSP3VmsmfvtRSuLPxmyv2vjIDxqty8smTgie/SNRQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@types/whatwg-url": "^13.0.0",
        "whatwg-url": "^14.1.0"
      },
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/mongoose": {
      "version": "9.7.3",
      "resolved": "https://registry.npmjs.org/mongoose/-/mongoose-9.7.3.tgz",
      "integrity": "sha512-9DsD4sq0tL9IKyfttZ6qn74KXBcD4lxDTzGXoAeOLMnDFFp1gqc5oc4s2BiMPbetJrLwvVylfyR4cqLst2pasQ==",
      "license": "MIT",
      "dependencies": {
        "@standard-schema/spec": "^1.1.0",
        "kareem": "3.3.0",
        "mongodb": "~7.2",
        "mpath": "0.9.0",
        "mquery": "6.0.0",
        "ms": "2.1.3",
        "sift": "17.1.3"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/mongoose"
      }
    },
    "node_modules/mpath": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/mpath/-/mpath-0.9.0.tgz",
      "integrity": "sha512-ikJRQTk8hw5DEoFVxHG1Gn9T/xcjtdnOKIU1JTmGjZZlg9LST2mBLmcX3/ICIbgJydT2GOc15RnNy5mHmzfSew==",
      "license": "MIT",
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/mquery": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/mquery/-/mquery-6.0.0.tgz",
      "integrity": "sha512-b2KQNsmgtkscfeDgkYMcWGn9vZI9YoXh802VDEwE6qc50zxBFQ0Oo8ROkawbPAsXCY1/Z1yp0MagqsZStPWJjw==",
      "license": "MIT",
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/negotiator": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-1.0.0.tgz",
      "integrity": "sha512-8Ofs/AUQh8MaEcrlq5xOX0CQ9ypTF5dl78mjlMNfOK08fzpgTHQRQPBxcPlEtIw0yRpws+Zo/3r+5WRby7u3Gg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/node-addon-api": {
      "version": "8.9.0",
      "resolved": "https://registry.npmjs.org/node-addon-api/-/node-addon-api-8.9.0.tgz",
      "integrity": "sha512-ekZMeaaIzSQTSpr7X2X3iJM7lTzgnx8ahAG9pJfT/7+14mlEM8ZYQ9cgCDvSSRbReFK0oHli3WrZdCiRsgAT9Q==",
      "license": "MIT",
      "engines": {
        "node": "^18 || ^20 || >= 21"
      }
    },
    "node_modules/node-gyp-build": {
      "version": "4.8.4",
      "resolved": "https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-4.8.4.tgz",
      "integrity": "sha512-LA4ZjwlnUblHVgq0oBF3Jl/6h/Nvs5fzBLwdEF4nuxnFdsfajde4WfxtJr3CaiH+F6ewcIB/q4jQ4UzPyid+CQ==",
      "license": "MIT",
      "bin": {
        "node-gyp-build": "bin.js",
        "node-gyp-build-optional": "optional.js",
        "node-gyp-build-test": "build-test.js"
      }
    },
    "node_modules/nodemailer": {
      "version": "9.0.5",
      "resolved": "https://registry.npmjs.org/nodemailer/-/nodemailer-9.0.5.tgz",
      "integrity": "sha512-wvjiKvjczmsN7U/8006JOdXubgBk2XFAbioDMbT+sM7cPs0QrhJTa6KBRX7P5REGGkDcLUz/EarWidb8G8C1jQ==",
      "license": "MIT-0",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
      "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/p-limit": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-2.3.0.tgz",
      "integrity": "sha512-//88mFWSJx8lxCzwdAABTJL2MyWB12+eIY7MDL2SqLmAkeKU9qxRvWuSyTjm3FUmpBEMuFfckAIqEaVGUDxb6w==",
      "license": "MIT",
      "dependencies": {
        "p-try": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-4.1.0.tgz",
      "integrity": "sha512-R79ZZ/0wAxKGu3oYMlz8jy/kbhsNrS7SKZ7PxEHBgJ5+F2mtFW2fK2cOtBh1cHYkQsbzFV7I+EoRKe6Yt0oK7A==",
      "license": "MIT",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/p-try": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/p-try/-/p-try-2.2.0.tgz",
      "integrity": "sha512-R4nPAVTAU0B9D35/Gk3uJf/7XYbQcyohSKdvAxIRSNghFl4e71hVoGnBNQz9cWaXxO2I10KTC+3jMdvvoKw6dQ==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/pako": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/pako/-/pako-1.0.11.tgz",
      "integrity": "sha512-4hLB8Py4zZce5s4yd9XzopqwVv/yGNhV1Bl8NTmCq1763HeK2+EwVTv+leGeL13Dnh2wfbqowVPXCIO0z4taYw==",
      "license": "(MIT AND Zlib)"
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "8.4.2",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-8.4.2.tgz",
      "integrity": "sha512-qRcuIdP69NPm4qbACK+aDogI5CBDMi1jKe0ry5rSQJz8JVLsC7jV8XpiJjGRLLol3N+R5ihGYcrPLTno6pAdBA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/pdfkit": {
      "version": "0.19.1",
      "resolved": "https://registry.npmjs.org/pdfkit/-/pdfkit-0.19.1.tgz",
      "integrity": "sha512-6Gzk+wDwTs4VSxsR5rCMTnIl5nlmkye1oWB0l2hDB1EX6ZNSIBroKQEv+2+fPPn+stVjyqzmsqRJVDfB9fo5DA==",
      "license": "MIT",
      "dependencies": {
        "@noble/ciphers": "^1.0.0",
        "@noble/hashes": "^1.6.0",
        "fontkit": "^2.0.4",
        "js-md5": "^0.8.3",
        "linebreak": "^1.1.0",
        "png-js": "^1.1.0"
      }
    },
    "node_modules/png-js": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/png-js/-/png-js-1.1.0.tgz",
      "integrity": "sha512-PM/uYGzGdNSzqeOgly68+6wKQDL1SY0a/N+OEa/+br6LnHWOAJB0Npiamnodfq3jd2LS/i2fMeOKSAILjA+m5Q==",
      "dependencies": {
        "browserify-zlib": "^0.2.0"
      }
    },
    "node_modules/pngjs": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/pngjs/-/pngjs-5.0.0.tgz",
      "integrity": "sha512-40QW5YalBNfQo5yRYmiw7Yz6TKKVr3h6970B2YE+3fQpsWcrbj1PzJgxeJ19DRQjhMbKPIuMY8rFaXc8moolVw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/proxy-addr": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.7.tgz",
      "integrity": "sha512-llQsMLSUDUPT44jdrU/O37qlnifitDP+ZwrmmZcoSKyLKvtZxpyV0n2/bD/N4tBAAZ/gJEdZU7KMraoK1+XYAg==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/qrcode": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/qrcode/-/qrcode-1.5.4.tgz",
      "integrity": "sha512-1ca71Zgiu6ORjHqFBDpnSMTR2ReToX4l1Au1VFLyVeBTFavzQnv5JxMFr3ukHVKpSrSA2MCk0lNJSykjUfz7Zg==",
      "license": "MIT",
      "dependencies": {
        "dijkstrajs": "^1.0.1",
        "pngjs": "^5.0.0",
        "yargs": "^15.3.1"
      },
      "bin": {
        "qrcode": "bin/qrcode"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/qs": {
      "version": "6.15.3",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.15.3.tgz",
      "integrity": "sha512-O9gl3zCl5h5blw1KGUzQKhA5oUXSl8rwUIM5o0S3nCXMliSvy5Dzx7/DJcI+SwgICv+IneSZwhBh1oSyEHA71A==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "es-define-property": "^1.0.1",
        "side-channel": "^1.1.1"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/range-parser": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.3.0.tgz",
      "integrity": "sha512-hek2mFQpPuI4E1BBKrSto+BU3e3x4xuarsbiwr3+lf7p44juvFMV0XFWQAP3xUyqXA4RrXLIoaSUGbSt056ZMw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/raw-body": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-3.0.2.tgz",
      "integrity": "sha512-K5zQjDllxWkf7Z5xJdV0/B0WTNqx6vxG70zJE4N0kBs4LovmEYWJzQGxC9bS9RAKu3bgM40lrd5zoLJ12MQ5BA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.7.0",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz",
      "integrity": "sha512-fGxEI7+wsG9xrvdjsrlmL22OMTTiHRwAMroiEeMgq8gzoLC/PQr7RsRDSTLUg/bZAZtF+TVIkHc6/4RIKrui+Q==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/require-main-filename": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/require-main-filename/-/require-main-filename-2.0.0.tgz",
      "integrity": "sha512-NKN5kMDylKuldxYLSUfrbo5Tuzh4hd+2E8NPPX02mZtn1VuREQToYe/ZdlJy+J3uCpfaiGF05e7B8W0iXbQHmg==",
      "license": "ISC"
    },
    "node_modules/restructure": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/restructure/-/restructure-3.0.2.tgz",
      "integrity": "sha512-gSfoiOEA0VPE6Tukkrr7I0RBdE0s7H1eFCDBk05l1KIQT1UIKNc5JZy6jdyW6eYH3aR3g5b3PuL77rq0hvwtAw==",
      "license": "MIT"
    },
    "node_modules/router": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/router/-/router-2.2.0.tgz",
      "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "is-promise": "^4.0.0",
        "parseurl": "^1.3.3",
        "path-to-regexp": "^8.0.0"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/send": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/send/-/send-1.2.1.tgz",
      "integrity": "sha512-1gnZf7DFcoIcajTjTwjwuDjzuz4PPcY2StKPlsGAQ1+YH20IRVrBaXSWmdjowTJ6u8Rc01PoYOGHXfP1mYcZNQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.3",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.1",
        "mime-types": "^3.0.2",
        "ms": "^2.1.3",
        "on-finished": "^2.4.1",
        "range-parser": "^1.2.1",
        "statuses": "^2.0.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/serve-static": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-2.2.1.tgz",
      "integrity": "sha512-xRXBn0pPqQTVQiC8wyQrKs2MOlX24zQ0POGaj0kultvoOCstBQM5yvOhAVSUwOMjQtTvsPWoNCHfPGwaaQJhTw==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "parseurl": "^1.3.3",
        "send": "^1.2.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/set-blocking": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/set-blocking/-/set-blocking-2.0.0.tgz",
      "integrity": "sha512-KiKBS8AnWGEyLzofFfmvKwpdPzqiy16LvQfK3yv/fVH7Bj13/wl3JSR1J+rfgRE9q7xUJK4qvgS8raSOeLUehw==",
      "license": "ISC"
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/sift": {
      "version": "17.1.3",
      "resolved": "https://registry.npmjs.org/sift/-/sift-17.1.3.tgz",
      "integrity": "sha512-Rtlj66/b0ICeFzYTuNvX/EF1igRbbnGSvEyT79McoZa/DeGhMyC5pWKOEsZKnpkqtSeovd5FL/bjHWC3CIIvCQ==",
      "license": "MIT"
    },
    "node_modules/sparse-bitfield": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/sparse-bitfield/-/sparse-bitfield-3.0.3.tgz",
      "integrity": "sha512-kvzhi7vqKTfkh0PZU+2D2PIllw2ymqJKujUcyPMd9Y75Nv4nPbGJZXNhxsgdQab2BmlDct1YnfQCguEvHr7VsQ==",
      "license": "MIT",
      "dependencies": {
        "memory-pager": "^1.0.2"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/tiny-inflate": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/tiny-inflate/-/tiny-inflate-1.0.3.tgz",
      "integrity": "sha512-pkY1fj1cKHb2seWDy0B16HeWyczlJA9/WW3u3c4z/NiWDsO3DOU5D7nhTLE9CF0yXv/QZFY7sEJmj24dK+Rrqw==",
      "license": "MIT"
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/tr46": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-5.1.1.tgz",
      "integrity": "sha512-hdF5ZgjTqgAntKkklYw0R03MG2x/bSzTtkxmIRw/sTNV8YXsCJ1tfLAX23lhxhHJlEf3CRCOCGGWw3vI3GaSPw==",
      "license": "MIT",
      "dependencies": {
        "punycode": "^2.3.1"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/type-is": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-2.1.0.tgz",
      "integrity": "sha512-faYHw0anBbc/kWF3zFTEnxSFOAGUX9GFbOBthvDdLsIlEoWOFOtS0zgCiQYwIskL9iGXZL3kAXD8OoZ4GmMATA==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^2.0.0",
        "media-typer": "^1.1.0",
        "mime-types": "^3.0.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/type-is/node_modules/content-type": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.0.0.tgz",
      "integrity": "sha512-j/O/d7GcZCyNl7/hwZAb606rzqkyvaDctLmckbxLzHvFBzTJHuGEdodATcP3yIRoDrLHkIATJuvzbFlp/ki2cQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/unicode-properties": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/unicode-properties/-/unicode-properties-1.4.1.tgz",
      "integrity": "sha512-CLjCCLQ6UuMxWnbIylkisbRj31qxHPAurvena/0iwSVbQ2G1VY5/HjV0IRabOEbDHlzZlRdCrD4NhB0JtU40Pg==",
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.3.0",
        "unicode-trie": "^2.0.0"
      }
    },
    "node_modules/unicode-trie": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-trie/-/unicode-trie-2.0.0.tgz",
      "integrity": "sha512-x7bc76x0bm4prf1VLg79uhAzKw8DVboClSN5VxJuQ+LKDOVEW9CdH+VY7SP+vX7xCYQqzzgQpFqz15zeLvAtZQ==",
      "license": "MIT",
      "dependencies": {
        "pako": "^0.2.5",
        "tiny-inflate": "^1.0.0"
      }
    },
    "node_modules/unicode-trie/node_modules/pako": {
      "version": "0.2.9",
      "resolved": "https://registry.npmjs.org/pako/-/pako-0.2.9.tgz",
      "integrity": "sha512-NUcwaKxUxWrZLpDG+z/xZaCgQITkA/Dv4V/T6bw7VON6l1Xz/VnrBqrYjZQ12TamKHzITTfOEIYUj48y2KXImA==",
      "license": "MIT"
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/validator": {
      "version": "13.15.35",
      "resolved": "https://registry.npmjs.org/validator/-/validator-13.15.35.tgz",
      "integrity": "sha512-TQ5pAGhd5whStmqWvYF4OjQROlmv9SMFVt37qoCBdqRffuuklWYQlCNnEs2ZaIBD1kZRNnikiZOS1eqgkar0iw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/webidl-conversions": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/whatwg-url": {
      "version": "14.2.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-14.2.0.tgz",
      "integrity": "sha512-De72GdQZzNTUBBChsXueQUnPKDkg/5A5zp7pFDuQAj5UFoENpiACU0wlCvzpAGnTkj++ihpKwKyYewn/XNUbKw==",
      "license": "MIT",
      "dependencies": {
        "tr46": "^5.1.0",
        "webidl-conversions": "^7.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/which-module": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/which-module/-/which-module-2.0.1.tgz",
      "integrity": "sha512-iBdZ57RDvnOR9AGBhML2vFZf7h8vmBjhoaZqODJBFWHVtKkDmKuHai3cx5PgVMrX5YDNp27AofYbAwctSS+vhQ==",
      "license": "ISC"
    },
    "node_modules/wrap-ansi": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-6.2.0.tgz",
      "integrity": "sha512-r6lPcBGxZXlIcymEu7InxDMhdW0KDxpLgoFLcguasxCaJ/SOIZwINatK9KY/tf+ZrlywOKU0UDj3ATXUBfxJXA==",
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC"
    },
    "node_modules/y18n": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-4.0.3.tgz",
      "integrity": "sha512-JKhqTOwSrqNA1NY5lSztJ1GrBiUodLMmIZuLiDaMRJ+itFd+ABVE8XBjOvIWL+rSqNDC74LCSFmlb/U4UZ4hJQ==",
      "license": "ISC"
    },
    "node_modules/yargs": {
      "version": "15.4.1",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-15.4.1.tgz",
      "integrity": "sha512-aePbxDmcYW++PaqBsJ+HYUFwCdv4LVvdnhBy78E57PIor8/OVvhMrADFFEDh8DHDFRv/O9i3lPhsENjO7QX0+A==",
      "license": "MIT",
      "dependencies": {
        "cliui": "^6.0.0",
        "decamelize": "^1.2.0",
        "find-up": "^4.1.0",
        "get-caller-file": "^2.0.1",
        "require-directory": "^2.1.1",
        "require-main-filename": "^2.0.0",
        "set-blocking": "^2.0.0",
        "string-width": "^4.2.0",
        "which-module": "^2.0.0",
        "y18n": "^4.0.0",
        "yargs-parser": "^18.1.2"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/yargs-parser": {
      "version": "18.1.3",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-18.1.3.tgz",
      "integrity": "sha512-o50j0JeToy/4K6OZcaQmW6lyXXKhq7csREXcDwk2omFPJEwUNOVtJKvmDr9EI1fAJZUyZcRF7kxGBWmRXudrCQ==",
      "license": "ISC",
      "dependencies": {
        "camelcase": "^5.0.0",
        "decamelize": "^1.2.0"
      },
      "engines": {
        "node": ">=6"
      }
    }
  }
}

```

## backend/package.json

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.7.3",
    "nodemailer": "^9.0.5",
    "pdfkit": "^0.19.1",
    "qrcode": "^1.5.4",
    "validator": "^13.15.35"
  }
}

```

## backend/routes/appointment.js

```javascript
const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const {requestAppointment, updateAppointmentStatus, getPendingAppointment} = require('../controller/appointmentController')


const appointmentRouter = express.Router()
appointmentRouter.use(requireAuth)

/**
 * Route:       /api/appointments/
 * Method:      POST
 * Description: Create a new appointment
 * Access:      Protected 
 * Parameters:  None
 */
appointmentRouter.post('/', requireRole('Admin', 'Security'), requestAppointment)

/**
 * Route:       /api/appointments/:id
 * Method:      PATCH
 * Description: Update appointment status
 * Access:      Protected 
 * Parameters:  ID
 */
appointmentRouter.patch('/:id', requireRole('Admin', 'Employee'), updateAppointmentStatus)

/**
 * Route:       /api/appointments/pending
 * Method:      GET
 * Description: Get all pending appointment
 * Access:      Protected (Admin/Host)
 * Parameters:  None
 */
appointmentRouter.get('/pending', requireRole('Admin'), getPendingAppointment)

module.exports = appointmentRouter
```

## backend/routes/checklog.js

```javascript
const express = require('express')
const auth = require('../middleware/requireAuth')
const {checkIn, checkOut, getAllLogs} = require('../controller/checklogController')
const requireRole = require('../middleware/requireRole')
const logRoutes = express.Router()
logRoutes.use(auth)

/**
 * Route:       /api/logs/all
 * Method:      GET
 * Description: Get all check logs deeply populated
 * Access:      Protected
 * Parameters:  None
 */
logRoutes.get('/all', requireRole('Admin', 'Security'), getAllLogs)

/**
 * Route:       /api/logs/
 * Method:      POST
 * Description: Create a new log with check in time
 * Access:      Protected 
 * Parameters:  None
 */
logRoutes.post('/check-in',requireRole('Admin', 'Security'), checkIn)

/**
 * Route:       /api/logs/
 * Method:      PATCH
 * Description: Update check-Out time
 * Access:      Protected 
 * Parameters:  ID
 */
logRoutes.patch('/check-out', requireRole('Admin', 'Security'), checkOut)

module.exports = logRoutes
```

## backend/routes/pass.js

```javascript
const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const {generatePass, getPasses} = require('../controller/passController')
const requireRole = require('../middleware/requireRole')
const passRouter = express.Router()
passRouter.use(requireAuth)

/**
 * Route:       /api/passes/
 * Method:      POST
 * Description: Create new passes
 * Access:      Protected 
 * Parameters:  None
 */
passRouter.post('/', requireRole('Admin', 'Employee'), generatePass)

/**
 * Route:       /api/passes/
 * Method:      GET
 * Description: Get all passes
 * Access:      Protected 
 * Parameters:  None
 */
passRouter.get('/', requireRole('Admin', 'Security'), getPasses)

module.exports = passRouter
```

## backend/routes/user.js

```javascript
const express = require('express')
const router = express.Router()
const {loginUser, signupUser} = require('../controller/userController')

router.post('/login', loginUser)
router.post('/signup', signupUser)

module.exports = router
```

## backend/routes/visitor.js

```javascript
// importing stuff
const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const {registerVisitor, getVisitors, getVisitor} = require('../controller/visitorController')
const requireRole = require('../middleware/requireRole')
const router = express.Router()

// for protecting all the routes
router.use(requireAuth)

/**
 * Route:       /api/visitors/
 * Method:      POST
 * Description: Register new visitors
 * Access:      Protected 
 * Parameters:  None
 */
router.post('/', requireRole('Admin','Security'), registerVisitor)

/**
 * Route:       /api/visitors/
 * Method:      GET
 * Description: Get all visitors
 * Access:      Protected 
 * Parameters:  None
 */
router.get('/', getVisitors)


/**
 * Route:       /api/visitors/:id
 * Method:      GET
 * Description: Get a single visitor by it's id
 * Access:      Protected 
 * Parameters:  id
 */
router.get('/:id',getVisitor)

module.exports = router
```

## backend/seed.js

```javascript
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const QRCode = require('qrcode')
const PDFDocument = require('pdfkit')

dotenv.config()

const User = require('./models/userModel')
const Visitor = require('./models/visitorModel')
const Appointment = require('./models/appointmentModel')
const Pass = require('./models/passModel')
const CheckLog = require('./models/checklogModel')

const generatePDFBase64 = (visitor, validUntil, qrCodeDataUrl) => {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: [250, 400], margin: 0 })
        const buffers = []

        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers)
            resolve(`data:application/pdf;base64,${pdfData.toString('base64')}`)
        })
        doc.rect(0, 0, 250, 60).fill('#1e3a8a')
        doc.fillColor('#ffffff').fontSize(16).text('VISITOR PASS', 0, 22, { align: 'center' })

        doc.fillColor('#111827').fontSize(18).text(visitor.name, 0, 90, { align: 'center' })
        doc.fillColor('#6b7280').fontSize(12).text(visitor.purpose, { align: 'center' })

        const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
        doc.image(qrImageBuffer, 50, 150, { width: 150 })

        doc.fillColor('#6b7280').fontSize(10).text('Valid Until:', 0, 320, { align: 'center' })
        doc.fillColor('#1e3a8a').fontSize(12).text(new Date(validUntil).toLocaleString(), { align: 'center' })

        doc.end()
    })
}

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB Connected successfully!\n')

        // 1. Create or retrieve Users (1 Admin, 1 Security Guard, 1 Host Employee)
        console.log('1. Seeding Users...')
        let adminUser = await User.findOne({ email: 'admin@vpms.com' })
        if (!adminUser) {
            adminUser = await User.signup('admin@vpms.com', 'System Admin', 'Admin', 'Admin@123456')
            console.log('  Created Admin User: admin@vpms.com / Admin@123456')
        } else {
            console.log('   ℹAdmin User already exists: admin@vpms.com')
        }

        let guardUser = await User.findOne({ email: 'guard@vpms.com' })
        if (!guardUser) {
            guardUser = await User.signup('guard@vpms.com', 'Main Gate Guard', 'Security', 'Guard@123456')
            console.log('Created Security Guard: guard@vpms.com / Guard@123456')
        } else {
            console.log(' Security Guard already exists: guard@vpms.com')
        }

        let hostUser = await User.findOne({ email: 'host@vpms.com' })
        if (!hostUser) {
            hostUser = await User.signup('host@vpms.com', 'Sarah Connor (HR Lead)', 'Employee', 'Host@123456')
            console.log('Created Host Employee: host@vpms.com / Host@123456')
        } else {
            console.log('  Host Employee already exists: host@vpms.com')
        }

        // 2. Sample Visitors
        console.log('\n2. Seeding 5 Visitors...')
        const timestamp = Date.now()
        const sampleVisitors = [
            {
                name: 'Alex Johnson',
                email: `alex.johnson.${timestamp}@example.com`,
                phone: '+1 555-0101',
                purpose: 'Technical Interview',
                photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            },
            {
                name: 'Elena Rostova',
                email: `elena.rostova.${timestamp}@example.com`,
                phone: '+1 555-0102',
                purpose: 'Business Meeting',
                photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
            },
            {
                name: 'Marcus Vance',
                email: `marcus.vance.${timestamp}@example.com`,
                phone: '+1 555-0103',
                purpose: 'Vendor / Supplier',
                photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
            },
            {
                name: 'Priya Sharma',
                email: `priya.sharma.${timestamp}@example.com`,
                phone: '+1 555-0104',
                purpose: 'Official Audit / Inspection',
                photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
            },
            {
                name: 'David Kim',
                email: `david.kim.${timestamp}@example.com`,
                phone: '+1 555-0105',
                purpose: 'Maintenance & Repair',
                photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
            }
        ]

        const createdVisitors = await Visitor.insertMany(sampleVisitors)
        console.log(`Seeded ${createdVisitors.length} visitors.`)

        // 3. Appointments, Passes, and CheckLogs
        console.log('\n3. Seeding Appointments, Passes & 5 CheckLogs...')
        for (let i = 0; i < createdVisitors.length; i++) {
            const visitor = createdVisitors[i]

            // 3a. Appointment
            const appointment = await Appointment.create({
                visitorId: visitor._id,
                hostId: hostUser._id,
                status: 'Approved',
                dateTime: new Date(Date.now() - (i + 1) * 3600000)
            })

            // 3b. Pass
            const qrData = JSON.stringify({ appointmentId: appointment._id })
            const qrCode = await QRCode.toDataURL(qrData)
            const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)
            const pdfUrl = await generatePDFBase64(visitor, validUntil, qrCode)

            // 3 checked out, 2 currently inside/on-site
            const isCheckedOut = i < 3
            const passStatus = isCheckedOut ? 'Checked Out' : 'Checked In'

            const pass = await Pass.create({
                appointmentId: appointment._id,
                qrCode,
                pdfUrl,
                validUntil,
                status: passStatus
            })

            // 3c. CheckLog
            const checkInTime = new Date(Date.now() - (i + 2) * 3600000)
            const checkOutTime = isCheckedOut ? new Date(Date.now() - (i + 1) * 1800000) : null

            await CheckLog.create({
                passId: pass._id,
                guardId: guardUser._id,
                checkIn: checkInTime,
                checkOut: checkOutTime
            })

            console.log(`   [Log ${i + 1}/5] ${visitor.name} -> Check-In: ${checkInTime.toLocaleTimeString()} | Status: ${isCheckedOut ? 'Checked Out' : 'Currently On-Site'}`)
        }

        console.log('\nDatabase seeding completed successfully!')
        console.log('==================================================')
        console.log('Default Seed Logins:')
        console.log('  Admin Account:    admin@vpms.com   | Admin@123456')
        console.log('  Guard Account:    guard@vpms.com   | Guard@123456')
        console.log('  Host Account:     host@vpms.com    | Host@123456')
        console.log('==================================================\n')

        await mongoose.disconnect()
        process.exit(0)
    } catch (err) {
        console.error('Error while seeding database:', err)
        await mongoose.disconnect()
        process.exit(1)
    }
}

seedDatabase()

```

## backend/server.js

```javascript
// importing required modules
const express = require("express");
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const passRoutes = require('./routes/pass')
const userRoutes = require('./routes/user')
const logsRoutes = require('./routes/checklog')
const visitorRoutes = require('./routes/visitor')
const appointmentRoutes = require('./routes/appointment')

// configuring dotenv and initializing express app
dotenv.config()
const app = express()

// middleware
app.use(express.json())
app.use(cors())

// routes
app.use('/api/logs', logsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/passes', passRoutes)
app.use('/api/visitors', visitorRoutes)
app.use('/api/appointments', appointmentRoutes)

app.get('/', (req,res) =>{
    res.json({
        msg: "It's Live!"
    })
})

const PORT = process.env.PORT

mongoose.connect(process.env.MONGO_URI).then(
    ()=>{
        app.listen((PORT), ()=>{
            console.log(`Server is up and listening at: http://localhost:${PORT}`);
            console.log(`Database is connected successfully`);
        })
    }
)
.catch((error)=>{console.log(error)})
```

