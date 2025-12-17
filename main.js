// Main Application
class BookstoreApp {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.categories = [];
        this.cart = [];
        this.wishlist = [];
        this.currentPage = 1;
        this.booksPerPage = 8;
        
        this.initialize();
    }

    async initialize() {
        // Initialize loading screen
        this.initLoadingScreen();
        
        // Load data
        await this.loadBooks();
        await this.loadCategories();
        
        // Initialize UI
        this.displayCategories();
        this.displayBooks();
        this.initCart();
        this.initWishlist();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 2000);
    }

    initLoadingScreen() {
        const progressBar = document.querySelector('.progress-bar');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 100);
    }

    async loadBooks() {
        try {
            const response = await fetch('data/books.json');
            const data = await response.json();
            this.books = data;
            this.filteredBooks = [...this.books];
        } catch (error) {
            console.error('Error loading books:', error);
            // Fallback sample data
            this.books = this.getSampleBooks();
            this.filteredBooks = [...this.books];
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('data/categories.json');
            const data = await response.json();
            this.categories = data;
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = this.getSampleCategories();
        }
    }

    displayCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        container.innerHTML = this.categories.map(category => `
            <div class="category-card" data-category="${category.id}">
                <div class="category-icon" style="background: ${category.color}">
                    <i class="${category.icon}"></i>
                </div>
                <h3>${category.name}</h3>
                <p class="category-count">
                    ${this.books.filter(b => b.category === category.name).length} books
                </p>
            </div>
        `).join('');

        // Add click events
        container.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filterByCategory(category);
            });
        });
    }

    displayBooks() {
        const container = document.getElementById('booksContainer');
        if (!container) return;

        const startIndex = 0;
        const endIndex = this.currentPage * this.booksPerPage;
        const booksToShow = this.filteredBooks.slice(startIndex, endIndex);

        container.innerHTML = booksToShow.map(book => `
            <div class="book-card" data-id="${book.id}">
                ${book.discount ? `
                    <span class="book-badge">Save ${Math.round((1 - book.discount/book.price) * 100)}%</span>
                ` : ''}
                
                <div class="book-image">
                    <img src="${book.cover_image}" alt="${book.title}" 
                         onerror="this.src='assets/placeholder.jpg'">
                    <div class="book-overlay">
                        <div class="quick-actions">
                            <button class="action-btn-sm quick-view" data-id="${book.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn-sm wishlist-toggle" data-id="${book.id}">
                                <i class="far fa-heart"></i>
                            </button>
                            <button class="action-btn-sm add-to-cart" data-id="${book.id}">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="book-info">
                    <h3 class="book-title" title="${book.title}">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    
                    <div class="book-rating">
                        <div class="stars">
                            ${this.generateStars(book.rating)}
                        </div>
                        <span class="rating-count">(${book.reviews || 0})</span>
                    </div>
                    
                    <div class="book-price">
                        <div>
                            <span class="price-current">
                                $${book.discount || book.price}
                            </span>
                            ${book.discount ? `
                                <span class="price-original">$${book.price}</span>
                            ` : ''}
                        </div>
                        <button class="add-to-cart-btn" data-id="${book.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners
        this.initBookCardEvents();
        
        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.filteredBooks.length > endIndex ? 'block' : 'none';
        }
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    initBookCardEvents() {
        // Quick view
        document.querySelectorAll('.quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bookId = parseInt(e.currentTarget.dataset.id);
                this.showBookDetails(bookId);
            });
        });

        // Add to cart
        document.querySelectorAll('.add-to-cart, .add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bookId = parseInt(e.currentTarget.dataset.id);
                this.addToCart(bookId);
            });
        });

        // Wishlist toggle
        document.querySelectorAll('.wishlist-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bookId = parseInt(e.currentTarget.dataset.id);
                this.toggleWishlist(bookId);
            });
        });
    }

    showBookDetails(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        const modal = document.getElementById('bookModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="book-details">
                <div class="book-details-header">
                    <div class="book-details-image">
                        <img src="${book.cover_image}" alt="${book.title}" 
                             onerror="this.src='assets/placeholder.jpg'">
                    </div>
                    <div class="book-details-info">
                        <h2>${book.title}</h2>
                        <p class="author">by ${book.author}</p>
                        
                        <div class="rating-large">
                            ${this.generateStars(book.rating)}
                            <span>${book.rating} (${book.reviews || 0} reviews)</span>
                        </div>
                        
                        <p class="price-large">
                            $${book.discount || book.price}
                            ${book.discount ? `
                                <span class="price-original">$${book.price}</span>
                            ` : ''}
                        </p>
                        
                        <p class="stock">
                            <i class="fas fa-check-circle"></i> In Stock
                        </p>
                        
                        <div class="action-buttons">
                            <button class="add-to-cart-large" data-id="${book.id}">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                            <button class="wishlist-btn" data-id="${book.id}">
                                <i class="far fa-heart"></i> Add to Wishlist
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="book-details-body">
                    <h3>Description</h3>
                    <p>${book.description || 'No description available.'}</p>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Category:</span>
                            <span class="detail-value">${book.category}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Pages:</span>
                            <span class="detail-value">${book.pages || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Publisher:</span>
                            <span class="detail-value">${book.publisher || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Published:</span>
                            <span class="detail-value">${book.published_date || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners in modal
        modalBody.querySelector('.add-to-cart-large').addEventListener('click', () => {
            this.addToCart(bookId);
        });

        modalBody.querySelector('.wishlist-btn').addEventListener('click', () => {
            this.toggleWishlist(bookId);
        });

        // Show modal
        modal.style.display = 'flex';

        // Close modal on X click
        document.querySelector('.close').onclick = () => {
            modal.style.display = 'none';
        };

        // Close modal on outside click
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    filterByCategory(categoryId) {
        if (categoryId === 'all') {
            this.filteredBooks = [...this.books];
        } else {
            const category = this.categories.find(c => c.id == categoryId);
            if (category) {
                this.filteredBooks = this.books.filter(book => 
                    book.category === category.name
                );
            }
        }
        
        this.currentPage = 1;
        this.displayBooks();
        
        // Scroll to books section
        document.querySelector('.featured').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    initCart() {
        const savedCart = localStorage.getItem('bookstore_cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartCount();
        }
    }

    addToCart(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        const existingItem = this.cart.find(item => item.id === bookId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: book.id,
                title: book.title,
                price: book.discount || book.price,
                image: book.cover_image,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartCount();
        this.showNotification(`${book.title} added to cart!`);
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
        }
    }

    saveCart() {
        localStorage.setItem('bookstore_cart', JSON.stringify(this.cart));
    }

    initWishlist() {
        const savedWishlist = localStorage.getItem('bookstore_wishlist');
        if (savedWishlist) {
            this.wishlist = JSON.parse(savedWishlist);
            this.updateWishlistCount();
        }
    }

    toggleWishlist(bookId) {
        const index = this.wishlist.indexOf(bookId);
        
        if (index === -1) {
            this.wishlist.push(bookId);
            this.showNotification('Added to wishlist!');
        } else {
            this.wishlist.splice(index, 1);
            this.showNotification('Removed from wishlist');
        }
        
        localStorage.setItem('bookstore_wishlist', JSON.stringify(this.wishlist));
        this.updateWishlistCount();
    }

    updateWishlistCount() {
        const wishlistCount = document.getElementById('wishlistCount');
        if (wishlistCount) {
            wishlistCount.textContent = this.wishlist.length;
        }
    }

    initEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = () => {
            const query = searchInput.value.toLowerCase().trim();
            
            if (query === '') {
                this.filteredBooks = [...this.books];
            } else {
                this.filteredBooks = this.books.filter(book => 
                    book.title.toLowerCase().includes(query) ||
                    book.author.toLowerCase().includes(query) ||
                    book.category.toLowerCase().includes(query)
                );
            }
            
            this.currentPage = 1;
            this.displayBooks();
        };
        
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }

        // Sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                
                switch(value) {
                    case 'price-low':
                        this.filteredBooks.sort((a, b) => (a.discount || a.price) - (b.discount || b.price));
                        break;
                    case 'price-high':
                        this.filteredBooks.sort((a, b) => (b.discount || b.price) - (a.discount || a.price));
                        break;
                    case 'rating':
                        this.filteredBooks.sort((a, b) => b.rating - a.rating);
                        break;
                    case 'newest':
                        this.filteredBooks.sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
                        break;
                    default:
                        this.filteredBooks = [...this.books];
                }
                
                this.displayBooks();
            });
        }

        // Load more
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.currentPage++;
                this.displayBooks();
            });
        }

        // Explore button
        const exploreBtn = document.getElementById('exploreBtn');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => {
                document.querySelector('.featured').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            });
        }

        // Cart button
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                this.showCartModal();
            });
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Add close button event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Sample data fallbacks
    getSampleBooks() {
        return [
            {
                id: 1,
                title: "Atomic Habits",
                author: "James Clear",
                price: 27.00,
                discount: 24.30,
                rating: 4.8,
                reviews: 12543,
                cover_image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
                category: "Self-Help",
                description: "Tiny Changes, Remarkable Results: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
                pages: 320,
                publisher: "Avery",
                published_date: "2018-10-16",
                featured: true
            },
            {
                id: 2,
                title: "The Psychology of Money",
                author: "Morgan Housel",
                price: 25.99,
                rating: 4.7,
                reviews: 8921,
                cover_image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d",
                category: "Business & Finance",
                description: "Timeless lessons on wealth, greed, and happiness",
                pages: 256,
                publisher: "Harriman House",
                published_date: "2020-09-08",
                featured: true
            }
        ];
    }

    getSampleCategories() {
        return [
            { id: 1, name: "Fiction", icon: "fas fa-book-open", color: "#3498db" },
            { id: 2, name: "Non-Fiction", icon: "fas fa-clipboard-list", color: "#2ecc71" },
            { id: 3, name: "Science & Tech", icon: "fas fa-flask", color: "#9b59b6" },
            { id: 4, name: "Business", icon: "fas fa-chart-line", color: "#e74c3c" },
            { id: 5, name: "Self-Help", icon: "fas fa-hands-helping", color: "#f39c12" },
            { id: 6, name: "Biography", icon: "fas fa-user-tie", color: "#1abc9c" }
        ];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookstoreApp = new BookstoreApp();
});