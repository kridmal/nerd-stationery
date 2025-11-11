const express = require('express');
const router = express.Router();
const { createPackage, getPackages } = require('../controllers/packageController');

// Create package
router.post('/', createPackage);

// Get all packages
router.get('/', getPackages);

module.exports = router;
