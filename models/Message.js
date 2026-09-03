
const mongoose = require("mongoose");


// =====================================================
// MESSAGE SCHEMA
// =====================================================

const messageSchema = new mongoose.Schema(
    {

        // =====================================================
        // SENDER
        // =====================================================

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // =====================================================
        // RECEIVER
        // =====================================================

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // =====================================================
        // MESSAGE TYPE
        // =====================================================

        type: {
            type: String,
            enum: [
                "text",
                "link",
                "class"
            ],
            default: "text"
        },


        // =====================================================
        // MESSAGE CONTENT
        // =====================================================

        content: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // LINK
        // =====================================================

        url: {
            type: String,
            default: null,
            trim: true
        },


        // =====================================================
        // READ STATUS
        // =====================================================

        read: {
            type: Boolean,
            default: false
        }

    },

    {
        timestamps: true
    }
);


// =====================================================
// INDEXES
// =====================================================

// Makes loading a conversation faster.
messageSchema.index({
    sender: 1,
    receiver: 1,
    createdAt: 1
});

messageSchema.index({
    receiver: 1,
    read: 1
});


// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model("Message", messageSchema);
