const amqp = require("amqplib");
const config = require("./config"); // Your config file

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectInterval = 5000; // 5 seconds
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
  }

  /**
   * Initialize RabbitMQ connection and channel
   */
  async start() {
    try {
      if (!config.RABBITMQ_ENDPOINT) {
        throw new Error(
          "RABBITMQ_ENDPOINT is not defined in environment variables"
        );
      }

      console.log("Connecting to RabbitMQ...");
      this.connection = await amqp.connect(config.RABBITMQ_ENDPOINT);

      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
        this.isConnected = false;
        this.handleReconnection();
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
        this.isConnected = false;
        this.handleReconnection();
      });

      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log("✅ RabbitMQ connected successfully");
      return this;
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      this.handleReconnection();
      throw error;
    }
  }

  /**
   * Handle reconnection logic
   */
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        console.error("Reconnection failed:", error);
      }
    }, this.reconnectInterval);
  }

  /**
   * Create/assert a queue
   */
  async createQueue(queueName, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      const defaultOptions = {
        durable: true,
        arguments: {
          "x-queue-type": "classic",
        },
      };

      const queueOptions = { ...defaultOptions, ...options };
      await this.channel.assertQueue(queueName, queueOptions);
      console.log(`✅ Queue "${queueName}" created/asserted`);

      return queueName;
    } catch (error) {
      console.error(`Error creating queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Create/assert an exchange
   */
  async createExchange(exchangeName, type = "direct", options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      const defaultOptions = {
        durable: true,
      };

      const exchangeOptions = { ...defaultOptions, ...options };
      await this.channel.assertExchange(exchangeName, type, exchangeOptions);
      console.log(`✅ Exchange "${exchangeName}" (${type}) created/asserted`);

      return exchangeName;
    } catch (error) {
      console.error(`Error creating exchange "${exchangeName}":`, error);
      throw error;
    }
  }

  /**
   * Bind queue to exchange
   */
  async bindQueue(queueName, exchangeName, routingKey = "") {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      await this.channel.bindQueue(queueName, exchangeName, routingKey);
      console.log(
        `✅ Queue "${queueName}" bound to exchange "${exchangeName}" with routing key "${routingKey}"`
      );
    } catch (error) {
      console.error(
        `Error binding queue "${queueName}" to exchange "${exchangeName}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Send message to queue
   */
  async sendToQueue(queueName, message, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      const defaultOptions = {
        persistent: true,
        contentType: "application/json",
      };

      const messageOptions = { ...defaultOptions, ...options };
      const messageBuffer = Buffer.isBuffer(message)
        ? message
        : Buffer.from(JSON.stringify(message));

      const success = this.channel.sendToQueue(
        queueName,
        messageBuffer,
        messageOptions
      );

      if (success) {
        console.log(`📤 Message sent to queue "${queueName}"`);
      } else {
        console.warn(
          `⚠️ Message not sent to queue "${queueName}" - channel buffer full`
        );
      }

      return success;
    } catch (error) {
      console.error(`Error sending message to queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Publish message to exchange
   */
  async publishToExchange(exchangeName, routingKey, message, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      const defaultOptions = {
        persistent: true,
        contentType: "application/json",
      };

      const messageOptions = { ...defaultOptions, ...options };
      const messageBuffer = Buffer.isBuffer(message)
        ? message
        : Buffer.from(JSON.stringify(message));

      const success = this.channel.publish(
        exchangeName,
        routingKey,
        messageBuffer,
        messageOptions
      );

      if (success) {
        console.log(
          `📤 Message published to exchange "${exchangeName}" with routing key "${routingKey}"`
        );
      } else {
        console.warn(
          `⚠️ Message not published to exchange "${exchangeName}" - channel buffer full`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `Error publishing message to exchange "${exchangeName}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Consume messages from queue
   */
  async consumeFromQueue(queueName, onMessage, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      const defaultOptions = {
        noAck: false,
      };

      const consumeOptions = { ...defaultOptions, ...options };

      await this.channel.consume(
        queueName,
        async (message) => {
          if (message) {
            try {
              let content;
              try {
                content = JSON.parse(message.content.toString());
              } catch {
                content = message.content.toString();
              }

              console.log(`📥 Message received from queue "${queueName}"`);

              // Process the message
              await onMessage(content, message);

              // Acknowledge the message if noAck is false
              if (!consumeOptions.noAck) {
                this.channel.ack(message);
              }
            } catch (error) {
              console.error(
                `Error processing message from queue "${queueName}":`,
                error
              );

              // Reject the message and don't requeue if processing fails
              if (!consumeOptions.noAck) {
                this.channel.nack(message, false, false);
              }
            }
          }
        },
        consumeOptions
      );

      console.log(`✅ Started consuming from queue "${queueName}"`);
    } catch (error) {
      console.error(`Error consuming from queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Set up prefetch for fair dispatch
   */
  async setPrefetch(count, global = false) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      await this.channel.prefetch(count, global);
      console.log(`✅ Prefetch set to ${count} (global: ${global})`);
    } catch (error) {
      console.error("Error setting prefetch:", error);
      throw error;
    }
  }

  /**
   * Get queue information
   */
  async getQueueInfo(queueName) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      const queue = await this.channel.checkQueue(queueName);
      return queue;
    } catch (error) {
      console.error(`Error getting info for queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Purge a queue
   */
  async purgeQueue(queueName) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      await this.channel.purgeQueue(queueName);
      console.log(`✅ Queue "${queueName}" purged`);
    } catch (error) {
      console.error(`Error purging queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Delete a queue
   */
  async deleteQueue(queueName, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error("RabbitMQ channel is not available");
      }

      const defaultOptions = {
        ifUnused: false,
        ifEmpty: false,
      };

      const deleteOptions = { ...defaultOptions, ...options };
      await this.channel.deleteQueue(queueName, deleteOptions);
      console.log(`✅ Queue "${queueName}" deleted`);
    } catch (error) {
      console.error(`Error deleting queue "${queueName}":`, error);
      throw error;
    }
  }

  /**
   * Close connection gracefully
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      console.log("✅ RabbitMQ connection closed gracefully");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}

// Create and export a singleton instance
const rabbitMQService = new RabbitMQService();

module.exports = rabbitMQService;
