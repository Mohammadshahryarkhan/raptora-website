const express = require("express");

const router = express.Router();

// GET all mentors
router.get("/", async (req, res) => {
  try {
    const mentors = [
      {
        id: "mentor_1",
        name: "Raptora Mentor",
        role: "College Admission Expert",
        description:
          "Get personalized guidance for your college admission journey.",
        price: 499,
        available: true
      }
    ];

    res.json({
      success: true,
      mentors
    });
  } catch (error) {
    console.error("Mentor fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch mentors"
    });
  }
});

module.exports = router;
