const amqp = require("amqplib/callback_api");
const axios = require("axios");
const winston = require("winston");
require("dotenv").config();

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: "combined.log"}),
  ],
});

amqp.connect("amqp://localhost", (error0, connection) => {
  if (error0) {
    throw error0;
  }

  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    let queue = "http_requests";

    channel.assertQueue(queue, {
      durable: false,
    });

    logger.info("M2 is waiting for messages in the queue...");

    channel.consume(
      queue,
      (msg) => {
        logger.info(`Received: ${msg.content.toString()}`);
        axios
          .post("http://some-api-url.com", JSON.parse(msg.content.toString()))
          .then((response) => {
            logger.info(`Received response: ${response}`);
            channel.sendToQueue(
              "responses",
              Buffer.from(JSON.stringify(response.data))
            );
            logger.info(`Sent response to the queue: ${response}`);
          })
          .catch((error) => logger.error(`Error: ${error}`));
      },
      {
        noAck: true,
      }
    );
  });
});
