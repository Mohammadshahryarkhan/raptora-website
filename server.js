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


// Frontend
app.use(express.static(path.join(__dirname, "frontend")));


// Home Page
app.get("/", (req,res)=>{

    res.sendFile(
        path.join(__dirname,"frontend","register.html")
    );

});


// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/josaa", josaaRoutes);

app.use("/api/kcet", kcetRoutes);
app.use("/api/comedk", comedkRoutes);

app.use("/api/mcc", mccRoutes);
// Test Route
app.get("/test",(req,res)=>{

    res.send("Backend working");

});


// MongoDB
mongoose.connect(process.env.MONGO_URI)

.then(()=>{

    console.log("MongoDB Connected");

})

.catch((err)=>{

    console.log("MongoDB Error:",err);

});


// Server
const PORT = process.env.PORT || 8000;


app.listen(PORT,()=>{

    console.log(`Server running on port ${PORT}`);

});