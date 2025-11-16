const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");

// Create test-friendly app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
    secret: "TEST_SECRET",
    resave: false,
    saveUninitialized: true,
  })
);

// Register view engine (required for login page rendering)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- IMPORT ONLY ROUTES USED IN TESTS ----------
const authRoutes = require("./routes/authRoutes");

// ---------- MOUNT ROUTES ----------
app.use("/auth", authRoutes);

module.exports = app;
