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
