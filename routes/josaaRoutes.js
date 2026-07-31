const express = require("express");

const router = express.Router();

const Josaa = require("../models/Josaa");


// JEE / JOSAA Rank Predictor

router.post("/predict", async (req, res) => {

    try {


        const {
            rank,
            category,
            quota
        } = req.body;



        // Validation

        if (!rank || !category || !quota) {

            return res.status(400).json({

                success: false,

                message: "Rank, category and quota are required"

            });

        }



        // Find eligible colleges

        const colleges = await Josaa.find({

            category: category,

            quota: quota,

            closingRank: {

                $gte: Number(rank)

            }

        });



        res.status(200).json({

            success: true,

            count: colleges.length,

            data: colleges

        });



    }

    catch (error) {


        console.log("JOSAA Error:", error);


        res.status(500).json({

            success: false,

            message: "Prediction failed",

            error: error.message

        });


    }


});



module.exports = router;
