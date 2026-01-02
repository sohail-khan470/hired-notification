const logger = require("../utils/logger");
const rabbitMQ = require("../utils/rabbitmq");
const transporter = require("../utils/mail-transport");

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
      try {
        const messageData = JSON.parse(msg.content.toString());
        logger.log("Sending auth email:", messageData);

        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: messageData.to,
          subject: messageData.subject,
          html: messageData.html,
        });

        logger.log("Auth email sent successfully");
        channel.ack(msg);
      } catch (error) {
        logger.log("Error sending auth email:", error);
        channel.nack(msg, false, false);
      }
    });
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
      try {
        const messageData = JSON.parse(msg.content.toString());
        logger.log("Sending order email:", messageData);

        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: messageData.to,
          subject: messageData.subject,
          html: messageData.html,
        });

        logger.log("Order email sent successfully");
        channel.ack(msg);
      } catch (error) {
        logger.log("Error sending order email:", error);
        channel.nack(msg, false, false);
      }
    });
  } catch (error) {
    logger.log("Notification service email consumer error");
  }
};

module.exports = { consumeAuthEmailMessages, consumeOrderEmailMessages };
