
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");
const User = require("../models/User");

const router = express.Router();


// =====================================================
// REGISTER
// =====================================================

router.post(
    "/register",
    authController.register
);


// =====================================================
// LOGIN
// =====================================================

router.post(
    "/login",
    authController.login
);


// =====================================================
// GET CURRENT USER / DASHBOARD DATA
// =====================================================

router.get(
    "/me",
    authMiddleware,
    async (req, res) => {

        try {

            const user = await User.findById(req.user.id)
                .select(
                    "-password -resetPasswordToken -resetPasswordExpires"
                );


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message: "User not found."

                });

            }


            res.json({

                success: true,

                user: {

                    // =================================================
                    // BASIC USER DETAILS
                    // =================================================

                    name:
                        user.name,

                    email:
                        user.email,

                    phone:
                        user.phone,


                    // =================================================
                    // MENTOR SUBSCRIPTION
                    // =================================================

                    mentorSubscription:
                        user.mentorSubscription || {

                            active: false

                        },


                    // =================================================
                    // ASSIGNED MENTOR
                    // =================================================

                    assignedMentor:
                        user.assignedMentor || null,


                    // =================================================
                    // COURSE START DATE
                    // =================================================

                    courseStartDate:
                        user.courseStartDate || null,


                    // =================================================
                    // MENTORSHIP PROGRESS
                    // =================================================

                    mentorshipProgress:
                        user.mentorshipProgress || {

                            completedMilestones: 0,

                            totalMilestones: 10,

                            currentMilestone:
                                "Getting Started"

                        },


                    // =================================================
                    // BADGE
                    // =================================================

                    badge:
                        user.badge ||
                        "Raptora Member",


                    // =================================================
                    // REFERRAL CODE
                    // =================================================

                    referralCode:
                        user.referralCode || null,


                    // =================================================
                    // REFERRAL POINTS
                    // =================================================

                    referralPoints:
                        user.referralPoints || 0,


                    // =================================================
                    // REFERRAL BADGE
                    // =================================================

                    referralBadge:
                        user.referralBadge ||
                        "Raptora Member"

                }

            });

        }

        catch (error) {

            console.error(
                "Get current user error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load user data."

            });

        }

    }
);


// =====================================================
// ADMIN - GET ALL STUDENTS
// =====================================================

router.get(
    "/users",
    authMiddleware,
    async (req, res) => {

        try {

            const admin =
                await User.findById(req.user.id);


            if (
                !admin ||
                admin.role !== "admin"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Admin access required."

                });

            }


            const users =
                await User.find({
                    role: "student"
                })
                .select(
                    "_id name email phone assignedMentor"
                )
                .populate(
                    "assignedMentor",
                    "name email"
                )
                .sort({
                    name: 1
                });


            res.json({

                success: true,

                users

            });

        }

        catch (error) {

            console.error(
                "Admin users fetch error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to fetch students."

            });

        }

    }
);


// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
    "/forgot-password",
    authController.forgotPassword
);


// =====================================================
// RESET PASSWORD
// =====================================================

router.post(
    "/reset-password/:token",
    authController.resetPassword
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
