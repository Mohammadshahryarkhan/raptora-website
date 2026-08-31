
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const josaaRoutes = require("./routes/josaaRoutes");
const kcetRoutes = require("./routes/kcetRoutes");
const comedkRoutes = require("./routes/comedkRoutes");
const mccRoutes = require("./routes/mccRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
// Create App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files from project root
app.use(express.static(__dirname));

// Home Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/josaa", josaaRoutes);
app.use("/api/kcet", kcetRoutes);
app.use("/api/comedk", comedkRoutes);
app.use("/api/mcc", mccRoutes);
app.use("/api/payment", paymentRoutes);

// Test Backend
app.get("/test", (req, res) => {
    res.send("Backend working");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log("MongoDB Error:", err);
    });

// Start Server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

