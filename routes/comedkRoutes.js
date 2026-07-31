const express = require("express");

const router = express.Router();

const Comedk = require("../models/Comedk");


// COMEDK Test Route

router.get("/test", (req, res) => {

    res.send("COMEDK route working");

});




// COMEDK Predictor

router.post("/predict", async (req, res) => {

    try {


        const {
            rank,
            category
        } = req.body;



        console.log("COMEDK Request:", req.body);



        if (!rank || !category) {

            return res.status(400).json({

                success: false,

                message: "Rank and category are required"

            });

        }



        const colleges = await Comedk.find({

            category: category,

            closingRank: {

                $gte: Number(rank)

            }

        });



        console.log("Colleges Found:", colleges.length);



        res.status(200).json({

            success: true,

            count: colleges.length,

            data: colleges

        });



    } 
    
    catch(error) {


        console.log("COMEDK ERROR:", error);



        res.status(500).json({

            success: false,

            message: "Prediction failed",

            error: error.message

        });


    }


});



module.exports = router;
