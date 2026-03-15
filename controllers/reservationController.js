const sendReservationEmails = require('../configs/emailService');

exports.createReservation = async (req, res) => {
    try {
        // Hum direct request body se data le rahe hain bina DB use kiye
        const customerData = {
            name: req.body.name,
            email: req.body.email,
            date: req.body.date,
            time: req.body.time,
            guests: req.body.guests,
            restaurantName: "Khim Asia Cuisine"
        };

        // Email bhejein
        await sendReservationEmails(customerData);

        res.status(200).json({ success: true, message: "Reservation emails sent!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};