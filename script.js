document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://dummyjson.com/products';
    const productsContainer = document.getElementById('products-container');
    const categorySelect = document.getElementById('category-select');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const cartContainer = document.getElementById('cart-container');
    const cartCountSpan = document.getElementById('cart-count');
    const totalItemsSpan = document.getElementById('total-items');
    const totalPriceSpan = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeModalButton = document.getElementById('close-modal');
    const closeButton = document.querySelector('.close-button');

    let products = [];
    let categories = [];
    let currentCategory = 'all';
    let itemsPerPage = parseInt(itemsPerPageSelect.value);
    let currentPage = 1;
    let totalPages = 1;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Initialize
    fetchProducts();
    populateCategories();
    renderCart();
    updateCartCount();

    // Event Listeners
    categorySelect.addEventListener('change', () => {
        currentCategory = categorySelect.value;
        currentPage = 1;
        renderProducts();
    });

    itemsPerPageSelect.addEventListener('change', () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value);
        currentPage = 1;
        renderProducts();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
        }
    });

    checkoutButton.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        checkoutModal.style.display = 'block';
        clearCart();
    });

    closeModalButton.addEventListener('click', () => {
        checkoutModal.style.display = 'none';
    });

    closeButton.addEventListener('click', () => {
        checkoutModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == checkoutModal) {
            checkoutModal.style.display = 'none';
        }
    });

    // Functions
    function fetchProducts() {
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch products.');
                }
                return response.json();
            })
            .then(data => {
                products = data.products;
                categories = [...new Set(products.map(product => product.category))];
                populateCategories();
                renderProducts();
            })
            .catch(error => {
                productsContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            });
    }

    function populateCategories() {
        // Clear existing categories except 'all'
        categorySelect.innerHTML = '<option value="all">All</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = capitalizeFirstLetter(category);
            categorySelect.appendChild(option);
        });
    }

    function renderProducts() {
        let filteredProducts = currentCategory === 'all' ? products : products.filter(p => p.category === currentCategory);
        totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        currentPageSpan.textContent = `${currentPage} / ${totalPages}`;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedProducts = filteredProducts.slice(start, end);

        productsContainer.innerHTML = '';

        if (paginatedProducts.length === 0) {
            productsContainer.innerHTML = '<p>No products found.</p>';
            return;
        }

        paginatedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            productCard.innerHTML = `
                <img src="${product.thumbnail}" alt="${product.title}">
                <h3>${product.title}</h3>
                <p>$${product.price.toFixed(2)}</p>
                <button class="add-to-cart-button" data-id="${product.id}">Add to Cart</button>
            `;

            productsContainer.appendChild(productCard);
        });

        // Add event listeners to Add to Cart buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', addToCart);
        });
    }

    function addToCart(event) {
        const productId = parseInt(event.target.getAttribute('data-id'));
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity: 1
            });
        }

        saveCart();
        renderCart();
        updateCartCount();
    }

    function renderCart() {
        cartContainer.innerHTML = '';

        if (cart.length === 0) {
            cartContainer.innerHTML = '<p>Your cart is empty.</p>';
            totalItemsSpan.textContent = '0';
            totalPriceSpan.textContent = '0.00';
            return;
        }

        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';

            cartItemDiv.innerHTML = `
                <img src="${item.thumbnail}" alt="${item.title}">
                <div class="cart-item-details">
                    <h4>${item.title}</h4>
                    <p>Price: $${item.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="decrease-qty" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase-qty" data-id="${item.id}">+</button>
                    </div>
                    <p>Subtotal: $${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button class="remove-item-button" data-id="${item.id}">&times;</button>
            `;

            cartContainer.appendChild(cartItemDiv);
        });

        // Add event listeners for quantity controls and remove buttons
        const decreaseButtons = document.querySelectorAll('.decrease-qty');
        const increaseButtons = document.querySelectorAll('.increase-qty');
        const removeButtons = document.querySelectorAll('.remove-item-button');

        decreaseButtons.forEach(button => {
            button.addEventListener('click', decreaseQuantity);
        });

        increaseButtons.forEach(button => {
            button.addEventListener('click', increaseQuantity);
        });

        removeButtons.forEach(button => {
            button.addEventListener('click', removeItem);
        });

        // Update totals
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        totalItemsSpan.textContent = totalItems;
        totalPriceSpan.textContent = totalPrice.toFixed(2);
    }

    function decreaseQuantity(event) {
        const productId = parseInt(event.target.getAttribute('data-id'));
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem && cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            saveCart();
            renderCart();
            updateCartCount();
        }
    }

    function increaseQuantity(event) {
        const productId = parseInt(event.target.getAttribute('data-id'));
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += 1;
            saveCart();
            renderCart();
            updateCartCount();
        }
    }

    function removeItem(event) {
        const productId = parseInt(event.target.getAttribute('data-id'));
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        renderCart();
        updateCartCount();
    }

    function clearCart() {
        cart = [];
        saveCart();
        renderCart();
        updateCartCount();
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCountSpan.textContent = totalItems;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});
