// importing stuff
const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const {registerVisitor, getVisitors, getVisitor} = require('../controller/visitorController')
const router = express.Router()

const upload = require('../middleware/upload')

/**
 * Route:       /api/visitors/
 * Method:      POST
 * Description: Register new or returning visitors (Public / Reception portal)
 * Access:      Public
 * Parameters:  None
 */
router.post('/', upload.single('photo'), registerVisitor)

// Protect subsequent routes for authorized staff
router.use(requireAuth)

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
 * Description: Get a single visitor by its id
 * Access:      Protected 
 * Parameters:  id
 */
router.get('/:id', getVisitor)

module.exports = router