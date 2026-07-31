const express = require("express");

const router = express.Router();

const Comedk = require("../models/Comedk");


router.post("/predict", async(req,res)=>{

    try{

        const {rank, category} = req.body;


        const colleges = await Comedk.find({

            category: category,

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