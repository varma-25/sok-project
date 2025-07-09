const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    filename: String,
    originalname: String,
    branch: String,
    semester: String,
    subject: String,  // ✅ NEW FIELD
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("File", fileSchema);