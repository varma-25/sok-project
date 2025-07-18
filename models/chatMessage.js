// models/ChatMessage.js
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  user: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
