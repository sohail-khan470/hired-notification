const nodemailer = require("nodemailer");
const config = require("./config");

const transporter = nodemailer.createTransporter({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: config.SENDER_EMAIL,
    pass: config.SENDER_EMAIL_PASSWORD,
  },
});

module.exports = transporter;
