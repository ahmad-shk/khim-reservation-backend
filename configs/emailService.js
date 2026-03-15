const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// -- CONFIGURATIONS --
const logoPath = path.join(__dirname, '../assets/logo.png'); 
const WHATSAPP_LINK = "https://wa.me/4347763178906";
const PRIMARY_COLOR = "#091C46"; 

const sendReservationEmails = async (customerData) => {
    // FIXED: Mapping 'person' from payload to 'guests' for the template
    const { name, email, date, time, person, restaurantName } = customerData;
    const guestsCount = person || "0"; 

    // --- DYNAMIC EXTRA FIELDS FOR ADMIN ---
    // FIXED: Added 'person' and 'guests' to mandatory to avoid duplication in extra details
    const mandatoryFields = ['name', 'email', 'date', 'time', 'person', 'guests', 'restaurantName'];
    let extraDetailsHtml = "";

    Object.keys(customerData).forEach(key => {
        if (!mandatoryFields.includes(key) && customerData[key]) {
            extraDetailsHtml += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-size: 14px;"><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong></td>
                    <td style="padding: 10px; border-bottom: 1px solid #eeeeee; font-size: 14px;">${customerData[key]}</td>
                </tr>`;
        }
    });

    // --- REUSABLE AESTHETIC LAYOUT ---
    const generateHtml = (title, greeting, message, showWhatsApp = false, isAdmin = false) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f7f7;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f7f7;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
                            <tr>
                                <td align="center" style="background-color: ${PRIMARY_COLOR}; padding: 30px 20px;">
                                    <img src="cid:logo_cid" alt="${restaurantName}" style="max-width: 130px; display: block;">
                                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 15px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">${title}</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px; color: #333333; line-height: 1.8;">
                                    <p style="font-size: 16px; margin: 0 0 15px 0;">${greeting}</p>
                                    <p style="font-size: 15px; margin: 0 0 20px 0;">${message}</p>
                                    
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-left: 4px solid ${PRIMARY_COLOR}; padding: 25px; margin: 20px 0; border-radius: 6px;">
                                        <tr><td width="40%" style="padding-bottom: 8px;">📅 <strong>Date:</strong></td><td style="padding-bottom: 8px;">${date}</td></tr>
                                        <tr><td style="padding-bottom: 8px;">⏰ <strong>Time:</strong></td><td style="padding-bottom: 8px;">${time}</td></tr>
                                        <tr><td style="padding-bottom: 8px;">👥 <strong>Guests:</strong></td><td style="padding-bottom: 8px;">${guestsCount} Person(s)</td></tr>
                                        ${isAdmin ? extraDetailsHtml : ""}
                                    </table>

                                    ${showWhatsApp ? `
                                    <div align="center" style="margin: 30px 0;">
                                        <a href="${WHATSAPP_LINK}" target="_blank" style="background-color: #25D366; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Contact us on WhatsApp</a>
                                    </div>` : ""}

                                    <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
                                    <p style="font-size: 12px; color: #777777; text-align: center; font-style: italic;">
                                        ${isAdmin ? "This is a system generated notification for a new booking request." : `Thank you for choosing ${restaurantName}. We look forward to seeing you!`}
                                    </p>
                                </td>
                            </tr>
                        </table>
                        <p style="text-align: center; color: #999999; font-size: 12px; margin-top: 20px;">
                            &copy; ${new Date().getFullYear()} ${restaurantName}. All rights reserved.
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>`;

    // --- EMAILS GENERATION ---
    const customerHtml = generateHtml(
        "Reservation Received",
        `Dear <strong>${name}</strong>,`,
        `We have received your reservation request for <strong>${restaurantName}</strong>. Our team is currently reviewing availability and will be in touch shortly.`,
        true, 
        false 
    );

    const adminHtml = generateHtml(
        "New Booking Alert",
        `Hello Admin,`,
        `A new reservation request has been submitted by <strong>${name}</strong> (${email}). Please review the details below:`,
        false, 
        true 
    );

    const attachments = [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo_cid'
    }];

    // --- SENDING EMAILS ---
    try {
        // Sending separately to ensure one failure doesn't block the other and for better logging
        await transporter.sendMail({
            from: `"${restaurantName}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Reservation Request: ${name} at ${restaurantName}`,
            html: customerHtml,
            attachments
        });
        console.log(`✅ Customer Email sent to: ${email}`);

        if (process.env.ADMIN_EMAIL) {
            await transporter.sendMail({
                from: `"${restaurantName}" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `New Booking Action Required: ${name}`,
                html: adminHtml,
                attachments
            });
            console.log("✅ Admin Email sent successfully.");
        } else {
            console.warn("⚠️ Admin Email not sent: ADMIN_EMAIL not defined in .env");
        }

    } catch (error) {
        console.error("❌ Error sending emails:", error);
        throw error;
    }
};

module.exports = sendReservationEmails;