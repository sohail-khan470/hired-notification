const winston = require("winston");
const { ElasticsearchTransport } = require("winston-elasticsearch");

const esTransport = new ElasticsearchTransport({
  level: "info",
  clientOpts: {
    node: process.env.ELASTIC_SEARCH_URL || "http://localhost:9200",
    maxRetries: 3,
    requestTimeout: 30000,
  },
  index: "app-logs",
  indexPrefix: "logs",
  indexSuffixPattern: "YYYY-MM-DD",
  flushInterval: 5000,
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    esTransport,
  ],
});

module.exports = logger;
