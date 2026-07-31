const mongoose = require("mongoose");


const mccSchema = new mongoose.Schema({

    college:{
        type:String,
        required:true
    },

    course:{
        type:String,
        required:true
    },

    category:{
        type:String,
        required:true
    },

    quota:{
        type:String,
        required:true
    },

    closingRank:{
        type:Number,
        required:true
    }

});


module.exports = mongoose.model("Mcc", mccSchema);