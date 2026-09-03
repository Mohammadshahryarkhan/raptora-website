const express = require("express");
const multer = require("multer");

const Message = require("../models/Message");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();


// =====================================================
// MULTER CONFIGURATION
// =====================================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 50 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",

            "video/mp4",
            "video/webm",
            "video/quicktime",

            "application/pdf"
        ];

        if (!allowedTypes.includes(file.mimetype)) {

            return cb(
                new Error(
                    "Only images, videos and PDF files are allowed."
                )
            );
        }

        cb(null, true);
    }
});


// =====================================================
// SEND TEXT / LINK / CLASS MESSAGE
// =====================================================

router.post(
    "/send",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                receiverId,
                content,
                type,
                url
            } = req.body;


            if (!receiverId) {

                return res.status(400).json({
                    success: false,
                    message: "Receiver is required."
                });

            }


            if (!content || !content.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Message content is required."
                });

            }


            const receiver =
                await User.findById(receiverId);


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

            startOfDay.setHours(
                0,
                0,
                0,
                0
            );


            const endOfDay = new Date();

            endOfDay.setHours(
                23,
                59,
                59,
                999
            );


            const messagesToday =
                await Message.countDocuments({
                    sender: req.user.id,

                    createdAt: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                });


            if (messagesToday >= 100) {

                return res.status(429).json({
                    success: false,
                    message:
                        "Daily message limit reached. Please try again tomorrow."
                });

            }


            const allowedTypes = [
                "text",
                "link",
                "class"
            ];


            const messageType =
                allowedTypes.includes(type)
                    ? type
                    : "text";


            const message =
                await Message.create({

                    sender: req.user.id,

                    receiver: receiverId,

                    type: messageType,

                    content: content.trim(),

                    url:
                        url
                            ? url.trim()
                            : null
                });


            await message.populate(
                "sender",
                "name email role"
            );


            await message.populate(
                "receiver",
                "name email role"
            );


            res.status(201).json({

                success: true,

                message

            });


        } catch (error) {

            console.error(
                "Send message error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to send message."

            });

        }

    }
);


// =====================================================
// UPLOAD PHOTO / VIDEO / PDF AND SEND MESSAGE
// =====================================================

router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),

    async (req, res) => {

        try {

            const {
                receiverId,
                content
            } = req.body;


            // -------------------------------------------------
            // CHECK FILE
            // -------------------------------------------------

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please select a file."

                });

            }


            // -------------------------------------------------
            // CHECK RECEIVER
            // -------------------------------------------------

            if (!receiverId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Receiver is required."

                });

            }


            const receiver =
                await User.findById(receiverId);


            if (!receiver) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Receiver not found."

                });

            }


            // -------------------------------------------------
            // DAILY MESSAGE LIMIT
            // -------------------------------------------------

            const startOfDay = new Date();

            startOfDay.setHours(
                0,
                0,
                0,
                0
            );


            const endOfDay = new Date();

            endOfDay.setHours(
                23,
                59,
                59,
                999
            );


            const messagesToday =
                await Message.countDocuments({

                    sender: req.user.id,

                    createdAt: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }

                });


            if (messagesToday >= 100) {

                return res.status(429).json({

                    success: false,

                    message:
                        "Daily message limit reached. Please try again tomorrow."

                });

            }


            // -------------------------------------------------
            // DETERMINE CLOUDINARY RESOURCE TYPE
            // -------------------------------------------------

            let resourceType = "raw";

            let messageType = "file";


            if (
                req.file.mimetype.startsWith(
                    "image/"
                )
            ) {

                resourceType = "image";

                messageType = "image";

            }


            else if (
                req.file.mimetype.startsWith(
                    "video/"
                )
            ) {

                resourceType = "video";

                messageType = "video";

            }


            else if (
                req.file.mimetype ===
                "application/pdf"
            ) {

                resourceType = "raw";

                messageType = "pdf";

            }


            // -------------------------------------------------
            // UPLOAD TO CLOUDINARY
            // -------------------------------------------------

            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        const uploadStream =
                            cloudinary.uploader.upload_stream(

                                {
                                    resource_type:
                                        resourceType,

                                    folder:
                                        "raptora/chat"
                                },

                                (
                                    error,
                                    result
                                ) => {

                                    if (error) {

                                        reject(
                                            error
                                        );

                                    }

                                    else {

                                        resolve(
                                            result
                                        );

                                    }

                                }

                            );


                        uploadStream.end(
                            req.file.buffer
                        );

                    }
                );


            // -------------------------------------------------
            // SAVE MESSAGE IN MONGODB
            // -------------------------------------------------

            const message =
                await Message.create({

                    sender:
                        req.user.id,

                    receiver:
                        receiverId,

                    type:
                        messageType,

                    content:
                        content
                            ? content.trim()
                            : "",

                    fileUrl:
                        uploadResult.secure_url,

                    fileName:
                        req.file.originalname,

                    mimeType:
                        req.file.mimetype,

                    fileSize:
                        req.file.size,

                    url:
                        null

                });


            // -------------------------------------------------
            // POPULATE USER INFORMATION
            // -------------------------------------------------

            await message.populate(
                "sender",
                "name email role"
            );


            await message.populate(
                "receiver",
                "name email role"
            );


            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            res.status(201).json({

                success: true,

                message

            });


        } catch (error) {

            console.error(
                "File upload error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Unable to upload file."

            });

        }

    }
);


// =====================================================
// GET CONVERSATION
// =====================================================

router.get(
    "/conversation/:userId",
    authMiddleware,
    async (req, res) => {

        try {

            const otherUserId =
                req.params.userId;


            const messages =
                await Message.find({

                    $or: [

                        {
                            sender:
                                req.user.id,

                            receiver:
                                otherUserId
                        },

                        {
                            sender:
                                otherUserId,

                            receiver:
                                req.user.id
                        }

                    ]

                })
                    .populate(
                        "sender",
                        "name email role"
                    )
                    .populate(
                        "receiver",
                        "name email role"
                    )
                    .sort({
                        createdAt: 1
                    });


            res.json({

                success: true,

                messages

            });


        } catch (error) {

            console.error(
                "Conversation fetch error:",
                error
            );


            res.status(500).json({

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

            await Message.updateMany(

                {
                    sender:
                        req.params.userId,

                    receiver:
                        req.user.id,

                    read:
                        false
                },

                {
                    $set: {
                        read: true
                    }
                }

            );


            res.json({

                success: true

            });


        } catch (error) {

            console.error(
                "Mark messages read error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to mark messages as read."

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

            const count =
                await Message.countDocuments({

                    receiver:
                        req.user.id,

                    read:
                        false

                });


            res.json({

                success: true,

                count

            });


        } catch (error) {

            console.error(
                "Unread message count error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to get unread message count."

            });

        }

    }
);


module.exports = router;
