
const mongoose = require("mongoose");


// =====================================================
// MILESTONE SCHEMA
// =====================================================

const milestoneSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        completed: {
            type: Boolean,
            default: false
        },

        completedDate: {
            type: Date,
            default: null
        }
    },
    {
        _id: false
    }
);


// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
    {

        // =====================================================
        // BASIC USER DETAILS
        // =====================================================

        name: {
            type: String,
            required: true,
            trim: true
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
            required: true,
            trim: true
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
        // MENTOR SUBSCRIPTION
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
        // COURSE START DATE
        // =====================================================

        courseStartDate: {
            type: Date,
            default: null
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
        // MILESTONES
        // =====================================================

        milestones: {
            type: [milestoneSchema],
            default: []
        },


        // =====================================================
        // BADGE
        // =====================================================

        badge: {
            type: String,
            default: "Raptora Member"
        },


        // =====================================================
        // PAYMENT STATUS
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
        // REFERRAL POINTS
        // =====================================================

        referralPoints: {
            type: Number,
            default: 0
        }

    },

    {
        timestamps: true
    }
);


// =====================================================
// EXPORT MODEL
// =====================================================

module.exports =
    mongoose.model("User", userSchema);

