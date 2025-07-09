const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");

const mongoose = require("mongoose");
const collection = require("./config"); // user schema
const File = require("./fileModel");
const ChatMessage = require("../models/chatMessageModel"); // chat message schema

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ MongoDB Connection (ensure this is correct for your setup)
mongoose.connect("mongodb://127.0.0.1:27017/sok", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));

app.post("/signup", async (req, res) => {
  const existingUser = await collection.findOne({ name: req.body.username });
  if (existingUser) return res.send("User already exists.");

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await collection.insertMany({ name: req.body.username, password: hashedPassword });
  res.send("Signup successful.");
});

app.post("/login", async (req, res) => {
  const user = await collection.findOne({ name: req.body.username });
  if (!user) return res.send("Username not found.");

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) return res.send("Wrong password.");

  req.session.username = user.name;
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.get("/dashboard", async (req, res) => {
  if (!req.session.username) return res.redirect("/");

  const users = req.session.username === "Qwerty"
    ? await collection.find({}, { name: 1, _id: 0 })
    : [];

  res.render("home", {
    username: req.session.username,
    usersList: users
  });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.session.username) return res.redirect("/");

  const { branch, semester, subject } = req.body;
  const newFile = new File({
    filename: req.file.filename,
    originalname: req.file.originalname,
    branch,
    semester,
    subject
  });

  await newFile.save();
  res.redirect(`/branch/${branch}`);
});

app.post("/delete-file/:id", async (req, res) => {
  if (req.session.username !== "Qwerty") return res.status(403).send("Forbidden");

  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send("File not found");

  const filePath = path.join(__dirname, "..", "uploads", file.filename);
  fs.unlink(filePath, (err) => { if (err) console.error(err); });

  await File.deleteOne({ _id: req.params.id });
  res.redirect(`/branch/${file.branch}`);
});

// ✅ Group Chat Page
app.get("/group-chat", (req, res) => {
  if (!req.session.username) return res.redirect("/");
  res.render("group-chat", { username: req.session.username });
});

// ✅ Socket.IO Chat Logic
io.on("connection", async (socket) => {
  console.log("🔌 A user connected");

  // Load previous messages
  const messages = await ChatMessage.find().sort({ timestamp: 1 }).limit(100);
  socket.emit("load messages", messages);

  socket.on("chat message", async ({ user, message }) => {
    const newMsg = new ChatMessage({ user, message });
    await newMsg.save();

    io.emit("chat message", newMsg);
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected");
  });
});

// ✅ Branch Routes
const branches = ["cse", "ece", "mech", "csit", "eee", "aids"];
branches.forEach(branch => {
  app.get(`/branch/${branch}`, async (req, res) => {
    if (!req.session.username) return res.redirect("/");
    const files = await File.find({ branch }).sort({ uploadDate: -1 });
    res.render(`branch/${branch}`, { username: req.session.username, files });
  });
});

// ✅ Start Server
const port = 5000;
server.listen(port, () => {
  console.log(`🚀 Server + Socket.IO running at http://localhost:${port}`);
});
