const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

let server;

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Start HTTP server after successful database connection
    server = app.listen(config.port, () => {
      console.log(`[Server] Running in ${config.env} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error(`[Server Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});
