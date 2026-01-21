const express = require("express");
const logger = require("./src/utils/logger");
const config = require("./src/utils/config");
const rabbitMQ = require("./src/utils/rabbitmq");
const {
  consumeAuthEmailMessages,
  consumeOrderEmailMessages,
} = require("./src/email-consumer/email-consumer");
const {
  AUTH_EMAIL_QUEUE,
  ORDER_EMAIL_QUEUE,
  AUTH_EMAIL,
  ORDER_EMAIL,
} = require("./src/constants");

const app = express();
const PORT = config.PORT || 4101;

/**
 * Initialize RabbitMQ and start consumers
 */
async function startQueues() {
  try {
    await rabbitMQ.connect();

    await rabbitMQ.createExchange(config.RABBITMQ_EXCHANGE, "direct");

    await rabbitMQ.createQueue(AUTH_EMAIL_QUEUE);
    await rabbitMQ.createQueue(ORDER_EMAIL_QUEUE);

    await rabbitMQ.bindQueue(
      AUTH_EMAIL_QUEUE,
      config.RABBITMQ_EXCHANGE,
      AUTH_EMAIL,
    );

    await rabbitMQ.bindQueue(
      ORDER_EMAIL_QUEUE,
      config.RABBITMQ_EXCHANGE,
      ORDER_EMAIL,
    );

    const data = {
      to: "sohailturk470@gmail.com",
      subject: "This is another email",
      html: "<h1>This is confirmation</h1>",
    };

    rabbitMQ.publish(config.RABBITMQ_EXCHANGE, ORDER_EMAIL, data);

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
