// importing required modules
const express = require("express");
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

const passRoutes = require('./routes/pass')
const userRoutes = require('./routes/user')
const logsRoutes = require('./routes/checklog')
const visitorRoutes = require('./routes/visitor')
const appointmentRoutes = require('./routes/appointment')

const path = require('path')

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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