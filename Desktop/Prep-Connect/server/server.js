import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import http from "http";
import axios from 'axios';

const app = express();

// Load environment variables from .env file
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-access-token"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

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

// User Registration
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const usersCollection = db.collection("users");

  try {
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.json({ status: "error", error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ name, email, password: hashedPassword });
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Could not register user" });
  }
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

// Add at the top of server.js
import OpenAI from 'openai';

// Initialize OpenAI with NVIDIA's API
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
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
  const { prompt } = req.body; // Expecting 'prompt' in the request body
  const questionsCollection = db.collection("questions");

  if (!prompt) {
    return res.status(400).json({ status: "error", error: "Prompt is required in the request body." });
  }

  try {
    // Fetch the question from the database to ensure it exists
    const questionDoc = await questionsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!questionDoc) {
      return res.json({ status: "error", error: "Question not found." });
    }

    // Generate explanation using the provided prompt
    const explanation = await generateExplanation(prompt);

    // Optionally, store the explanation in the database
    // await questionsCollection.updateOne(
    //   { _id: new ObjectId(id) },
    //   { $set: { explanation } }
    // );

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
        };
      } catch (err) {
        console.error("Failed to decrypt message:", err);
        return {
          message: "Failed to decrypt message",
          timestamp: chat.timestamp,
          room: chat.room,
        };
      }
    });

    res.json({ status: "ok", chats: decryptedChats });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", error: "Failed to fetch anonymous chats" });
  }
});

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
    const { room, message, timestamp } = data;

    const encryptedMessage = encrypt(message);

    const anonChatsCollection = db.collection("anonymous_chat");
    try {
      const chatDocument = {
        room,
        message: encryptedMessage,
        timestamp: new Date(timestamp),
      };
      await anonChatsCollection.insertOne(chatDocument);

      const decryptedMessage = decrypt(encryptedMessage);

      const anonymousMessage = {
        room,
        message: decryptedMessage,
        timestamp: chatDocument.timestamp,
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