const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    // =====================================================
    // BASIC USER DETAILS
    // =====================================================

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phone: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },


    // =====================================================
    // PASSWORD RESET
    // =====================================================

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    },


    // =====================================================
    // REFERRAL SYSTEM
    // =====================================================

    referralCode: {
        type: String,
        default: null
    },

    referralPoints: {
        type: Number,
        default: 0
    },


    // =====================================================
    // MENTOR / COURSE
    // =====================================================

    mentorPlan: {
        type: String,
        default: null
    },

    mentorPlanPrice: {
        type: Number,
        default: 0
    },

    mentorStartDate: {
        type: Date,
        default: null
    },

    mentorEndDate: {
        type: Date,
        default: null
    },


    // =====================================================
    // PAYMENT
    // =====================================================

    paymentStatus: {
        type: String,
        enum: [
            "pending",
            "paid",
            "failed"
        ],
        default: "pending"
    },

    razorpayPaymentId: {
        type: String,
        default: null
    },

    razorpayOrderId: {
        type: String,
        default: null
    },


    // =====================================================
    // BADGE
    // =====================================================

    badge: {
        type: String,
        default: "Raptora Explorer"
    },


    // =====================================================
    // MILESTONES
    // =====================================================

    milestones: [
        {
            title: {
                type: String
            },

            description: {
                type: String
            },

            completed: {
                type: Boolean,
                default: false
            },

            completedDate: {
                type: Date,
                default: null
            }
        }
    ],


    // =====================================================
    // CALENDAR EVENTS
    // =====================================================

    calendarEvents: [
        {
            title: {
                type: String
            },

            description: {
                type: String
            },

            date: {
                type: Date
            },

            completed: {
                type: Boolean,
                default: false
            }
        }
    ]

}, {
    timestamps: true
});


module.exports = mongoose.model(
    "User",
    userSchema
);
