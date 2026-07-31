const express = require("express");

const router = express.Router();

const Mcc = require("../models/Mcc");



router.post("/predict", async(req,res)=>{


    try{


        const {
            rank,
            category,
            quota
        } = req.body;



        const colleges = await Mcc.find({

            category: category,

            quota: quota,

            closingRank:{
                $gte:Number(rank)
            }

        });



        res.json({

            colleges: colleges

        });


    }

    catch(error){


        console.log(error);


        res.status(500).json({

            message:"Server Error"

        });


    }


});



module.exports = router;