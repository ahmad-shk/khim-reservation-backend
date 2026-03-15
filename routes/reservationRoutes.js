const express = require('express');
const router = express.Router();
const { createReservation } = require('../controllers/reservationController');

// Jab koi POST request /api/reservation par aaye
router.post('/reservation', createReservation);

module.exports = router;