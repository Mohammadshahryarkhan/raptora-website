const express = require("express");

const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");


// =====================================================
// ADMIN ONLY MIDDLEWARE
// =====================================================

const adminOnly = async (req, res, next) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user || user.role !== "admin") {

            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });

        }

        next();

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify admin access."
        });

    }

};


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

    } catch (error) {

        console.error(
            "Mentor fetch error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to fetch mentors"
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

        } catch (error) {

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
// GET STUDENTS ASSIGNED TO LOGGED-IN MENTOR
// =====================================================

router.get(
    "/my-students",
    authMiddleware,
    async (req, res) => {

        try {

            // ---------------------------------------------
            // FIND LOGGED-IN MENTOR
            // ---------------------------------------------

            const mentor = await User.findById(
                req.user.id
            );


            if (!mentor) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Mentor account not found."
                });

            }


            // ---------------------------------------------
            // VERIFY MENTOR ROLE
            // ---------------------------------------------

            if (mentor.role !== "mentor") {

                return res.status(403).json({
                    success: false,
                    message:
                        "Mentor access required."
                });

            }


            // ---------------------------------------------
            // FIND ASSIGNED STUDENTS
            // ---------------------------------------------

            const students = await User.find({
                assignedMentor: mentor._id
            })
                .select(
                    "_id name email phone assignedMentor"
                )
                .sort({
                    name: 1
                });


            // ---------------------------------------------
            // RETURN STUDENTS
            // ---------------------------------------------

            res.json({

                success: true,

                students

            });

        } catch (error) {

            console.error(
                "My students fetch error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to fetch assigned students."
            });

        }

    }
);


// =====================================================
// ASSIGN MENTOR TO STUDENT USING EMAILS
// =====================================================

router.post(
    "/assign-by-email",
    authMiddleware,
    adminOnly,
    async (req, res) => {

        try {

            const {
                studentEmail,
                mentorEmail
            } = req.body;


            // ---------------------------------------------
            // VALIDATE EMAILS
            // ---------------------------------------------

            if (
                !studentEmail ||
                !mentorEmail
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Student email and mentor email are required."
                });

            }


            const cleanStudentEmail =
                studentEmail
                    .trim()
                    .toLowerCase();


            const cleanMentorEmail =
                mentorEmail
                    .trim()
                    .toLowerCase();


            // ---------------------------------------------
            // FIND STUDENT
            // ---------------------------------------------

            const student =
                await User.findOne({
                    email: cleanStudentEmail
                });


            if (!student) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });

            }


            // ---------------------------------------------
            // FIND MENTOR
            // ---------------------------------------------

            const mentor =
                await User.findOne({
                    email: cleanMentorEmail
                });


            if (!mentor) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Mentor account not found."
                });

            }


            // ---------------------------------------------
            // VERIFY MENTOR ROLE
            // ---------------------------------------------

            if (
                mentor.role !== "mentor"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "The selected account is not a mentor."
                });

            }


            // ---------------------------------------------
            // VERIFY STUDENT IS NOT A MENTOR
            // ---------------------------------------------

            if (
                student.role === "mentor"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "The selected student account is marked as a mentor."
                });

            }


            // ---------------------------------------------
            // PREVENT SELF ASSIGNMENT
            // ---------------------------------------------

            if (
                student._id.toString() ===
                mentor._id.toString()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "A mentor cannot be assigned to themselves."
                });

            }


            // ---------------------------------------------
            // ASSIGN MENTOR
            // ---------------------------------------------

            student.assignedMentor =
                mentor._id;

            await student.save();


            // ---------------------------------------------
            // RETURN RESULT
            // ---------------------------------------------

            res.json({

                success: true,

                message:
                    "Mentor assigned successfully.",

                student: {

                    id: student._id,

                    name: student.name,

                    email: student.email

                },

                mentor: {

                    id: mentor._id,

                    name: mentor.name,

                    email: mentor.email

                }

            });

        } catch (error) {

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
// REMOVE MENTOR ASSIGNMENT
// =====================================================

router.post(
    "/remove-assignment",
    authMiddleware,
    adminOnly,
    async (req, res) => {

        try {

            const {
                studentEmail
            } = req.body;


            // ---------------------------------------------
            // VALIDATE EMAIL
            // ---------------------------------------------

            if (!studentEmail) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Student email is required."
                });

            }


            // ---------------------------------------------
            // FIND STUDENT
            // ---------------------------------------------

            const student =
                await User.findOne({
                    email:
                        studentEmail
                            .trim()
                            .toLowerCase()
                });


            if (!student) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });

            }


            // ---------------------------------------------
            // REMOVE MENTOR
            // ---------------------------------------------

            student.assignedMentor = null;

            await student.save();


            // ---------------------------------------------
            // RETURN RESULT
            // ---------------------------------------------

            res.json({

                success: true,

                message:
                    "Mentor assignment removed."

            });

        } catch (error) {

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


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
