const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");


// Register
router.post("/register", authController.register);


// Login
router.post("/login", authController.login);
// =====================================================
// GET CURRENT USER / DASHBOARD DATA
// =====================================================

router.get(
    "/me",
    authMiddleware,
    async (req, res) => {

        try {

            const user = await User.findById(req.user.id)
                .select("-password -resetPasswordToken -resetPasswordExpires");

            if (!user) {

                return res.status(404).json({

                    success: false,

                    message: "User not found."

                });

            }


            res.json({

                success: true,

                user: {

                    name: user.name,

                    email: user.email,

                    phone: user.phone,


                    mentorSubscription:
                        user.mentorSubscription || {
                            active: false
                        },


                    courseStartDate:
                        user.courseStartDate || null,


                    mentorshipProgress:
                        user.mentorshipProgress || {
                            completedMilestones: 0,
                            totalMilestones: 10,
                            currentMilestone: "Getting Started"
                        },


                    badge:
                        user.badge ||
                        "Raptora Member",


                    referralPoints:
                        user.referralPoints || 0

                }

            });

        }

        catch (error) {

            console.error(
                "Get current user error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to load user data."

            });

        }

    }
);


// Forgot Password
router.post("/forgot-password", authController.forgotPassword);


// Reset Password
router.post("/reset-password/:token", authController.resetPassword);


module.exports = router;
