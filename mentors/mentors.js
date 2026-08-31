
/* =====================================================
   RAPTORA — MENTORS
   CART + QUANTITY + DISCOUNT + RAZORPAY
===================================================== */


/* =====================================================
   RENDER BACKEND
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
   DISCOUNT
===================================================== */

let appliedCoupon = "";
let discountAmount = 0;


/* =====================================================
   DISCOUNT CODES
   SAME AS FLUTTER MAIN.DART
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

    WELCOME15: {
        type: "fixed",
        value: 15
    }

};


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

    price = Number(price);

    const existingItem = cart.find(
        item => item.name === name
    );


    if (existingItem) {

        existingItem.quantity =
            Number(existingItem.quantity || 1) + 1;

    } else {

        cart.push({

            name: name,

            price: price,

            quantity: 1

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
        Number(cart[index].quantity || 1);


    if (quantity > 1) {

        cart[index].quantity =
            quantity - 1;

    } else {

        cart.splice(index, 1);

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


    cart.splice(index, 1);


    saveCart();

    updateCart();

}


/* =====================================================
   CART SUBTOTAL
===================================================== */

function getCartSubtotal() {

    return cart.reduce(

        (total, item) => {

            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            return total +
                (price * quantity);

        },

        0

    );

}


/* =====================================================
   CART QUANTITY
===================================================== */

