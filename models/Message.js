const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "text",
                "link",
                "class",
                "image",
                "video",
                "pdf",
                "file"
            ],
            default: "text"
        },

        content: {
            type: String,
            default: "",
            trim: true
        },

        url: {
            type: String,
            default: null,
            trim: true
        },

        // Uploaded file information
        fileUrl: {
            type: String,
            default: null,
            trim: true
        },

        fileName: {
            type: String,
            default: null,
            trim: true
        },

        mimeType: {
            type: String,
            default: null,
            trim: true
        },

        fileSize: {
            type: Number,
            default: null
        },

        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);


// Conversation query index
messageSchema.index({
    sender: 1,
    receiver: 1,
    createdAt: 1
});


// Unread message query index
messageSchema.index({
    receiver: 1,
    read: 1
});


// File message query index
messageSchema.index({
    type: 1,
    createdAt: 1
});


module.exports = mongoose.model("Message", messageSchema);
