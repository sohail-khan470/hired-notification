const logger = require("../utils/logger");
const rabbitMQ = require("../utils/rabbitmq");
const transporter = require("../utils/mail-transport");
const { renderTemplate } = require("../utils/template-renderer");

/**
 * Render email content based on template or raw html/subject
 */
const getEmailContent = async (messageData) => {
  if (messageData.template) {
    const rendered = await renderTemplate(
      messageData.template,
      messageData.data || {}
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
 * Consume auth emails
 */
const consumeAuthEmailMessages = () => {
  rabbitMQ.consume("auth-email-queue", async (messageData) => {
    try {
      logger.info("📧 Sending auth email:", messageData);

      const content = await getEmailContent(messageData);

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: messageData.to,
        subject: content.subject,
        html: content.html,
      });

      logger.info("✅ Auth email sent successfully");
    } catch (error) {
      console.error("❌ Error sending auth email:", error);
      logger.error("❌ Error sending auth email:", error);
      throw error; // rabbitMQ.consume will nack automatically
    }
  });
};

/**
 * Consume order emails
 */
const consumeOrderEmailMessages = () => {
  rabbitMQ.consume("order-email-queue", async (messageData) => {
    try {
      logger.info("📦 Sending order email:", messageData);

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
      throw error; // rabbitMQ.consume will nack automatically
    }
  });
};

module.exports = { consumeAuthEmailMessages, consumeOrderEmailMessages };
