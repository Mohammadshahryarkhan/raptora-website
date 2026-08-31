
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    // =====================================================
    // BASIC USER INFORMATION
    // =====================================================

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
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

    referralCount: {
        type: Number,
        default: 0
    },


    // =====================================================
    // MENTORSHIP
    // =====================================================

    mentorSubscription: {

        active: {
            type: Boolean,
            default: false
        },

        plan: {
            type: String,
            default: null
        },

        durationMonths: {
            type: Number,
            default: 0
        },

        price: {
            type: Number,
            default: 0
        },

        startDate: {
            type: Date,
            default: null
        },

        endDate: {
            type: Date,
            default: null
        },

        razorpayOrderId: {
            type: String,
            default: null
        },

        razorpayPaymentId: {
            type: String,
            default: null
        }

    },


    // =====================================================
    // MENTORSHIP PROGRESS
    // =====================================================

    mentorshipProgress: {

        completedMilestones: {
            type: Number,
            default: 0
        },

        totalMilestones: {
            type: Number,
            default: 10
        },

        currentMilestone: {
            type: String,
            default: "Getting Started"
        }

    },


    // =====================================================
    // COURSE / JOURNEY
    // =====================================================

    courseStartDate: {
        type: Date,
        default: null
    },

    selectedCourse: {
        type: String,
        default: null
    },


    // =====================================================
    // BADGE
    // =====================================================

    badge: {
        type: String,
        default: "Raptora Member"
    }

}, {
    timestamps: true
});


module.exports = mongoose.model("User", userSchema);

