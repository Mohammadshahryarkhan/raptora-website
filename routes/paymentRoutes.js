
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const authMiddleware = require("../middleware/authMiddleware");

// IMPORTANT:
// Change this path ONLY if your User model has a different filename/location.
const User = require("../models/User");

const router = express.Router();


// =====================================================
// RAZORPAY
// =====================================================

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

    RAPTORA99: {
        type: "percentage",
        value: 99
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

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return 0;
    }

    let subtotal = 0;

    for (const item of items) {

        const name =
            String(item.name || "").trim();

        const quantity =
            Number(item.quantity || 1);

        const plan =
            MENTOR_PLANS[name];

        // Invalid plan
        if (!plan) {
            return 0;
        }

        // Invalid quantity
        if (
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            return 0;
        }

        subtotal +=
            plan.price * quantity;
    }

    return subtotal;
}


// =====================================================
// CALCULATE DISCOUNT
// =====================================================

function calculateDiscount(
    subtotal,
    coupon
) {

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

    if (
        discountCode.type === "percentage"
    ) {

        discount =
            subtotal *
            discountCode.value /
            100;

    }

    else if (
        discountCode.type === "fixed"
    ) {

        discount =
            discountCode.value;

    }

    return Math.min(
        Math.max(0, discount),
        subtotal
    );
}


// =====================================================
// GET LOGGED-IN USER
// =====================================================

async function getUser(req) {

    if (!req.user || !req.user.id) {
        return null;
    }

    return await User.findById(
        req.user.id
    );
}


// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
    "/create-order",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                items,
                coupon
            } = req.body;


            // -----------------------------------------
            // FIND USER
            // -----------------------------------------

            const user =
                await getUser(req);


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please login before purchasing a mentor plan."

                });

            }


            // -----------------------------------------
            // VALIDATE CART
            // -----------------------------------------

            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your mentor cart is empty."

                });

            }


            // -----------------------------------------
            // CALCULATE SUBTOTAL
            // -----------------------------------------

            const subtotal =
                calculateCartSubtotal(items);


            if (
                subtotal <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid mentor cart."

                });

            }


            // -----------------------------------------
            // CALCULATE DISCOUNT
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


            // -----------------------------------------
            // RAZORPAY CANNOT PROCESS ZERO ORDER
            // -----------------------------------------

            if (
                finalAmount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This discount makes the order free. Razorpay requires a paid order."

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
                            coupon
                                ? String(coupon)
                                    .trim()
                                    .toUpperCase()
                                : "",

                        subtotal:
                            String(subtotal),

                        discount:
                            String(discount),

                        finalAmount:
                            String(finalAmount)

                    }

                });


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            return res.json({

                success: true,

                key:
                    process.env.RAZORPAY_KEY_ID,

                orderId:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency,

                subtotal:
                    subtotal,

                discount:
                    discount,

                finalAmount:
                    finalAmount

            });

        }

        catch (error) {

            console.error(
                "Razorpay order error:",
                error
            );

            return res.status(500).json({

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
    authMiddleware,
    async (req, res) => {

        try {

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                items
            } = req.body;


            // -----------------------------------------
            // VALIDATE PAYMENT DATA
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
            // FIND USER
            // -----------------------------------------

            const user =
                await getUser(req);


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please login again."

                });

            }


            // -----------------------------------------
            // FIND RAZORPAY ORDER
            // -----------------------------------------

            let razorpayOrder;

            try {

                razorpayOrder =
                    await razorpay.orders.fetch(
                        razorpay_order_id
                    );

            }

            catch (error) {

                console.error(
                    "Unable to fetch Razorpay order:",
                    error
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to validate Razorpay order."

                });

            }


            // -----------------------------------------
            // MAKE SURE ORDER BELONGS TO USER
            // -----------------------------------------

            if (
                !razorpayOrder.notes ||
                String(
                    razorpayOrder.notes.userId
                ) !== String(user._id)
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "This payment order does not belong to this account."

                });

            }


            // -----------------------------------------
            // GENERATE SIGNATURE
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
            // CHECK PAYMENT
            // -----------------------------------------

            let payment;

            try {

                payment =
                    await razorpay.payments.fetch(
                        razorpay_payment_id
                    );

            }

            catch (error) {

                console.error(
                    "Unable to fetch Razorpay payment:",
                    error
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to validate payment."

                });

            }


            // -----------------------------------------
            // PAYMENT MUST BE CAPTURED
            // -----------------------------------------

            if (
                payment.status !== "captured"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Payment has not been captured yet."

                });

            }


            // -----------------------------------------
            // PAYMENT MUST MATCH ORDER
            // -----------------------------------------

            if (
                String(payment.order_id) !==
                String(razorpay_order_id)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Payment does not match the order."

                });

            }


            // -----------------------------------------
            // IDENTIFY MENTOR PLAN
            // -----------------------------------------

            let purchasedPlan = null;

            if (
                Array.isArray(items)
            ) {

                for (
                    const item of items
                ) {

                    const name =
                        String(
                            item.name || ""
                        ).trim();

                    const plan =
                        MENTOR_PLANS[name];

                    if (plan) {

                        purchasedPlan = {

                            name:
                                name,

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
            // START DATE
            // -----------------------------------------

            const startDate =
                new Date();


            // -----------------------------------------
            // END DATE
            // -----------------------------------------

            const endDate =
                new Date(startDate);


            endDate.setMonth(
                endDate.getMonth() +
                purchasedPlan.months
            );


            // -----------------------------------------
            // MILESTONES
            // -----------------------------------------

            const milestones = [

                {
                    title:
                        "Complete Student Profile",

                    description:
                        "Complete your Raptora student profile.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Mentor Introduction",

                    description:
                        "Connect with your assigned Raptora mentor.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Understand Your Goals",

                    description:
                        "Discuss your college and career goals with your mentor.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "College Shortlisting",

                    description:
                        "Create your personalized college shortlist.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Rank & College Strategy",

                    description:
                        "Review your predicted colleges and admission strategy.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Application Planning",

                    description:
                        "Plan your applications and important admission deadlines.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Document Preparation",

                    description:
                        "Prepare the documents required for admission.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Application Review",

                    description:
                        "Review your applications before submission.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Admission Updates",

                    description:
                        "Track important admission and counselling updates.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Final College Decision",

                    description:
                        "Finalize your college choice with mentor guidance.",

                    completed:
                        false,

                    completedDate:
                        null
                }

            ];


            // -----------------------------------------
            // UPDATE MENTOR SUBSCRIPTION
            // -----------------------------------------

            user.mentorSubscription = {

                active:
                    true,

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
            // PROGRESS
            // -----------------------------------------

            user.mentorshipProgress = {

                completedMilestones:
                    0,

                totalMilestones:
                    milestones.length,

                currentMilestone:
                    milestones[0].title

            };


            // -----------------------------------------
            // SAVE MILESTONES
            // -----------------------------------------

            user.milestones =
                milestones;


            // -----------------------------------------
            // BADGE
            // -----------------------------------------

            user.badge =
                "Raptora Mentor Member";


            // -----------------------------------------
            // PAYMENT STATUS
            // -----------------------------------------

            user.paymentStatus =
                "paid";

            user.razorpayPaymentId =
                razorpay_payment_id;

            user.razorpayOrderId =
                razorpay_order_id;


            // -----------------------------------------
            // SAVE USER TO MONGODB
            // -----------------------------------------

            await user.save();


            // -----------------------------------------
            // LOG
            // -----------------------------------------

            console.log(
                "Payment verified:",
                razorpay_payment_id
            );

            console.log(
                "Mentorship activated for:",
                user.email
            );


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            return res.json({

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

            return res.status(500).json({

                success: false,

                message:
                    "Payment verification failed."

            });

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;

