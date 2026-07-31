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


// Create App
const app = express();


// Middleware
app.use(cors());

app.use(express.json());


// Serve Frontend Files
app.use(express.static(path.join(__dirname, "frontend")));


// Home Route
app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "frontend", "index.html")
    );

});


// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/josaa", josaaRoutes);

app.use("/api/kcet", kcetRoutes);

app.use("/api/comedk", comedkRoutes);

app.use("/api/mcc", mccRoutes);


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
