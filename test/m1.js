const express = require("express");
const amqp = require("amqplib/callback_api");
const winston = require("winston");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: "combined.log"}),
  ],
});

app.use(express.json());

app.post("/", (req, res) => {
  amqp.connect("amqp://localhost", (error0, connection) => {
    if (error0) {
      throw error0;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      let queue = "http_requests";
      let msg = JSON.stringify(req.body);

      channel.assertQueue(queue, {
        durable: false,
      });

      channel.sendToQueue(queue, Buffer.from(msg));
      logger.info(`Message sent to the queue: ${msg}`);
    });

    setTimeout(() => {
      connection.close();
    }, 500);
  });

  res.status(202).json({message: "Request received and processing"});
});

app.listen(port, () => {
  console.log(`M1 server is running at http://localhost:${port}`);
});
