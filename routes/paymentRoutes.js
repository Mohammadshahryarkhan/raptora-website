
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const authMiddleware = require("../middleware/authMiddleware");
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

        if (!plan) {
            return 0;
        }

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

    } else if (
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

    if (
        !req.user ||
        !req.user.id
    ) {
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
            // CHECK RAZORPAY CONFIG
            // -----------------------------------------

            if (
                !process.env.RAZORPAY_KEY_ID ||
                !process.env.RAZORPAY_KEY_SECRET
            ) {

                console.error(
                    "Razorpay environment variables are missing."
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Razorpay is not configured on the server."

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
            // RAZORPAY ZERO AMOUNT CHECK
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
            // CREATE RAZORPAY ORDER
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


            console.log(
                "Razorpay order created:",
                order.id
            );

            console.log(
                "User:",
                user.email
            );

            console.log(
                "Amount:",
                finalAmount
            );


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
                "================================="
            );

            console.error(
                "RAZORPAY CREATE ORDER ERROR"
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Stack:",
                error.stack
            );

            console.error(
                "================================="
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
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

            console.log(
                "================================="
            );

            console.log(
                "RAZORPAY PAYMENT VERIFICATION STARTED"
            );

            console.log(
                "================================="
            );


            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                items
            } = req.body;


            // -----------------------------------------
            // CHECK RAZORPAY CONFIG
            // -----------------------------------------

            if (
                !process.env.RAZORPAY_KEY_ID ||
                !process.env.RAZORPAY_KEY_SECRET
            ) {

                console.error(
                    "Razorpay environment variables are missing."
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Razorpay is not configured on the server."

                });

            }


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


            console.log(
                "Order ID:",
                razorpay_order_id
            );

            console.log(
                "Payment ID:",
                razorpay_payment_id
            );


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


            console.log(
                "Authenticated user:",
                user.email
            );


            // -----------------------------------------
            // FETCH RAZORPAY ORDER
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
                    "Unable to fetch Razorpay order."
                );

                console.error(
                    error.message
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to validate Razorpay order."

                });

            }


            // -----------------------------------------
            // CHECK ORDER OWNER
            // -----------------------------------------

            if (
                !razorpayOrder.notes ||
                String(
                    razorpayOrder.notes.userId
                ) !== String(user._id)
            ) {

                console.error(
                    "Order owner mismatch."
                );

                return res.status(403).json({

                    success: false,

                    message:
                        "This payment order does not belong to this account."

                });

            }


            // -----------------------------------------
            // GENERATE RAZORPAY SIGNATURE
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
            // COMPARE SIGNATURE LENGTH
            // -----------------------------------------

            if (
                generatedSignature.length !==
                razorpay_signature.length
            ) {

                console.error(
                    "Signature length mismatch."
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            // -----------------------------------------
            // SAFE SIGNATURE COMPARISON
            // -----------------------------------------

            const signatureMatches =
                crypto.timingSafeEqual(

                    Buffer.from(
                        generatedSignature,
                        "utf8"
                    ),

                    Buffer.from(
                        razorpay_signature,
                        "utf8"
                    )

                );


            if (!signatureMatches) {

                console.error(
                    "Invalid Razorpay signature."
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            console.log(
                "Razorpay signature verified."
            );


            // -----------------------------------------
            // FETCH PAYMENT
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
                    "Unable to fetch Razorpay payment."
                );

                console.error(
                    error.message
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to validate payment."

                });

            }


            console.log(
                "Payment status:",
                payment.status
            );


            // -----------------------------------------
            // PAYMENT STATUS
            // -----------------------------------------

            if (
                payment.status !== "captured"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Payment has not been captured. Current status: ${payment.status}`

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


            // -----------------------------------------
            // FALLBACK TO RAZORPAY ORDER NOTES
            // -----------------------------------------

            if (!purchasedPlan) {

                console.log(
                    "Could not identify plan from frontend items."
                );

                console.log(
                    "Attempting to identify plan from order amount."
                );


                const orderAmount =
                    Number(
                        razorpayOrder.amount || 0
                    ) / 100;


                for (
                    const [name, plan]
                    of Object.entries(
                        MENTOR_PLANS
                    )
                ) {

                    const discount =
                        calculateDiscount(
                            plan.price,
                            razorpayOrder.notes
                                ? razorpayOrder.notes.coupon
                                : ""
                        );


                    const expectedAmount =
                        plan.price -
                        discount;


                    if (
                        Math.abs(
                            expectedAmount -
                            orderAmount
                        ) < 0.01
                    ) {

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


            console.log(
                "Purchased mentor plan:",
                purchasedPlan.name
            );


            // -----------------------------------------
            // START DATE
            // -----------------------------------------

            const startDate =
                new Date();


            // -----------------------------------------
            // END DATE
            // -----------------------------------------

            const endDate =
                new Date(
                    startDate
                );


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
            // MENTORSHIP PROGRESS
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
            // SAVE USER
            // -----------------------------------------

            console.log(
                "Saving user to MongoDB..."
            );


            await user.save();


            console.log(
                "User saved successfully."
            );


            // -----------------------------------------
            // SUCCESS LOG
            // -----------------------------------------

            console.log(
                "================================="
            );

            console.log(
                "PAYMENT VERIFIED SUCCESSFULLY"
            );

            console.log(
                "Payment ID:",
                razorpay_payment_id
            );

            console.log(
                "User:",
                user.email
            );

            console.log(
                "Plan:",
                purchasedPlan.name
            );

            console.log(
                "================================="
            );


            // -----------------------------------------
            // SUCCESS RESPONSE
            // -----------------------------------------

            return res.json({

                success:
                    true,

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
                "================================="
            );

            console.error(
                "PAYMENT VERIFICATION ERROR"
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Name:",
                error.name
            );

            console.error(
                "Stack:",
                error.stack
            );

            if (
                error.errors
            ) {

                console.error(
                    "MONGOOSE VALIDATION ERRORS:"
                );

                for (
                    const field
                    of Object.keys(
                        error.errors
                    )
                ) {

                    console.error(
                        field,
                        ":",
                        error.errors[field].message
                    );

                }

            }

            console.error(
                "================================="
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    error.message ||
                    "Payment verification failed."

            });

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
