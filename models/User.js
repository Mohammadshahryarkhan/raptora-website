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
        required: true
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
    // MENTOR PLAN
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

    mentorExpiryDate: {
        type: Date,
        default: null
    },

    mentorActive: {
        type: Boolean,
        default: false
    },


    // =====================================================
    // REFERRAL SYSTEM
    // =====================================================

    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },

    referredBy: {
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
    // BADGE
    // =====================================================

    badge: {
        type: String,
        default: "New Member"
    },


    // =====================================================
    // MILESTONES
    // =====================================================

    milestones: {

        profileCompleted: {
            type: Boolean,
            default: false
        },

        examSelected: {
            type: Boolean,
            default: false
        },

        rankPredictionCompleted: {
            type: Boolean,
            default: false
        },

        collegeShortlistCreated: {
            type: Boolean,
            default: false
        },

        mentorConsultationCompleted: {
            type: Boolean,
            default: false
        },

        applicationSubmitted: {
            type: Boolean,
            default: false
        },

        counsellingCompleted: {
            type: Boolean,
            default: false
        },

        admissionCompleted: {
            type: Boolean,
            default: false
        }

    },


    // =====================================================
    // CALENDAR / IMPORTANT DATES
    // =====================================================

    calendarEvents: [

        {
            title: {
                type: String
            },

            description: {
                type: String,
                default: ""
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


module.exports = mongoose.model("User", userSchema);module.exports = mongoose.model("User", userSchema);
