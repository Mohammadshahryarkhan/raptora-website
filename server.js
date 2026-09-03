const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

// =====================================================
// IMPORT ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const josaaRoutes = require("./routes/josaaRoutes");
const kcetRoutes = require("./routes/kcetRoutes");
const comedkRoutes = require("./routes/comedkRoutes");
const mccRoutes = require("./routes/mccRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const messageRoutes = require("./routes/messageRoutes");

// =====================================================
// CREATE APP
// =====================================================

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// =====================================================
// SERVE FRONTEND
// =====================================================

app.use(express.static(__dirname));

// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

// =====================================================
// API ROUTES
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/josaa",
    josaaRoutes
);

app.use(
    "/api/kcet",
    kcetRoutes
);

app.use(
    "/api/comedk",
    comedkRoutes
);

app.use(
    "/api/mcc",
    mccRoutes
);

app.use(
    "/api/mentors",
    mentorRoutes
);

app.use(
    "/api/payment",
    paymentRoutes
);

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/test", (req, res) => {

    res.json({
        success: true,
        message: "Raptora backend working"
    });

});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Raptora API is running",
        mongodb:
            mongoose.connection.readyState === 1
                ? "connected"
                : "disconnected"
    });

});

// =====================================================
// 404 API HANDLER
// =====================================================

app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API endpoint not found."

    });

});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

    console.error(
        "Server Error:",
        err
    );

    res.status(500).json({

        success: false,

        message:
            "Internal server error."

    });

});

// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
    .connect(process.env.MONGO_URI)

    .then(() => {

        console.log(
            "MongoDB Connected"
        );

    })

    .catch((err) => {

        console.error(
            "MongoDB Connection Error:",
            err
        );

    });

// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT || 8000;

app.listen(
    PORT,
    () => {

        console.log(
            `Raptora server running on port ${PORT}`
        );

    }
);
