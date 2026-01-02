const logger = require("../utils/logger");
const rabbitMQ = require("../utils/rabbitMQ");

const consumeAuthEmailMessages = async () => {
  const channel = rabbitMQ.channel;
  try {
    if (!channel) {
      await rabbitMQ.createExchange();
    }
    const exchangeName = "jobber-email-notification";
    const routingKey = "auth-email";
    const queueName = "auth-email-queue";

    await channel.assertExchange(exchangeName, "direct");
    const jobberQueue = await channel.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
    });
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);
    channel.consume(jobberQueue.queue, async (msg) => {
      console.log(JSON.parse(msg.content.toString()));
    });

    channel.ackAll();
  } catch (error) {
    logger.log("Notification service email consumer error");
  }
};

const consumeOrderEmailMessages = async () => {
  const channel = rabbitMQ.channel;
  try {
    if (!channel) {
      await rabbitMQ.createExchange();
    }
    const exchangeName = "order-email-notification";
    const routingKey = "order-email";
    const queueName = "order-email-queue";

    await channel.assertExchange(exchangeName, "direct");
    const jobberQueue = await channel.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
    });
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);
    channel.consume(jobberQueue.queue, async (msg) => {
      console.log(JSON.parse(msg.content.toString()));
    });

    channel.ackAll();
  } catch (error) {
    logger.log("Notification service email consumer error");
  }
};

module.exports = { consumeAuthEmailMessages, consumeOrderEmailMessages };
