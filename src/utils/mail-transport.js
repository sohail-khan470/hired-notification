const nodemailer = require("nodemailer");
const config = require("./config");

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: config.SENDER_EMAIL,
    pass: config.SENDER_EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail transporter verification failed:", error);
  } else {
    console.log("✅ Mail transporter is ready to send emails");
  }
});

module.exports = transporter;
