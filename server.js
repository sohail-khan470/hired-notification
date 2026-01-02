const express = require("express");
const logger = require("./src/utils/logger");
const config = require("./src/utils/config");
const rabbitMQService = require("./src/utils/rabbitMQ");
const {
  consumeAuthEmailMessages,
  consumeOrderEmailMessages,
} = require("./src/email-consumer/email-consumer");
const app = express();
const PORT = config.PORT || 4101;

//queues

// Start the service rabbitmq

//rabbitmq service intialization
async function startQueues() {
  try {
    await rabbitMQService.start();
    await consumeAuthEmailMessages();
    await consumeOrderEmailMessages();

    // Set prefetch for fair message distribution
    await rabbitMQService.setPrefetch(1);
    //assert channel and message
    await rabbitMQService.channel.assertExchange(
      "jobber-email-notification",
      "direct"
    );

    await rabbitMQService.channel.assertExchange(
      "order-email-notification",
      "direct"
    );

    const message = { name: "sohail", email: "ksohail470@gmail.com" };
    const order = { order: "6 pieces of GOLD", address: "Sattelite town RWP" };

    await rabbitMQService.publishToExchange(
      "jobber-email-notification",
      "auth-email",
      message
    );

    await rabbitMQService.publishToExchange(
      "order-email-notification",
      "order-email",
      order
    );

    console.log("RabbitMQ service initialized");
  } catch (error) {
    console.error("Failed to initialize RabbitMQ:", error);
    process.exit(1);
  }
}

async function consume() {}

//health routes check are not

app.get("/api/health", (req, res) => {
  logger.info("Health check requested");
  res.status(200).json({
    response: "Notification Service is up and running ",
    status: "OK",
  });
});

// Initialize on application start
startQueues();

app.listen(4101, () => {
  logger.info(`Notification service is running on port ${PORT}`);
});
