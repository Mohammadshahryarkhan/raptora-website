
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// VALID MENTOR PLANS
// =====================================================

const MENTOR_PLANS = {

    "1 Month Mentor Plan": {
        price: 400,
        months: 1
    },

    "3 Months Mentor Plan": {
        price: 1100,
        months: 3
    },

    "6 Months Mentor Plan": {
        price: 2200,
        months: 6
    },

    "12 Months Mentor Plan": {
        price: 4600,
        months: 12
    }

};


// =====================================================
// DISCOUNT CODES
// =====================================================

const DISCOUNT_CODES = {

    RAPTORA8: {
        type: "percentage",
        value: 8
    },

    RAPTORA10: {
        type: "percentage",
        value: 10
    },

    RAPTORA100: {
        type: "percentage",
        value: 100
    },

    PAPA99: {
        type: "percentage",
        value: 99
    },

    WELCOME50: {
        type: "fixed",
        value: 50
    }

};


// =====================================================
// CALCULATE CART SUBTOTAL
// =====================================================

function calculateCartSubtotal(items) {

    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }

    let subtotal = 0;

    for (const item of items) {

        const name = String(item.name || "");
        const quantity = Number(item.quantity || 1);

        const plan = MENTOR_PLANS[name];

        if (!plan) {
            return 0;
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return 0;
        }

        subtotal += plan.price * quantity;
    }

    return subtotal;
}


// =====================================================
// CALCULATE DISCOUNT
// =====================================================

function calculateDiscount(subtotal, coupon) {

    if (!coupon) {
        return 0;
    }

    const code =
        String(coupon)
            .trim()
            .toUpperCase();

    const discountCode =
        DISCOUNT_CODES[code];

    if (!discountCode) {
        return 0;
    }

    let discount = 0;

    if (discountCode.type === "percentage") {

        discount =
            subtotal *
            discountCode.value /
            100;

    }

    else if (discountCode.type === "fixed") {

        discount =
            discountCode.value;

    }

    return Math.min(
        discount,
        subtotal
    );
}


// =====================================================
// GET USER FROM JWT
// =====================================================

async function getUserFromToken(req) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    if (!authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token =
        authHeader.split(" ")[1];

    if (!token) {
        return null;
    }

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User.findById(decoded.id);

        return user || null;

    } catch (error) {

        console.error(
            "JWT verification error:",
            error
        );

        return null;
    }
}


// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
    "/create-order",
    async (req, res) => {

        try {

            const {
                items,
                coupon
            } = req.body;


            // -----------------------------------------
            // USER
            // -----------------------------------------

            const user =
                await getUserFromToken(req);


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please login before purchasing a mentor plan."

                });

            }


            // -----------------------------------------
            // CART
            // -----------------------------------------

            const subtotal =
                calculateCartSubtotal(items);


            if (
                !subtotal ||
                subtotal <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid mentor cart."

                });

            }


            // -----------------------------------------
            // DISCOUNT
            // -----------------------------------------

            const discount =
                calculateDiscount(
                    subtotal,
                    coupon
                );


            // -----------------------------------------
            // FINAL AMOUNT
            // -----------------------------------------

            const finalAmount =
                Math.max(
                    0,
                    subtotal - discount
                );


            /*
             * Razorpay does not accept a zero-value order.
             *
             * Therefore 100% discount codes cannot be
             * processed through Razorpay.
             */

            if (
                !finalAmount ||
                finalAmount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This discount makes the order free. Please use a paid order."

                });

            }


            // -----------------------------------------
            // CREATE ORDER
            // -----------------------------------------

            const order =
                await razorpay.orders.create({

                    amount:
                        Math.round(
                            finalAmount * 100
                        ),

                    currency:
                        "INR",

                    receipt:
                        `raptora_${Date.now()}`,

                    notes: {

                        userId:
                            String(user._id),

                        coupon:
                            coupon || "",

                        discount:
                            String(discount),

                        subtotal:
                            String(subtotal)

                    }

                });


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.json({

                success: true,

                key:
                    process.env.RAZORPAY_KEY_ID,

                orderId:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency

            });

        }


        catch (error) {

            console.error(
                "Razorpay order error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to create payment order."

            });

        }

    }
);


// =====================================================
// VERIFY PAYMENT + ACTIVATE MENTORSHIP
// =====================================================

router.post(
    "/verify",
    async (req, res) => {

        try {

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                items
            } = req.body;


            // -----------------------------------------
            // PAYMENT DATA
            // -----------------------------------------

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Missing payment information."

                });

            }


            // -----------------------------------------
            // USER
            // -----------------------------------------

            const user =
                await getUserFromToken(req);


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please login again."

                });

            }


            // -----------------------------------------
            // SIGNATURE
            // -----------------------------------------

            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env.RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${razorpay_order_id}|${razorpay_payment_id}`
                    )
                    .digest("hex");


            // -----------------------------------------
            // SAFE SIGNATURE COMPARISON
            // -----------------------------------------

            if (
                generatedSignature.length !==
                razorpay_signature.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            if (
                !crypto.timingSafeEqual(
                    Buffer.from(
                        generatedSignature,
                        "utf8"
                    ),
                    Buffer.from(
                        razorpay_signature,
                        "utf8"
                    )
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            // -----------------------------------------
            // FIND PURCHASED PLAN
            // -----------------------------------------

            let purchasedPlan = null;

            if (Array.isArray(items)) {

                for (const item of items) {

                    const plan =
                        MENTOR_PLANS[
                            String(item.name || "")
                        ];

                    if (plan) {

                        purchasedPlan = {

                            name:
                                String(item.name),

                            price:
                                plan.price,

                            months:
                                plan.months

                        };

                        break;
                    }

                }

            }


            if (!purchasedPlan) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to identify mentor plan."

                });

            }


            // -----------------------------------------
            // DATES
            // -----------------------------------------

            const startDate =
                new Date();


            const endDate =
                new Date(
                    startDate
                );

            endDate.setMonth(
                endDate.getMonth() +
                purchasedPlan.months
            );


            // -----------------------------------------
            // UPDATE USER
            // -----------------------------------------

            user.mentorSubscription = {

                active: true,

                plan:
                    purchasedPlan.name,

                durationMonths:
                    purchasedPlan.months,

                price:
                    purchasedPlan.price,

                startDate:
                    startDate,

                endDate:
                    endDate,

                razorpayOrderId:
                    razorpay_order_id,

                razorpayPaymentId:
                    razorpay_payment_id

            };


            // -----------------------------------------
            // COURSE START DATE
            // -----------------------------------------

            user.courseStartDate =
                startDate;


            // -----------------------------------------
            // DEFAULT MENTORSHIP PROGRESS
            // -----------------------------------------

            user.mentorshipProgress = {

                completedMilestones:
                    0,

                totalMilestones:
                    10,

                currentMilestone:
                    "Getting Started"

            };


            // -----------------------------------------
            // BADGE
            // -----------------------------------------

            user.badge =
                "Raptora Mentor Member";


            await user.save();


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            console.log(
                "Razorpay payment verified and mentorship activated:",
                razorpay_payment_id
            );


            res.json({

                success: true,

                message:
                    "Payment verified and mentor plan activated.",

                paymentId:
                    razorpay_payment_id,

                orderId:
                    razorpay_order_id,

                mentorPlan:
                    purchasedPlan.name,

                startDate:
                    startDate,

                endDate:
                    endDate

            });

        }


        catch (error) {

            console.error(
                "Payment verification error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Payment verification failed."

            });

        }

    }
);


module.exports = router;

