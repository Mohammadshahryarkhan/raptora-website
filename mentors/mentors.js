```javascript
/* =====================================================
   RAPTORA — MENTORS CART
   mentors/mentors.js
===================================================== */


/* =====================================================
   CART DATA
===================================================== */

let cart = JSON.parse(
    localStorage.getItem("raptoraMentorCart")
) || [];


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

    /*
       If the same plan is already in the cart,
       don't add it again.
    */

    const alreadyExists = cart.some(
        item => item.name === name
    );


    if (alreadyExists) {

        updateCart();

        openCart();

        return;

    }


    cart.push({

        name: name,

        price: Number(price)

    });


    saveCart();

    updateCart();

    openCart();

}


/* =====================================================
   REMOVE FROM CART
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
   UPDATE CART
===================================================== */

function updateCart() {

    const cartItems =
        document.getElementById("cart-items");

    const cartCount =
        document.getElementById("cart-count");

    const cartTotal =
        document.getElementById("cart-total");

    const checkoutButton =
        document.getElementById("checkout-button");


    if (!cartItems) {
        return;
    }


    /* -----------------------------------------------
       CART COUNT
    ------------------------------------------------ */

    if (cartCount) {

        cartCount.textContent =
            cart.length;

    }


    /* -----------------------------------------------
       EMPTY CART
    ------------------------------------------------ */

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">
                Your cart is empty.
            </div>
        `;

        if (cartTotal) {
            cartTotal.textContent = "₹0";
        }

        if (checkoutButton) {
            checkoutButton.disabled = true;
        }

        return;

    }


    /* -----------------------------------------------
       CART ITEMS
    ------------------------------------------------ */

    cartItems.innerHTML = "";


    let total = 0;


    cart.forEach((item, index) => {

        total += Number(item.price);


        const itemElement =
            document.createElement("div");

        itemElement.className =
            "cart-item";


        itemElement.innerHTML = `

            <div class="cart-item-name">
                ${escapeHTML(item.name)}
            </div>


            <div class="cart-item-price">
                ₹${Number(item.price).toLocaleString("en-IN")}
            </div>


            <button
                class="remove-item"
                onclick="removeFromCart(${index})">

                Remove

            </button>

        `;


        cartItems.appendChild(itemElement);

    });


    /* -----------------------------------------------
       TOTAL
    ------------------------------------------------ */

    if (cartTotal) {

        cartTotal.textContent =
            "₹" + total.toLocaleString("en-IN");

    }


    /* -----------------------------------------------
       CHECKOUT
    ------------------------------------------------ */

    if (checkoutButton) {

        checkoutButton.disabled = false;

    }

}


/* =====================================================
   OPEN CART
===================================================== */

function openCart() {

    const drawer =
        document.getElementById("cart-drawer");

    const overlay =
        document.getElementById("cart-overlay");


    if (drawer) {

        drawer.classList.add("active");

    }


    if (overlay) {

        overlay.classList.add("active");

    }


    document.body.style.overflow = "hidden";

}


/* =====================================================
   CLOSE CART
===================================================== */

function closeCart() {

    const drawer =
        document.getElementById("cart-drawer");

    const overlay =
        document.getElementById("cart-overlay");


    if (drawer) {

        drawer.classList.remove("active");

    }


    if (overlay) {

        overlay.classList.remove("active");

    }


    document.body.style.overflow = "";

}


/* =====================================================
   CHECKOUT
===================================================== */

function checkout() {

    if (cart.length === 0) {

        return;

    }


    /*
       Razorpay will be connected here.

       We will later send the selected plan
       and amount to your Render backend.
    */


    const total = cart.reduce(
        (sum, item) =>
            sum + Number(item.price),
        0
    );


    console.log(
        "Checkout amount:",
        total
    );


    /*
       Temporary message until Razorpay
       backend integration is added.
    */

    alert(
        "Razorpay checkout will open here."
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;

}


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeCart();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCart();

    }
);
```
