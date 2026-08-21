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