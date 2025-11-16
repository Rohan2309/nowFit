// ==========================================
// LOAD ENV, MODULES
// ==========================================
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

// NEW SECURITY MODULES
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Create Express App
const app = express();

// Create HTTP Server (needed for Socket.IO)
const http = require("http").createServer(app);

// Socket.IO
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

// Make io available globally in all controllers/routes
app.set("io", io);


// ==========================================
// CONNECT MONGODB
// ==========================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));


// ==========================================
// GLOBAL SECURITY MIDDLEWARES
// ==========================================

// 🔒 Helmet security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        // Allow CDN + inline JS
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://code.jquery.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://cdn.datatables.net",
          "https://cdn.socket.io"
        ],

        scriptSrcElem: [
          "'self'",
          "'unsafe-inline'",
          "https://code.jquery.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://cdn.datatables.net"
        ],

        // Allow external CSS
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://cdn.datatables.net",
          "https://cdnjs.cloudflare.com"
        ],

        styleSrcElem: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://cdn.datatables.net",
          "https://cdnjs.cloudflare.com"
        ],

        // Allow Cloudinary images
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "http:",
          "https://res.cloudinary.com"
        ],

        fontSrc: [
  "'self'",
  "data:",
  "https://fonts.gstatic.com",
  "https://cdnjs.cloudflare.com",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome"
],


        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          "blob:",
          "data:",
          "*"
        ],

        frameSrc: ["'self'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// 🚫 Rate limit: 100 requests / 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests. Please try again later."
  })
);


// ==========================================
// BODY PARSERS & COOKIES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// SESSION
app.use(
  session({
    secret: process.env.SESSION_SECRET || "NOWFIT_SECRET_123",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
  })
);


// ==========================================
// STATIC & VIEW ENGINE
// ==========================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "app/views"));
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const { requireAuth, permit } = require("./app/middlewares/auth");


// ==========================================
// IMPORT ROUTES
// ==========================================
const authRoutes = require("./app/routes/authRoutes");
const adminRoutes = require("./app/routes/adminRoutes");
const dietRoutes = require("./app/routes/dietRoutes");
const workoutRoutes = require("./app/routes/workoutRoutes");
const coachRoutes = require("./app/routes/coachRoutes");
const clientRoutes = require("./app/routes/clientRoutes");
const chatRoutes = require("./app/routes/chatRoutes");


// ==========================================
// ROUTE MOUNTING
// ==========================================

// PUBLIC ROUTES
app.use("/auth", authRoutes);

// COACH
app.use("/coach", requireAuth, permit("coach"), coachRoutes);

// CLIENT
app.use("/client", requireAuth, permit("user"), clientRoutes);

// ADMIN
app.use("/admin", requireAuth, permit("admin"), adminRoutes);

// ADMIN: Diets + Workouts
app.use("/admin/diets", requireAuth, permit("admin"), dietRoutes);
app.use("/admin/workouts", requireAuth, permit("admin"), workoutRoutes);

// CHAT
app.use("/chat", requireAuth, chatRoutes);


// ==========================================
// ROOT ROUTE
// ==========================================
app.get("/", (req, res) => {

  // If logged in → redirect to dashboard
  if (req.session && req.session.userId) {
    switch (req.session.role) {
      case "admin": return res.redirect("/admin/dashboard");
      case "coach": return res.redirect("/coach/dashboard");
      case "user": return res.redirect("/client/dashboard");
    }
  }

  // If NOT logged in → show landing page
  return res.render("landing");  // landing.ejs
});



// ==========================================
// SWAGGER SETUP
// ==========================================
require("./swagger/swagger")(app);


// ==========================================
// SOCKET.IO CHAT LOGIC
// ==========================================
const ChatMessage = require("./app/models/chatMessage");
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // USER ONLINE STATUS
  socket.on("registerUser", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineStatus", { userId, status: "online" });
  });

  // JOIN ROOM
  socket.on("joinRoom", ({ userId, receiverId }) => {
    const room = [userId, receiverId].sort().join("_");
    socket.join(room);
  });

  // TYPING STATUS
  socket.on("typing", ({ from, to }) => {
    const room = [from, to].sort().join("_");
    io.to(room).emit("typing", { from });
  });

  socket.on("stopTyping", ({ from, to }) => {
    const room = [from, to].sort().join("_");
    io.to(room).emit("stopTyping", { from });
  });

  // SEND MESSAGE
  socket.on("sendMessage", async ({ sender, receiver, message }) => {
    try {
      const msg = await ChatMessage.create({
        from: sender,
        to: receiver,
        message,
      });

      const room = [sender, receiver].sort().join("_");

      io.to(room).emit("receiveMessage", {
        sender,
        receiver,
        message,
        timestamp: msg.timestamp,
      });

    } catch (err) {
      console.log("❌ Chat Save Error:", err.message);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    for (let uid in onlineUsers) {
      if (onlineUsers[uid] === socket.id) {
        delete onlineUsers[uid];
        io.emit("onlineStatus", { userId: uid, status: "offline" });
        break;
      }
    }
    console.log("🔌 User disconnected:", socket.id);
  });
});


// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
  console.log(`🚀 NOWFit running on at http://localhost:${PORT}/ `);
});
