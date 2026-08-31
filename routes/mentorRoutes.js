const express = require("express");

const router = express.Router();


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


module.exports = router;
