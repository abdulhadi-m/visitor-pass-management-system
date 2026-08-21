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