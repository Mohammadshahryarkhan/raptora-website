/* =====================================================
   RAPTORA — MENTORS
   CART + DISCOUNT + RAZORPAY + AUTHENTICATED PAYMENT
   + DASHBOARD REDIRECT
===================================================== */

const API_BASE_URL =
    "https://raptora-website-1.onrender.com";


/* =====================================================
   CART
===================================================== */

let cart = JSON.parse(
    localStorage.getItem("raptoraMentorCart")
) || [];


/* =====================================================
   DISCOUNT STATE
===================================================== */

let appliedCoupon = "";
let discountAmount = 0;


/* =====================================================
   DISCOUNT CODES
===================================================== */

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


/* =====================================================
   AUTH TOKEN
===================================================== */

function getAuthToken() {

    return localStorage.getItem("token");

}


/* =====================================================
   AUTH HEADERS
===================================================== */

function getAuthHeaders() {

    const token =
        getAuthToken();


    if (!token) {
        return {
            "Content-Type": "application/json"
        };
    }


    return {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${token}`

    };

}


/* =====================================================
   SAVE CART
===================================================== */

function saveCart() {

    localStorage.setItem(
        "raptoraMentorCart",
        JSON.stringify(cart)
    );

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(name, price) {

    const existingItem =
        cart.find(
            item => item.name === name
        );


    if (existingItem) {

        existingItem.quantity =
            Number(existingItem.quantity || 1) + 1;

    }

    else {

        cart.push({

            name:
                name,

            price:
                Number(price),

            quantity:
                1

        });

    }


    saveCart();

    updateCart();

    openCart();

}


/* =====================================================
   INCREASE QUANTITY
===================================================== */

function increaseQuantity(index) {

    if (!cart[index]) {
        return;
    }


    cart[index].quantity =
        Number(cart[index].quantity || 1) + 1;


    saveCart();

    updateCart();

}


/* =====================================================
   DECREASE QUANTITY
===================================================== */

function decreaseQuantity(index) {

    if (!cart[index]) {
        return;
    }


    const quantity =
        Number(
            cart[index].quantity || 1
        );


    if (quantity > 1) {

        cart[index].quantity =
            quantity - 1;

    }

    else {

        cart.splice(
            index,
            1
        );

    }


    saveCart();

    updateCart();

}


/* =====================================================
   REMOVE ITEM
===================================================== */

function removeFromCart(index) {

    if (
        index < 0 ||
        index >= cart.length
    ) {
        return;
    }


    cart.splice(
        index,
        1
    );


    saveCart();

    updateCart();

}


/* =====================================================
   GET SUBTOTAL
===================================================== */

function getCartSubtotal() {

    return cart.reduce(

        (
            total,
            item
        ) => {

            const price =
                Number(
                    item.price || 0
                );

            const quantity =
                Number(
                    item.quantity || 1
                );


            return total +
                (
                    price *
                    quantity
                );

        },

        0

    );

}


/* =====================================================
   GET TOTAL QUANTITY
===================================================== */

function getCartQuantity() {

    return cart.reduce(

        (
            total,
            item
        ) => {

            return total +
                Number(
                    item.quantity || 1
                );

        },

        0

    );

}


/* =====================================================
   GET FINAL TOTAL
===================================================== */

function getFinalTotal() {

    const subtotal =
        getCartSubtotal();


    const total =
        subtotal -
        discountAmount;


    return Math.max(
        0,
        total
    );

}


/* =====================================================
   APPLY DISCOUNT
===================================================== */

function applyDiscount() {

    const input =
        document.getElementById(
            "discount-code"
        );


    if (!input) {
        return;
    }


    const code =
        input.value
            .trim()
            .toUpperCase();


    const subtotal =
        getCartSubtotal();


    if (subtotal <= 0) {

        showDiscountMessage(
            "Add a mentor plan to your cart first.",
            false
        );

        return;

    }


    if (!code) {

        appliedCoupon = "";

        discountAmount = 0;


        showDiscountMessage(
            "Please enter a discount code.",
            false
        );


        updateCart();

        return;

    }


    const coupon =
        DISCOUNT_CODES[code];


    if (!coupon) {

        appliedCoupon = "";

        discountAmount = 0;


        showDiscountMessage(
            "Invalid discount code.",
            false
        );


        updateCart();

        return;

    }


    if (
        coupon.type ===
        "percentage"
    ) {

        discountAmount =
            subtotal *
            coupon.value /
            100;

    }

    else if (
        coupon.type ===
        "fixed"
    ) {

        discountAmount =
            coupon.value;

    }


    discountAmount =
        Math.min(
            Math.max(
                0,
                discountAmount
            ),
            subtotal
        );


    appliedCoupon =
        code;


    showDiscountMessage(
        `${code} applied successfully.`,
        true
    );


    updateCart();

}


/* =====================================================
   QUICK COUPON
===================================================== */

function useCoupon(code) {

    const input =
        document.getElementById(
            "discount-code"
        );


    if (!input) {
        return;
    }


    input.value =
        code;


    applyDiscount();

}


/* =====================================================
   REMOVE DISCOUNT
===================================================== */

function removeDiscount() {

    appliedCoupon = "";

    discountAmount = 0;


    const input =
        document.getElementById(
            "discount-code"
        );


    if (input) {

        input.value =
            "";

        input.disabled =
            false;

    }


    showDiscountMessage(
        "",
        true
    );


    updateCart();

}


/* =====================================================
   DISCOUNT MESSAGE
===================================================== */

function showDiscountMessage(
    message,
    success
) {

    const element =
        document.getElementById(
            "discount-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "success",
        "error"
    );


    if (!message) {
        return;
    }


    element.classList.add(
        success
            ? "success"
            : "error"
    );

}


/* =====================================================
   UPDATE CART
===================================================== */

function updateCart() {

    const cartItems =
        document.getElementById(
            "cart-items"
        );

    const cartCount =
        document.getElementById(
            "cart-count"
        );

    const subtotalElement =
        document.getElementById(
            "cart-subtotal"
        );

    const discountElement =
        document.getElementById(
            "cart-discount"
        );

    const discountRow =
        document.getElementById(
            "cart-discount-row"
        );

    const totalElement =
        document.getElementById(
            "cart-total"
        );

    const checkoutButton =
        document.getElementById(
            "checkout-button"
        );


    if (!cartItems) {
        return;
    }


    /* -----------------------------------------------
       NORMALIZE CART
    ------------------------------------------------ */

    cart =
        cart.map(
            item => ({

                ...item,

                price:
                    Number(
                        item.price || 0
                    ),

                quantity:
                    Number(
                        item.quantity
                    ) > 0

                        ? Number(
                            item.quantity
                          )

                        : 1

            })
        );


    /* -----------------------------------------------
       CART COUNT
    ------------------------------------------------ */

    if (cartCount) {

        cartCount.textContent =
            getCartQuantity();

    }


    /* -----------------------------------------------
       EMPTY CART
    ------------------------------------------------ */

    if (cart.length === 0) {

        appliedCoupon = "";

        discountAmount = 0;


        cartItems.innerHTML = `

            <div class="empty-cart">
                Your cart is empty.
            </div>

        `;


        if (subtotalElement) {

            subtotalElement.textContent =
                "₹0";

        }


        if (discountElement) {

            discountElement.textContent =
                "-₹0";

        }


        if (discountRow) {

            discountRow.style.display =
                "none";

        }


        if (totalElement) {

            totalElement.textContent =
                "₹0";

        }


        if (checkoutButton) {

            checkoutButton.disabled =
                true;

        }


        saveCart();

        return;

    }


    /* -----------------------------------------------
       CART ITEMS
    ------------------------------------------------ */

    cartItems.innerHTML =
        "";


    cart.forEach(
        (
            item,
            index
        ) => {

            const price =
                Number(
                    item.price || 0
                );

            const quantity =
                Number(
                    item.quantity || 1
                );

            const itemTotal =
                price *
                quantity;


            const itemElement =
                document.createElement(
                    "div"
                );


            itemElement.className =
                "cart-item";


            itemElement.innerHTML = `

                <div class="cart-item-top">

                    <div>

                        <div class="cart-item-name">

                            ${escapeHTML(
                                item.name
                            )}

                        </div>


                        <div class="cart-item-price">

                            ₹${price.toLocaleString(
                                "en-IN"
                            )}

                            each

                        </div>

                    </div>


                    <div class="cart-item-total">

                        ₹${itemTotal.toLocaleString(
                            "en-IN"
                        )}

                    </div>

                </div>


                <div class="cart-item-bottom">

                    <div class="quantity-control">

                        <button
                            type="button"
                            class="quantity-button"
                            onclick="decreaseQuantity(${index})">

                            −

                        </button>


                        <span class="quantity-value">

                            ${quantity}

                        </span>


                        <button
                            type="button"
                            class="quantity-button"
                            onclick="increaseQuantity(${index})">

                            +

                        </button>

                    </div>


                    <button
                        type="button"
                        class="remove-item"
                        onclick="removeFromCart(${index})">

                        Remove

                    </button>

                </div>

            `;


            cartItems.appendChild(
                itemElement
            );

        }
    );


    /* -----------------------------------------------
       TOTALS
    ------------------------------------------------ */

    const subtotal =
        getCartSubtotal();


    if (
        discountAmount >
        subtotal
    ) {

        discountAmount =
            subtotal;

    }


    const finalTotal =
        getFinalTotal();


    /* -----------------------------------------------
       SUBTOTAL
    ------------------------------------------------ */

    if (subtotalElement) {

        subtotalElement.textContent =
            "₹" +
            subtotal.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    /* -----------------------------------------------
       DISCOUNT
    ------------------------------------------------ */

    if (discountRow) {

        if (
            appliedCoupon &&
            discountAmount > 0
        ) {

            discountRow.style.display =
                "flex";

        }

        else {

            discountRow.style.display =
                "none";

        }

    }


    if (discountElement) {

        discountElement.textContent =
            "-₹" +
            discountAmount.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    /* -----------------------------------------------
       FINAL TOTAL
    ------------------------------------------------ */

    if (totalElement) {

        totalElement.textContent =
            "₹" +
            finalTotal.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    /* -----------------------------------------------
       CHECKOUT
    ------------------------------------------------ */

    if (checkoutButton) {

        checkoutButton.disabled =
            finalTotal <= 0;

    }


    saveCart();

}


/* =====================================================
   OPEN CART
===================================================== */

function openCart() {

    const drawer =
        document.getElementById(
            "cart-drawer"
        );

    const overlay =
        document.getElementById(
            "cart-overlay"
        );


    if (drawer) {

        drawer.classList.add(
            "active"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE CART
===================================================== */

function closeCart() {

    const drawer =
        document.getElementById(
            "cart-drawer"
        );

    const overlay =
        document.getElementById(
            "cart-overlay"
        );


    if (drawer) {

        drawer.classList.remove(
            "active"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}


/* =====================================================
   SAVE PURCHASE FOR DASHBOARD
===================================================== */

function savePurchaseForDashboard(
    payment,
    planItems,
    subtotal,
    discount,
    finalAmount
) {

    const existingPurchaseData =
        JSON.parse(
            localStorage.getItem(
                "raptoraMentorship"
            )
        ) || {};


    const startDate =
        new Date();


    const planName =
        planItems.length === 1

            ? planItems[0].name

            : planItems
                .map(
                    item => item.name
                )
                .join(", ");


    /* -----------------------------------------------
       DETERMINE DURATION
    ------------------------------------------------ */

    let durationMonths =
        1;


    if (
        planName.includes(
            "3 Months"
        )
    ) {

        durationMonths =
            3;

    }

    else if (
        planName.includes(
            "6 Months"
        )
    ) {

        durationMonths =
            6;

    }

    else if (
        planName.includes(
            "12 Months"
        )
    ) {

        durationMonths =
            12;

    }


    const endDate =
        new Date(
            startDate
        );


    endDate.setMonth(
        endDate.getMonth() +
        durationMonths
    );


    const purchaseData = {

        active:
            true,

        planName:
            planName,

        durationMonths:
            durationMonths,

        startDate:
            startDate.toISOString(),

        endDate:
            endDate.toISOString(),

        subtotal:
            subtotal,

        discount:
            discount,

        finalAmount:
            finalAmount,

        coupon:
            appliedCoupon,

        paymentId:
            payment.razorpay_payment_id,

        orderId:
            payment.razorpay_order_id,

        purchasedAt:
            new Date().toISOString(),

        referralPoints:
            Number(
                existingPurchaseData.referralPoints || 0
            ),

        badge:
            existingPurchaseData.badge ||
            "Mentorship Member"

    };


    localStorage.setItem(
        "raptoraMentorship",
        JSON.stringify(
            purchaseData
        )
    );


    /* -----------------------------------------------
       DASHBOARD FLAGS
    ------------------------------------------------ */

    localStorage.setItem(
        "raptoraMentorActive",
        "true"
    );


    localStorage.setItem(
        "raptoraMentorPlan",
        planName
    );


    localStorage.setItem(
        "raptoraMentorStartDate",
        startDate.toISOString()
    );


    localStorage.setItem(
        "raptoraMentorEndDate",
        endDate.toISOString()
    );


    localStorage.setItem(
        "raptoraPaymentId",
        payment.razorpay_payment_id
    );


    localStorage.setItem(
        "raptoraOrderId",
        payment.razorpay_order_id
    );

}


/* =====================================================
   REDIRECT TO DASHBOARD
===================================================== */

function redirectToDashboard() {

    window.location.href =
        "../frontend/dashboard.html";

}


/* =====================================================
   CHECK LOGIN
===================================================== */

function requireLogin() {

    const token =
        getAuthToken();


    if (!token) {

        alert(
            "Please login before purchasing a mentor plan."
        );


        window.location.href =
            "../frontend/login.html";


        return false;

    }


    return true;

}


/* =====================================================
   RAZORPAY CHECKOUT
===================================================== */

async function checkout() {

    /* -----------------------------------------------
       CHECK LOGIN
    ------------------------------------------------ */

    if (!requireLogin()) {
        return;
    }


    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    const subtotal =
        getCartSubtotal();


    const finalTotal =
        getFinalTotal();


    if (
        subtotal <= 0 ||
        finalTotal <= 0
    ) {

        alert(
            "Invalid cart amount."
        );

        return;

    }


    const checkoutButton =
        document.getElementById(
            "checkout-button"
        );


    try {

        if (checkoutButton) {

            checkoutButton.disabled =
                true;

            checkoutButton.textContent =
                "Creating Order...";

        }


        /* -------------------------------------------
           CREATE ORDER
        ------------------------------------------- */

        const response =
            await fetch(

                `${API_BASE_URL}/api/payment/create-order`,

                {

                    method:
                        "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            items:
                                cart,

                            coupon:
                                appliedCoupon

                        })

                }

            );


        const data =
            await response.json();


        console.log(
            "Razorpay order response:",
            data
        );


        /* -------------------------------------------
           AUTH ERROR
        ------------------------------------------- */

        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "token"
            );


            alert(
                "Your login session has expired. Please login again."
            );


            window.location.href =
                "../frontend/login.html";


            return;

        }


        if (!response.ok) {

            throw new Error(

                data.message ||
                "Unable to create payment order."

            );

        }


        if (!data.success) {

            throw new Error(

                data.message ||
                "Payment order creation failed."

            );

        }


        if (!data.key) {

            throw new Error(
                "Razorpay key was not returned by the server."
            );

        }


        if (!data.orderId) {

            throw new Error(
                "Razorpay order ID was not returned by the server."
            );

        }


        if (!data.amount) {

            throw new Error(
                "Razorpay order amount was not returned by the server."
            );

        }


        if (
            typeof Razorpay ===
            "undefined"
        ) {

            throw new Error(
                "Razorpay checkout is not loaded."
            );

        }


        /* -------------------------------------------
           RAZORPAY OPTIONS
        ------------------------------------------- */

        const options = {

            key:
                data.key,

            amount:
                Number(
                    data.amount
                ),

            currency:
                data.currency ||
                "INR",

            name:
                "RAPTORA",

            description:
                "RAPTORA Mentor Plan",

            order_id:
                data.orderId,


            handler:
                async function(payment) {

                    await verifyPayment(
                        payment
                    );

                },


            theme: {

                color:
                    "#e50914"

            },


            modal: {

                ondismiss:
                    function() {

                        resetCheckoutButton();

                    }

            }

        };


        /* -------------------------------------------
           RAZORPAY INSTANCE
        ------------------------------------------- */

        const razorpayCheckout =
            new Razorpay(
                options
            );


        razorpayCheckout.on(
            "payment.failed",
            function(response) {

                console.error(
                    "Razorpay payment failed:",
                    response
                );


                alert(
                    "Payment failed. Please try again."
                );


                resetCheckoutButton();

            }
        );


        razorpayCheckout.open();

    }


    catch (error) {

        console.error(
            "Checkout error:",
            error
        );


        alert(
            error.message ||
            "Unable to start checkout."
        );


        resetCheckoutButton();

    }

}


/* =====================================================
   VERIFY RAZORPAY PAYMENT
===================================================== */

async function verifyPayment(
    payment
) {

    try {

        /* -------------------------------------------
           VERIFY PAYMENT WITH BACKEND
        ------------------------------------------- */

        const response =
            await fetch(

                `${API_BASE_URL}/api/payment/verify`,

                {

                    method:
                        "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            razorpay_order_id:
                                payment.razorpay_order_id,

                            razorpay_payment_id:
                                payment.razorpay_payment_id,

                            razorpay_signature:
                                payment.razorpay_signature,

                            items:
                                cart,

                            coupon:
                                appliedCoupon

                        })

                }

            );


        const data =
            await response.json();


        console.log(
            "Payment verification response:",
            data
        );


        /* -------------------------------------------
           AUTH ERROR
        ------------------------------------------------ */

        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "token"
            );


            alert(
                "Your login session has expired. Please login again."
            );


            window.location.href =
                "../frontend/login.html";


            return;

        }


        if (!response.ok) {

            throw new Error(

                data.message ||
                "Payment verification failed."

            );

        }


        if (!data.success) {

            throw new Error(

                data.message ||
                "Payment verification failed."

            );

        }


        /* -------------------------------------------
           PAYMENT SUCCESS
        ------------------------------------------------ */

        const subtotal =
            getCartSubtotal();


        const finalAmount =
            getFinalTotal();


        /* -------------------------------------------
           SAVE PURCHASE DATA
        ------------------------------------------------ */

        savePurchaseForDashboard(

            payment,

            cart,

            subtotal,

            discountAmount,

            finalAmount

        );


        /* -------------------------------------------
           CLEAR CART
        ------------------------------------------------ */

        cart =
            [];

        appliedCoupon =
            "";

        discountAmount =
            0;


        saveCart();

        updateCart();

        closeCart();


        /* -------------------------------------------
           SUCCESS MESSAGE
        ------------------------------------------------ */

        alert(
            "Payment successful!\n\nYour personalized Raptora dashboard is ready."
        );


        /* -------------------------------------------
           REDIRECT
        ------------------------------------------------ */

        redirectToDashboard();

    }


    catch (error) {

        console.error(
            "Payment verification error:",
            error
        );


        alert(

            error.message ||
            "Payment verification failed."

        );


        resetCheckoutButton();

    }

}


/* =====================================================
   RESET CHECKOUT BUTTON
===================================================== */

function resetCheckoutButton() {

    const button =
        document.getElementById(
            "checkout-button"
        );


    if (!button) {
        return;
    }


    button.disabled =
        cart.length === 0;


    button.textContent =
        "Proceed to Checkout";

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =====================================================
   KEYBOARD
===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            document.activeElement &&
            document.activeElement.id ===
                "discount-code"
        ) {

            applyDiscount();

        }


        if (
            event.key === "Escape"
        ) {

            closeCart();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        cart =
            cart.map(
                item => ({

                    ...item,

                    price:
                        Number(
                            item.price || 0
                        ),

                    quantity:
                        Number(
                            item.quantity
                        ) > 0

                            ? Number(
                                item.quantity
                              )

                            : 1

                })
            );


        saveCart();

        updateCart();

    }
);
