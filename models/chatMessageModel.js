const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  user: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 172800 // 48 hours in seconds
  }
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
