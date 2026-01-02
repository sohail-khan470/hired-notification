const amqp = require("amqplib");

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.channel) return;

    console.log("Connecting to RabbitMQ...");
    this.connection = await amqp.connect(process.env.RABBITMQ_ENDPOINT);
    this.channel = await this.connection.createChannel();
    console.log("✅ RabbitMQ connected");
  }

  async createExchange(name, type = "direct") {
    if (!name) throw new Error("Exchange name required");
    await this.channel.assertExchange(name, type, { durable: true });
  }

  async createQueue(name) {
    if (!name) throw new Error("Queue name required");
    await this.channel.assertQueue(name, { durable: true });
  }

  async bindQueue(queue, exchange, key) {
    await this.channel.bindQueue(queue, exchange, key);
  }

  publish(exchange, key, data) {
    this.channel.publish(exchange, key, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  consume(queue, handler) {
    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        this.channel.ack(msg);
      } catch (err) {
        console.error("Message failed", err);
        this.channel.nack(msg, false, false);
      }
    });
  }
}

module.exports = new RabbitMQ();
