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