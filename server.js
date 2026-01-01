const express = require("express");
const logger = require("./src/utils/logger");
const config = require("./src/utils/config");
const rabbitMQService = require("./src/utils/rabbitMQ");
const app = express();
const PORT = config.PORT || 4101;

//queues

// Start the service rabbitmq

//rabbitmq service intialization
async function initializeRabbitMQ() {
  try {
    await rabbitMQService.start();

    // Set prefetch for fair message distribution
    await rabbitMQService.setPrefetch(1);

    console.log("RabbitMQ service initialized");
  } catch (error) {
    console.error("Failed to initialize RabbitMQ:", error);
    process.exit(1);
  }
}

async function consume(params) {}

//health routes check are not

app.get("/api/health", (req, res) => {
  logger.info("Health check requested");
  res.status(200).json({
    response: "Notification Service is up and running ",
    status: "OK",
  });
});

// Initialize on application start
initializeRabbitMQ();

app.listen(4101, () => {
  logger.info(`Notification service is running on port ${PORT}`);
});
