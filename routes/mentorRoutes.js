const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");


// =====================================================
// GET ALL MENTOR PLANS
// =====================================================

router.get("/", async (req, res) => {

    try {

        const mentors = [

            {
                id: "mentor_1_month",
                name: "1 Month Mentor Plan",
                role: "College Admission Expert",
                description:
                    "Perfect for quick admission guidance.",
                price: 400,
                duration: "1 Month",
                available: true
            },

            {
                id: "mentor_3_months",
                name: "3 Months Mentor Plan",
                role: "College Admission Expert",
                description:
                    "Get consistent mentorship throughout your admission journey.",
                price: 1100,
                duration: "3 Months",
                available: true
            },

            {
                id: "mentor_6_months",
                name: "6 Months Mentor Plan",
                role: "College Admission Expert",
                description:
                    "Long-term admission guidance and support.",
                price: 2200,
                duration: "6 Months",
                popular: true,
                available: true
            },

            {
                id: "mentor_12_months",
                name: "12 Months Mentor Plan",
                role: "College Admission Expert",
                description:
                    "Complete yearly mentorship for your admission journey.",
                price: 4600,
                duration: "12 Months",
                available: true
            }

        ];


        res.json({

            success: true,

            mentors

        });

    }

    catch (error) {

        console.error(
            "Mentor fetch error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to fetch mentors"

        });

    }

});


// =====================================================
// GET ALL REAL MENTOR ACCOUNTS
// =====================================================

router.get(
    "/users",
    authMiddleware,
    async (req, res) => {

        try {

            const mentors = await User.find({
                role: "mentor"
            })
                .select("_id name email phone role")
                .sort({ name: 1 });


            res.json({

                success: true,

                mentors

            });

        }

        catch (error) {

            console.error(
                "Mentor users fetch error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to fetch mentor accounts"

            });

        }

    }
);


// =====================================================
// ASSIGN MENTOR TO STUDENT
// =====================================================

router.post(
    "/assign",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                studentId,
                mentorId
            } = req.body;


            // ---------------------------------------------
            // VALIDATE IDS
            // ---------------------------------------------

            if (
                !studentId ||
                !mentorId
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Student ID and Mentor ID are required."

                });

            }


            if (
                !mongoose.Types.ObjectId.isValid(studentId) ||
                !mongoose.Types.ObjectId.isValid(mentorId)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid student or mentor ID."

                });

            }


            // ---------------------------------------------
            // FIND STUDENT
            // ---------------------------------------------

            const student =
                await User.findById(studentId);


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student not found."

                });

            }


            // ---------------------------------------------
            // FIND MENTOR
            // ---------------------------------------------

            const mentor =
                await User.findById(mentorId);


            if (!mentor) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Mentor not found."

                });

            }


            // ---------------------------------------------
            // MAKE SURE SELECTED USER IS A MENTOR
            // ---------------------------------------------

            if (mentor.role !== "mentor") {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected user is not a mentor."

                });

            }


            // ---------------------------------------------
            // MAKE SURE TARGET IS NOT A MENTOR
            // ---------------------------------------------

            if (student.role === "mentor") {

                return res.status(400).json({

                    success: false,

                    message:
                        "A mentor cannot be assigned as a student."

                });

            }


            // ---------------------------------------------
            // ASSIGN MENTOR
            // ---------------------------------------------

            student.assignedMentor =
                mentor._id;

            await student.save();


            // ---------------------------------------------
            // RETURN UPDATED INFORMATION
            // ---------------------------------------------

            res.json({

                success: true,

                message:
                    "Mentor assigned successfully.",

                student: {

                    id: student._id,

                    name: student.name,

                    email: student.email,

                    assignedMentor: {

                        id: mentor._id,

                        name: mentor.name,

                        email: mentor.email

                    }

                }

            });

        }

        catch (error) {

            console.error(
                "Mentor assignment error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to assign mentor."

            });

        }

    }
);


// =====================================================
// REMOVE ASSIGNED MENTOR
// =====================================================

router.post(
    "/remove-assignment",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                studentId
            } = req.body;


            if (!studentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Student ID is required."

                });

            }


            if (
                !mongoose.Types.ObjectId.isValid(studentId)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid student ID."

                });

            }


            const student =
                await User.findById(studentId);


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student not found."

                });

            }


            student.assignedMentor = null;

            await student.save();


            res.json({

                success: true,

                message:
                    "Mentor assignment removed."

            });

        }

        catch (error) {

            console.error(
                "Remove mentor assignment error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to remove mentor assignment."

            });

        }

    }
);


module.exports = router;
