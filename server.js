const express = require("express");
const logger = require("./src/utils/logger");
const config = require("./src/utils/config");
const rabbitMQ = require("./src/utils/rabbitmq");
const {
  consumeAuthEmailMessages,
  consumeOrderEmailMessages,
} = require("./src/email-consumer/email-consumer");

const app = express();
const PORT = config.PORT || 4101;

/**
 * Initialize RabbitMQ and start consumers
 */
async function startQueues() {
  try {
    await rabbitMQ.connect();

    await rabbitMQ.createExchange("jobber-email-notification", "direct");
    await rabbitMQ.createExchange("order-email-notification", "direct");

    await rabbitMQ.createQueue("auth-email-queue");
    await rabbitMQ.createQueue("order-email-queue");

    await rabbitMQ.bindQueue(
      "auth-email-queue",
      "jobber-email-notification",
      "auth-email"
    );

    await rabbitMQ.bindQueue(
      "order-email-queue",
      "order-email-notification",
      "order-email"
    );

    const data = {
      to: "sohailturk470@gmail.com",
      subject: "This is another email",
      html: "<h1>This is confirmation</h1>",
    };

    rabbitMQ.publish("order-email-notification", "order-email", data);

    consumeAuthEmailMessages();
    consumeOrderEmailMessages();

    logger.info("✅ RabbitMQ consumers started successfully");
  } catch (error) {
    logger.error("❌ Failed to initialize RabbitMQ", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    response: "Notification Service is up and running",
    status: "OK",
  });
});

// Start everything
startQueues();

app.listen(PORT, () => {
  logger.info(`🚀 Notification service is running on port ${PORT}`);
});
