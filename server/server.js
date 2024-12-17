import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import http from "http";
import axios from 'axios';
import validator from 'validator';
import bodyParser from 'body-parser';
import sgMail from '@sendgrid/mail';
import rateLimit from 'express-rate-limit';

dotenv.config();
const app = express();

// Load environment variables from .env file
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-access-token"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db;

async function connectDb() {
  try {
    await client.connect();
    db = client.db("prepconnect");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}
connectDb();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? process.env.ENCRYPTION_KEY.padEnd(32, "0")
  : "your_encryption_key".padEnd(32, "0"); // Ensure 32 chars
const IV_LENGTH = 16; // For AES, this should be 16 bytes

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  let parts = text.split(":");
  let iv = Buffer.from(parts.shift(), "hex");
  let encryptedText = parts.join(":");
  let decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const token = req.headers["x-access-token"];
  if (!token) return res.json({ status: "error", error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userName = decoded.name;
    next();
  } catch (err) {
    res.json({ status: "error", error: "Invalid token" });
  }
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// Function to send an alert (e.g., log a message or send an email)
function sendRateLimitAlert(ip) {
  console.log(`Rate limit exceeded for IP: ${ip}`);
  // You can also send an email or other types of alerts here
}

// Rate limiter for OTP generation during registration
const registerOtpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2, // Limit each IP to 2 request per windowMs
  handler: (req, res, next) => {
    sendRateLimitAlert(req.ip);
    res.status(429).json({
      status: "error",
      error: "Too many OTP requests from this IP, please try again after 15 minutes"
    });
  }
});

// Rate limiter for forgot password endpoint
const forgotPasswordRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2, // Limit each IP to 2 requests per windowMs
  handler: (req, res, next) => {
    sendRateLimitAlert(req.ip);
    res.status(429).json({
      status: "error",
      error: "Too many password reset requests from this IP, please try again after 15 minutes"
    });
  }
});

app.post("/api/generate-otp", registerOtpRateLimiter, async (req, res) => {
  const { email, name } = req.body;
  const usersCollection = db.collection("users");
  const otpsCollection = db.collection("otps");

  const existingUserByEmail = await usersCollection.findOne({ email: email.toLowerCase() });
  if (existingUserByEmail) {
    return res.json({ status: "error", error: "User with this email already exists" });
  }

  const existingUserByName = await usersCollection.findOne({ name: name });
  if (existingUserByName) {
    return res.json({ status: "error", error: "User with this name already exists" });
  }

  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = new Date();

  const otpDoc = await otpsCollection.findOne({ email: email.toLowerCase() });
  if (otpDoc && now - new Date(otpDoc.createdAt) < oneDay) {
    return res.json({ status: "error", error: "You can only request an OTP once per day." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await otpsCollection.insertOne({ email: email.toLowerCase(), otp, createdAt: now });

  await sendOtpEmail(email, otp);
  res.json({ status: "ok", message: "OTP sent to email" });
});


async function sendOtpEmail(email, otp) {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };
  await sgMail.send(msg);
}

app.post("/api/generate-reset-otp", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  const usersCollection = db.collection("users");
  const otpsCollection = db.collection("otps");

  const user = await usersCollection.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ status: "error", error: "User not found" });
  }

  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = new Date();

  if (user.lastPasswordReset && now - new Date(user.lastPasswordReset) < oneDay) {
    return res.json({ status: "error", error: "You can only request a password reset once per day." });
  }

  if (!(await bcrypt.compare(oldPassword, user.password))) {
    return res.json({ status: "error", error: "Invalid old password" });
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return res.json({ status: "error", error: "New password cannot be the same as the old password" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await otpsCollection.insertOne({ email: email.toLowerCase(), otp });

  await sendOtpEmail(email, otp);

  // Update the lastPasswordReset timestamp
  await usersCollection.updateOne(
    { email: email.toLowerCase() },
    { $set: { lastPasswordReset: now } }
  );

  res.json({ status: "ok", message: "OTP sent to email" });
});

app.post("/api/register", async (req, res) => {
  const { name, email, password, confirmPassword, otp } = req.body;
  const usersCollection = db.collection("users");
  const otpsCollection = db.collection("otps");
  const usernameRegex = /^[a-zA-Z0-9]{3,}$/;
  if (!usernameRegex.test(name)) {
    return res.status(400).json({ status: "error", error: "Username must be alphanumeric and at least 3 characters long." });
  }
  if (password !== confirmPassword) {
    return res.json({ status: "error", error: "Passwords do not match" });
  }

  if (!validator.isStrongPassword(password)) {
    return res.json({ status: "error", error: "Password is not strong enough" });
  }

  const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.json({ status: "error", error: "User already exists" });
  }

  const otpDoc = await otpsCollection.findOne({ email: email.toLowerCase(), otp });
  if (!otpDoc) {
    return res.json({ status: "error", error: "Invalid OTP" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await usersCollection.insertOne({ name, email: email.toLowerCase(), password: hashedPassword });
  res.json({ status: "ok" });
});

app.post("/api/forgot-password", forgotPasswordRateLimiter, async (req, res) => {
  const { email, newPassword } = req.body;
  const usersCollection = db.collection("users");
  const otpsCollection = db.collection("otps");

  const user = await usersCollection.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ status: "error", error: "User not found" });
  }

  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = new Date();

  if (user.lastPasswordReset && now - new Date(user.lastPasswordReset) < oneDay) {
    return res.json({ status: "error", error: "You can only request a password reset once per day." });
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return res.json({ status: "error", error: "New password cannot be the same as the old password" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await otpsCollection.insertOne({ email: email.toLowerCase(), otp });

  await sendOtpEmail(email, otp);
  res.json({ status: "ok", message: "OTP sent to email" });
});

app.post("/api/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const usersCollection = db.collection("users");
  const otpsCollection = db.collection("otps");

  const user = await usersCollection.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ status: "error", error: "User not found" });
  }

  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = new Date();

  // if (user.lastPasswordReset && now - new Date(user.lastPasswordReset) < oneDay) {
  //   return res.json({ status: "error", error: "You can only request a password reset once per day." });
  // }

  if (await bcrypt.compare(newPassword, user.password)) {
    return res.json({ status: "error", error: "New password cannot be the same as the old password" });
  }

  const otpDoc = await otpsCollection.findOne({ email: email.toLowerCase(), otp });
  if (!otpDoc) {
    return res.json({ status: "error", error: "Invalid OTP" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await usersCollection.updateOne({ email: email.toLowerCase() }, { $set: { password: hashedPassword, lastPasswordReset: now } });
  res.json({ status: "ok", message: "Password reset successful" });
});

// User Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const usersCollection = db.collection("users");

  try {
    const user = await usersCollection.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET);
      res.json({ status: "ok", user: token });
    } else {
      res.json({ status: "error", user: false });
    }
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Login failed" });
  }
});

