const logger = require("../utils/logger");
const rabbitMQ = require("../utils/rabbitmq");
const transporter = require("../utils/mail-transport");
const { renderTemplate } = require("../utils/template-renderer");
const { AUTH_EMAIL_QUEUE, ORDER_EMAIL_QUEUE } = require("../constants");
const config = require("../utils/config");

/**
 * Render email content based on template or raw html/subject
 */
const getEmailContent = async (messageData) => {
  if (messageData.template) {
    const rendered = await renderTemplate(
      messageData.template,
      messageData.data || {},
    );

    return {
      subject: rendered.subject,
      html: rendered.html,
    };
  }

  return {
    subject: messageData.subject,
    html: messageData.html,
  };
};

/**
 * ============================
 * AUTH EMAIL CONSUMER
 * ============================
 */
const consumeAuthEmailMessages = () => {
  rabbitMQ.consume(AUTH_EMAIL_QUEUE, async (messageData) => {
    try {
      logger.info("📧 Sending auth email:", messageData);

      if (messageData.type !== "EMAIL_VERIFY") {
        logger.warn("⚠️ Unknown auth email type:", messageData.type);
        return;
      }

      const verificationLink = `${config.CLIENT_URL}/verify-email?token=${messageData.emailVerificationToken}`;

      const enrichedMessage = {
        ...messageData,
        data: {
          ...messageData.data,
          verificationLink,
        },
      };

      const content = await getEmailContent(enrichedMessage);

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: enrichedMessage.to,
        subject: content.subject,
        html: content.html,
      });

      logger.info("✅ Verification email sent");
    } catch (error) {
      logger.error("❌ Error sending verification email:", error);
      throw error;
    }
  });
};

/**
 * ============================
 * ORDER EMAIL CONSUMER
 * ============================
 */
const consumeOrderEmailMessages = () => {
  rabbitMQ.consume(ORDER_EMAIL_QUEUE, async (messageData) => {
    try {
      logger.info("📦 Order email received");

      const content = await getEmailContent(messageData);

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: messageData.to,
        subject: content.subject,
        html: content.html,
      });

      logger.info("✅ Order email sent successfully");
    } catch (error) {
      logger.error("❌ Error sending order email:", error);
      throw error;
    }
  });
};

module.exports = {
  consumeAuthEmailMessages,
  consumeOrderEmailMessages,
};
