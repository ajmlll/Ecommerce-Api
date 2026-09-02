const winston = require('winston');
const path = require('path');
const config = require('./env');

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
      })
    ),
  }),
];

// Write to files in production environment
if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    })
  );
}

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports,
});

// Stream object for piping Morgan HTTP request logs into Winston
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
