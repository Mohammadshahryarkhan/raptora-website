
const express = require("express");

const Message = require("../models/Message");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// SEND MESSAGE
// =====================================================

router.post("/send", authMiddleware, async (req, res) => {

    try {

        const senderId = req.user.id;

        const {
            receiverId,
            content,
            type = "text",
            url = null
        } = req.body;


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Receiver is required."
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty."
            });
        }


        // -------------------------------------------------
        // CHECK RECEIVER
        // -------------------------------------------------

        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found."
            });
        }


        // -------------------------------------------------
        // DAILY MESSAGE LIMIT
        // -------------------------------------------------

        const startOfDay = new Date();

        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();

        endOfDay.setHours(23, 59, 59, 999);


        const messagesToday = await Message.countDocuments({
            sender: senderId,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });


        if (messagesToday >= 100) {
            return res.status(429).json({
                success: false,
                message: "Daily message limit of 100 reached."
            });
        }


        // -------------------------------------------------
        // CREATE MESSAGE
        // -------------------------------------------------

        const message = await Message.create({

            sender: senderId,

            receiver: receiverId,

            type: [
                "text",
                "link",
                "class"
            ].includes(type)
                ? type
                : "text",

            content: content.trim(),

            url: url || null,

            read: false

        });


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        const populatedMessage =
            await Message.findById(message._id)
                .populate("sender", "name email role")
                .populate("receiver", "name email role");


        return res.status(201).json({

            success: true,

            message: populatedMessage

        });

    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Unable to send message."

        });

    }

});


// =====================================================
// GET CONVERSATION
// =====================================================

router.get(
    "/conversation/:userId",
    authMiddleware,
    async (req, res) => {

        try {

            const currentUserId = req.user.id;

            const otherUserId = req.params.userId;


            const messages =
                await Message.find({

                    $or: [

                        {
                            sender: currentUserId,
                            receiver: otherUserId
                        },

                        {
                            sender: otherUserId,
                            receiver: currentUserId
                        }

                    ]

                })
                .sort({
                    createdAt: 1
                })
                .populate(
                    "sender",
                    "name email role"
                )
                .populate(
                    "receiver",
                    "name email role"
                );


            return res.json({

                success: true,

                messages

            });

        } catch (error) {

            console.error(
                "Get conversation error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load conversation."

            });

        }

    }
);


// =====================================================
// MARK MESSAGES AS READ
// =====================================================

router.put(
    "/read/:userId",
    authMiddleware,
    async (req, res) => {

        try {

            const currentUserId = req.user.id;

            const otherUserId = req.params.userId;


            await Message.updateMany(

                {
                    sender: otherUserId,

                    receiver: currentUserId,

                    read: false
                },

                {
                    $set: {
                        read: true
                    }
                }

            );


            return res.json({

                success: true,

                message:
                    "Messages marked as read."

            });

        } catch (error) {

            console.error(
                "Mark messages read error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to update messages."

            });

        }

    }
);


// =====================================================
// UNREAD MESSAGE COUNT
// =====================================================

router.get(
    "/unread",
    authMiddleware,
    async (req, res) => {

        try {

            const currentUserId = req.user.id;


            const unreadCount =
                await Message.countDocuments({

                    receiver: currentUserId,

                    read: false

                });


            return res.json({

                success: true,

                unreadCount

            });

        } catch (error) {

            console.error(
                "Unread message error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to get unread messages."

            });

        }

    }
);


module.exports = router;

