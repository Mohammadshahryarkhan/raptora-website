const mongoose = require("mongoose");


const comedkSchema = new mongoose.Schema({

    college:{
        type:String,
        required:true
    },

    branch:{
        type:String,
        required:true
    },

    category:{
        type:String,
        required:true
    },

    closingRank:{
        type:Number,
        required:true
    }

});


module.exports = mongoose.model("Comedk", comedkSchema);