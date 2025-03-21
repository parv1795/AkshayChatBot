const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Import chatbot module
const { generateResponse } = require('./chatbot'); // Ensure chatbot.js exists

// Middleware to serve static files correctly
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Ensures main directory files are also accessible

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Updated to correctly serve the file
});

// Function to validate API Key
async function validateOpenAIKey(apiKey) {
  try {
    const openai = new OpenAI({ apiKey });

    // Simple test by listing models
    await openai.models.list();
    return true;
  } catch (error) {
    console.error("❌ Invalid API Key:", error.message);
    return false;
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 A user connected');

  // API Key Validation
  socket.on('validate-api-key', async (apiKey) => {
    const isValid = await validateOpenAIKey(apiKey);

    if (isValid) {
      try {
        // Save the key to .env file
        const envPath = path.join(__dirname, '.env');
        fs.writeFileSync(envPath, `OPENAI_API_KEY=${apiKey}\nPORT=3000`, 'utf8');

        // Reload environment variables
        dotenv.config();

        console.log('✅ API Key validated and stored successfully!');
      } catch (err) {
        console.error('❌ Error writing .env file:', err.message);
      }
    }

    // Send validation result back to client
    socket.emit('api-key-validation', isValid);
  });

  // Chat message handling
  socket.on('chat message', async (msg) => {
    try {
      // Generate AI response
      const botResponse = await generateResponse(msg);

      // Emit the response back to the client
      socket.emit('bot response', botResponse);
    } catch (error) {
      console.error('❌ Error in chat message handler:', error);
      socket.emit('bot response', 'Something went wrong! 😅 Please try again.');
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected');
  });
});

// Determine port
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});