function getCartQuantity() {

    return cart.reduce(

        (total, item) => {

            return total +
                Number(item.quantity || 1);

        },

        0

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

        showDiscountMessage(
            "Please enter a discount code.",
            false
        );

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


    /* -----------------------------------------------
       PERCENTAGE DISCOUNT
    ------------------------------------------------ */

    if (coupon.type === "percentage") {

        discountAmount =
            subtotal *
            (coupon.value / 100);

    }


    /* -----------------------------------------------
       FIXED DISCOUNT
    ------------------------------------------------ */

    else if (coupon.type === "fixed") {

        discountAmount =
            coupon.value;

    }


    /* -----------------------------------------------
       DISCOUNT CANNOT EXCEED SUBTOTAL
    ------------------------------------------------ */

    discountAmount =
        Math.min(
            discountAmount,
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

        input.value = "";

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

    const messageElement =
        document.getElementById(
            "discount-message"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    if (success) {

        messageElement.classList.add(
            "success"
        );

        messageElement.classList.remove(
            "error"
        );

    } else {

        messageElement.classList.add(
            "error"
        );

        messageElement.classList.remove(
            "success"
        );

    }

}


/* =====================================================
   GET FINAL TOTAL
===================================================== */

function getFinalTotal() {

    const subtotal =
        getCartSubtotal();


    if (subtotal <= 0) {
        return 0;
    }


    const finalTotal =
        subtotal - discountAmount;


    return Math.max(
        0,
        finalTotal
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

    const cartTotal =
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


        if (cartTotal) {

            cartTotal.textContent =
                "₹0";

        }


        if (checkoutButton) {

            checkoutButton.disabled =
                true;

            checkoutButton.textContent =
                "Proceed to Checkout";

        }


        return;

    }


    /* -----------------------------------------------
       CART ITEMS
    ------------------------------------------------ */

    cartItems.innerHTML = "";


    cart.forEach(
        (item, index) => {

            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            const itemTotal =
                price * quantity;


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
       DISCOUNT SECTION
    ------------------------------------------------ */

    const subtotal =
        getCartSubtotal();


    let discountHTML = "";


    if (appliedCoupon) {

        discountHTML = `

            <div class="discount-applied">

                <div>

                    <span>
                        Coupon
                    </span>

                    <strong>
                        ${escapeHTML(
                            appliedCoupon
                        )}
                    </strong>

                </div>


                <button
                    type="button"
                    onclick="removeDiscount()">

                    Remove

                </button>

            </div>

        `;

    }


    /* -----------------------------------------------
       INSERT DISCOUNT BOX
    ------------------------------------------------ */

    let discountBox =
        document.getElementById(
            "mentor-discount-box"
        );


    if (!discountBox) {

        discountBox =
            document.createElement(
                "div"
            );

        discountBox.id =
            "mentor-discount-box";

        discountBox.className =
            "mentor-discount-box";


        const cartBottom =
            document.querySelector(
                ".cart-bottom"
            );


        if (cartBottom) {

            cartBottom.insertBefore(
                discountBox,
                cartBottom.firstChild
            );

        }

    }


    if (discountBox) {

        discountBox.innerHTML = `

            <div class="discount-title">

                <i class="fa-solid fa-tag"></i>

                Discount Code

            </div>


            <div class="discount-input-row">

                <input
                    id="discount-code"
                    type="text"
                    placeholder="Enter coupon code"
                    value="${escapeHTML(
                        appliedCoupon
                    )}"
                    ${appliedCoupon ? "disabled" : ""}
                >


                ${
                    appliedCoupon

                    ? `

                        <button
                            type="button"
                            onclick="removeDiscount()">

                            Remove

                        </button>

                    `

                    : `

                        <button
                            type="button"
                            onclick="applyDiscount()">

                            Apply

                        </button>

                    `
                }

            </div>


            <div
                id="discount-message"
                class="discount-message">

                ${appliedCoupon
                    ? `${escapeHTML(appliedCoupon)} applied successfully.`
                    : ""
                }

            </div>


            ${discountHTML}

        `;

    }


    /* -----------------------------------------------
       TOTALS
    ------------------------------------------------ */

    if (cartTotal) {

        cartTotal.textContent =
            "₹" +
            getFinalTotal().toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    /* -----------------------------------------------
       ENABLE CHECKOUT
    ------------------------------------------------ */

    if (checkoutButton) {

        checkoutButton.disabled =
            false;

        checkoutButton.textContent =
            "Proceed to Checkout";

    }

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
   RAZORPAY CHECKOUT
===================================================== */

async function checkout() {

    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    const finalTotal =
        getFinalTotal();


    if (finalTotal <= 0) {

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

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        items: cart,

                        subtotal:
                            getCartSubtotal(),

                        discount:
                            discountAmount,

                        coupon:
                            appliedCoupon,

                        amount:
                            finalTotal

                    })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||
                "Unable to create payment order."

            );

        }


        /* -------------------------------------------
           RAZORPAY SCRIPT CHECK
        ------------------------------------------- */

        if (
            typeof Razorpay ===
            "undefined"
        ) {

            throw new Error(

                "Razorpay checkout is not loaded. Add the Razorpay script to mentors.html."

            );

        }


        /* -------------------------------------------
           RAZORPAY
        ------------------------------------------- */

        const options = {

            key:
                data.key,

            amount:
                data.amount,

            currency:
                data.currency || "INR",

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


        const razorpay =
            new Razorpay(
                options
            );


        razorpay.on(
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


        razorpay.open();

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
   VERIFY PAYMENT
===================================================== */

async function verifyPayment(
    payment
) {

    try {

        const response =
            await fetch(

                `${API_BASE_URL}/api/payment/verify`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        razorpay_order_id:
                            payment.razorpay_order_id,

                        razorpay_payment_id:
                            payment.razorpay_payment_id,

                        razorpay_signature:
                            payment.razorpay_signature,

                        items:
                            cart,

                        coupon:
                            appliedCoupon,

                        discount:
                            discountAmount

                    })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||
                "Payment verification failed."

            );

        }


        alert(

            "Payment successful! Your mentor plan has been activated."

        );


        /* -------------------------------------------
           CLEAR CART
        ------------------------------------------- */

        cart = [];

        appliedCoupon = "";

        discountAmount = 0;


        saveCart();

        updateCart();

        closeCart();

    }


    catch (error) {

        console.error(
            "Payment verification error:",
            error
        );


        alert(

            error.message ||
            "Payment verification failed. Please contact RAPTORA support."

        );


        resetCheckoutButton();

    }

}


/* =====================================================
   RESET CHECKOUT BUTTON
===================================================== */

function resetCheckoutButton() {

    const checkoutButton =
        document.getElementById(
            "checkout-button"
        );


    if (!checkoutButton) {
        return;
    }


    checkoutButton.disabled =
        cart.length === 0;


    checkoutButton.textContent =
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
   ENTER KEY FOR COUPON
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