// Dashboard Route
app.get("/api/dashboard", authenticateToken, (req, res) => {
  res.json({
    status: "ok",
    message: `Welcome to the dashboard, ${req.userName}`,
  });
});

// Get All Users (for Personal Chat)
app.get("/api/users", authenticateToken, async (req, res) => {
  const usersCollection = db.collection("users");
  try {
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.json({ status: "ok", users });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Could not fetch users" });
  }
});

// Questions Collection
app.post("/api/questions", async (req, res) => {
  const { question, options, answer, category } = req.body;
  const questionsCollection = db.collection("questions");
  try {
    await questionsCollection.insertOne({ question, options, answer, category });
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Could not add question" });
  }
});

app.get("/api/questions", async (req, res) => {
  const { category } = req.query;
  const questionsCollection = db.collection("questions");
  try {
    const query = category ? { category } : {};
    const questions = await questionsCollection.find(query).toArray();
    res.json({ status: "ok", questions });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Could not fetch questions" });
  }
});

// Get Single Question
app.get("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const questionsCollection = db.collection("questions");
  try {
    const question = await questionsCollection.findOne({
      _id: new ObjectId(id),
    });
    res.json({ status: "ok", question });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Could not fetch question" });
  }
});



async function generateExplanation(prompt) {
  const API_KEY = process.env.NVIDIA_API_KEY;
  const BASE_URL = 'https://integrate.api.nvidia.com/v1'; // Confirm with NVIDIA's documentation

  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`, // Ensure this is the correct endpoint
      {
        model: "mistralai/mixtral-8x7b-instruct-v0.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5, // Lower temperature for more deterministic output
        top_p: 1,
        max_tokens: 100, // Limit to make output smaller
        n: 1,
        stop: null,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0]?.message?.content.trim() || "No explanation available.";
  } catch (error) {
    if (error.response) {
      console.error(`Error generating explanation: ${error.response.status} - "${JSON.stringify(error.response.data)}"`);
    } else {
      console.error(`Error generating explanation: ${error.message}`);
    }
    throw new Error("Failed to generate explanation.");
  }
}

// /api/explain/:id Endpoint
app.post("/api/explain/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { prompt } = req.body; // Expect 'prompt' in the request body
  const questionsCollection = db.collection("questions");

  if (!prompt) {
    return res
      .status(400)
      .json({ status: "error", error: "Prompt is required in the request body." });
  }

  try {
    // Fetch the question from the database
    const questionDoc = await questionsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!questionDoc) {
      return res.json({ status: "error", error: "Question not found." });
    }

    // Check if explanation already exists
    if (questionDoc.explanation) {
      // Return the existing explanation
      return res.json({ status: "ok", explanation: questionDoc.explanation });
    }

    // Generate explanation using the provided prompt
    const explanation = await generateExplanation(prompt);

    // Store the explanation in the database
    await questionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { explanation } }
    );

    // Respond with the explanation
    res.json({ status: "ok", explanation });
  } catch (err) {
    console.error(`Error in /api/explain/:id: ${err.message}`);
    res.json({ status: "error", error: "Could not generate explanation." });
  }
});

// Comments Collection
app.post("/api/comments", authenticateToken, async (req, res) => {
  const { questionId, comment } = req.body;
  const commentsCollection = db.collection("comments");
  try {
    const timestamp = new Date().toISOString();
    await commentsCollection.insertOne({
      questionId: new ObjectId(questionId),
      comment,
      userId: req.userId,
      username: req.userName,
      timestamp,
    });
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Could not add comment" });
  }
});

app.get("/api/comments/:questionId", async (req, res) => {
  const { questionId } = req.params;
  const commentsCollection = db.collection("comments");
  try {
    const comments = await commentsCollection
      .find({ questionId: new ObjectId(questionId) })
      .toArray();
    res.json({ status: "ok", comments });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Could not fetch comments" });
  }
});

// Socket.io Chat Logic
app.get("/api/chats", async (req, res) => {
  const token = req.headers["x-access-token"];

  if (!token) return res.json({ status: "error", error: "No token provided" });

  try {
    jwt.verify(token, JWT_SECRET);
    const { user1, user2 } = req.query;
    const chatsCollection = db.collection("chat");

    const chats = await chatsCollection
      .find({
        $or: [{ from: user1, to: user2 }, { from: user2, to: user1 }],
      })
      .sort({ timestamp: 1 })
      .toArray();

    const decryptedChats = chats.map((chat) => {
      try {
        return {
          from: chat.from,
          to: chat.to,
          message: decrypt(chat.message),
          timestamp: chat.timestamp,
        };
      } catch (err) {
        console.error("Failed to decrypt message:", err);
        return {
          from: chat.from,
          to: chat.to,
          message: "Failed to decrypt message",
          timestamp: chat.timestamp,
        };
      }
    });

    res.json({ status: "ok", chats: decryptedChats });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Failed to fetch chat history" });
  }
});

app.get("/api/anonymous-chats", async (req, res) => {
  const { room } = req.query;
  const anonChatsCollection = db.collection("anonymous_chat");

  try {
    const chats = await anonChatsCollection
      .find({ room })
      .sort({ timestamp: 1 })
      .toArray();

    const decryptedChats = chats.map((chat) => {
      try {
        return {
          message: decrypt(chat.message),
          timestamp: chat.timestamp,
          room: chat.room,
          userName: chat.userName || "Anonymous",
        };
      } catch (err) {
        console.error("Failed to decrypt message:", err);
        return {
          message: "Failed to decrypt message",
          timestamp: chat.timestamp,
          room: chat.room,
          userName: chat.userName || "Anonymous",
        };
      }
    });

    res.json({ status: "ok", chats: decryptedChats });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Failed to fetch anonymous chats" });
  }
});

// // Socket.io authentication middleware
// io.use((socket, next) => {
//   const token = socket.handshake.query.token;
//   if (token) {
//     jwt.verify(token, JWT_SECRET, (err, decoded) => {
//       if (err) return next(new Error("Authentication error"));
//       socket.userId = decoded.id;
//       socket.userName = decoded.name;
//       next();
//     });
//   } else {
//     next(new Error("Authentication error"));
//   }
// });

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register user for personal chat
  socket.on("register-user", (userId) => {
    socket.userId = userId;
    socket.join(userId);
    console.log(`User registered: ${userId}`);
  });

  // Handle sending messages in personal chat
  socket.on("send-message", async (data) => {
    const { from, to, message } = data;

    const encryptedMessage = encrypt(message);

    const chatsCollection = db.collection("chat");
    try {
      const chatDocument = {
        from: from.toString(),
        to: to.toString(),
        message: encryptedMessage,
        timestamp: new Date(),
      };
      await chatsCollection.insertOne(chatDocument);

      const decryptedMessage = decrypt(encryptedMessage);

      io.to(to).emit("receive-message", {
        from: from.toString(),
        message: decryptedMessage,
        timestamp: chatDocument.timestamp,
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  });

  // Handle sending messages in anonymous chat
  socket.on("send-anonymous-message", async (data) => {
    const { room, message, timestamp, userName } = data;

    const encryptedMessage = encrypt(message);

    const chatDocument = {
      room,
      message: encryptedMessage,
      timestamp: new Date(timestamp),
      userName: userName || "Anonymous",
    };

    const anonChatsCollection = db.collection("anonymous_chat");
    try {
      await anonChatsCollection.insertOne(chatDocument);

      const decryptedMessage = decrypt(encryptedMessage);

      const anonymousMessage = {
        room,
        message: decryptedMessage,
        timestamp: chatDocument.timestamp,
        userName: chatDocument.userName,
      };

      // Broadcast message to the room excluding the sender
      socket.to(room).emit("receive-anonymous-message", anonymousMessage);

      // Send the message back to sender
      socket.emit("receive-anonymous-message", anonymousMessage);
    } catch (err) {
      console.error("Failed to save anonymous message:", err);
    }
  });

  // Join an anonymous chat room
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // Leave an anonymous chat room
  socket.on("leave-room", (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});