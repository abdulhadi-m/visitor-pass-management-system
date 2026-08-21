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
