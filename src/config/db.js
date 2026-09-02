const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./env');

// Set fallback public DNS servers for Node.js SRV record lookup on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Fallback gracefully if custom DNS cannot be set
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
