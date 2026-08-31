/* =========================================================
   RAPTORA MENTORS
   Cart System
   ========================================================= */

let mentorCart = [];


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(name, price) {

  // Prevent the same plan from being added twice
  const alreadyExists = mentorCart.some(
    item => item.name === name
  );

  if (alreadyExists) {

    showMessage("This plan is already in your cart.");

    openCart();

    return;
  }


  mentorCart.push({
    name: name,
    price: Number(price)
  });


  updateCart();

  openCart();

  showMessage("Plan added to cart.");
}


/* =========================================================
   REMOVE FROM CART
   ========================================================= */

function removeFromCart(index) {

  if (
    index < 0 ||
    index >= mentorCart.length
  ) {
    return;
  }


  mentorCart.splice(index, 1);

  updateCart();
}


/* =========================================================
   UPDATE CART
   ========================================================= */

function updateCart() {

  const cartItems =
    document.getElementById("cart-items");

  const cartCount =
    document.getElementById("cart-count");

  const cartTotal =
    document.getElementById("cart-total");

  const checkoutButton =
    document.getElementById("checkout-button");


  if (!cartItems) return;


  /* -------------------------
     CART COUNT
     ------------------------- */

  if (cartCount) {

    cartCount.textContent =
      mentorCart.length;

  }


  /* -------------------------
     EMPTY CART
     ------------------------- */

  if (mentorCart.length === 0) {

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

    }


    return;
  }


  /* -------------------------
     CART HAS ITEMS
     ------------------------- */

  if (checkoutButton) {

    checkoutButton.disabled =
      false;

  }


  let total = 0;


  cartItems.innerHTML =
    mentorCart.map(
      (item, index) => {

        total += item.price;


        return `
          <div class="cart-item">

            <div class="cart-item-top">

              <div class="cart-item-name">
                ${escapeHTML(item.name)}
              </div>

              <div class="cart-item-price">
                ₹${formatPrice(item.price)}
              </div>

            </div>


            <button
              class="remove-cart-item"
              onclick="removeFromCart(${index})">

              Remove

            </button>

          </div>
        `;

      }
    ).join("");


  if (cartTotal) {

    cartTotal.textContent =
      "₹" + formatPrice(total);

  }
}


/* =========================================================
   CALCULATE TOTAL
   ========================================================= */

function getCartTotal() {

  return mentorCart.reduce(
    (total, item) => {

      return total + Number(item.price);

    },
    0
  );

}


/* =========================================================
   FORMAT PRICE
   ========================================================= */

function formatPrice(price) {

  return Number(price).toLocaleString(
    "en-IN"
  );

}


/* =========================================================
   OPEN CART
   ========================================================= */

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


  document.body.style.overflow =
    "hidden";

}


/* =========================================================
   CLOSE CART
   ========================================================= */

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


  document.body.style.overflow =
    "";

}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Escape") {

      closeCart();

    }

  }
);


/* =========================================================
   SIMPLE MESSAGE
   ========================================================= */

function showMessage(message) {

  let messageBox =
    document.getElementById(
      "mentor-message"
    );


  if (!messageBox) {

    messageBox =
      document.createElement("div");

    messageBox.id =
      "mentor-message";


    messageBox.style.position =
      "fixed";

    messageBox.style.bottom =
      "25px";

    messageBox.style.left =
      "50%";

    messageBox.style.transform =
      "translateX(-50%)";

    messageBox.style.zIndex =
      "10001";

    messageBox.style.padding =
      "13px 20px";

    messageBox.style.background =
      "#121212";

    messageBox.style.border =
      "1px solid rgba(229,9,20,.45)";

    messageBox.style.borderRadius =
      "12px";

    messageBox.style.color =
      "#ffffff";

    messageBox.style.fontSize =
      "13px";

    messageBox.style.fontWeight =
      "700";

    messageBox.style.boxShadow =
      "0 10px 35px rgba(0,0,0,.45)";

    document.body.appendChild(
      messageBox
    );

  }


  messageBox.textContent =
    message;


  messageBox.style.display =
    "block";


  clearTimeout(
    messageBox.hideTimer
  );


  messageBox.hideTimer =
    setTimeout(
      function() {

        messageBox.style.display =
          "none";

      },
      2200
    );

}


/* =========================================================
   BASIC HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    updateCart();

  }
);
