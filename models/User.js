
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {

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
        // BADGE
        // =====================================================

        badge: {
            type: String,
            default: "Raptora Member"
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
        // MENTOR MILESTONES
        // =====================================================

        milestones: {
            type: [
                {
                    title: {
                        type: String,
                        required: true
                    },

                    description: {
                        type: String,
                        required: true
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
            default: []
        },


        // =====================================================
        // PAYMENT
        // =====================================================

        paymentStatus: {
            type: String,
            default: "unpaid"
        },

        razorpayPaymentId: {
            type: String,
            default: null
        },

        razorpayOrderId: {
            type: String,
            default: null
        }


module.exports =
    mongoose.model("User", userSchema);

