// --- UYGULAMA DEĞİŞKENLERİ ---

/** @type {Array<Object>} */
let allProducts = []; // Sunucudan gelen tüm ürünler

/** @type {Array<Object>} */
let filteredProducts = []; // Arama, kategori ve sıralama sonrası ürünler

/** @type {Array<Object>} */
let cart = []; // Sepetteki ürünler (quantity alanı eklenmiş)

let currentPage = 1;
const productsPerPage = 12; // Her sayfada 12 ürün göster

// Geliştirme: Filtreleme durumlarını takip et
let currentCategory = 'Tümü'; // Aktif kategoriyi takip et
let currentSort = 'default'; // Aktif sıralama
let currentSearchTerm = ''; // Aktif arama terimi

const categories = [
    "Tümü", "Ekran Kartı", "İşlemci", "Anakart", "RAM", "SSD", "Güç Kaynağı", "Kasa", "Soğutma", "Monitör", "Klavye", "Mouse", "Kulaklık", "Hoparlör", "Diğer"
];

// --- DOM ELEMENTLERİ ---
const appContainer = document.getElementById('app-container');
const loadingIndicator = document.getElementById('loading-indicator');

// Sayfalar
const pages = {
    home: document.getElementById('home-page'),
    detail: document.getElementById('detail-page'),
    cart: document.getElementById('cart-page'),
};

// Ana Sayfa Elementleri
const productGrid = document.getElementById('product-grid');
const featuredGpuGrid = document.getElementById('featured-gpu-grid');
const paginationControls = document.getElementById('pagination-controls');
const pageTitle = document.getElementById('page-title');
const sortSelect = document.getElementById('sort-select'); // Geliştirme: Sıralama

// Detay Sayfası Elementleri
const productDetailContent = document.getElementById('product-detail-content');

// Sepet Sayfası Elementleri
const cartContent = document.getElementById('cart-content');

// Header Elementleri
const searchInput = document.getElementById('search-input');
const mobileSearchInput = document.getElementById('mobile-search-input');
const cartBadge = document.getElementById('cart-badge');

// Mobil Navigasyon Elementleri
const mobileNav = document.getElementById('mobile-nav');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileNavClose = document.getElementById('mobile-nav-close');
const mobileMenuPanel = document.getElementById('mobile-menu-panel');
const mobileCartLink = document.getElementById('mobile-cart-link');

// Kategori Listeleri
const sidebarCategoryList = document.getElementById('sidebar-category-list');
const mobileCategoryList = document.getElementById('mobile-category-list');
const footerCategoryList = document.getElementById('footer-category-list');

// Bildirim Elementi
const toast = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');

// --- UYGULAMA BAŞLANGICI ---

document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Uygulamayı başlatan ana fonksiyon
 */
async function initializeApp() {
    populateCategoryLists();
    loadCartFromStorage();
    addEventListeners();
    
    try {
        const response = await fetch('fiyatlar.json'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allProducts = await response.json();
        
        allProducts = allProducts.map(p => {
            let uniqueId = '';
            if (p.urun_linki.includes('urun-')) {
                const parts = p.urun_linki.split('urun-');
                uniqueId = parts[parts.length - 1];
            } else {
                const parts = p.urun_linki.split('/');
                uniqueId = parts[parts.length - 1];
            }
            
            return { 
                ...p, 
                id: uniqueId,
                categoryKeyword: detectCategory(p.aciklama) // Kategori belirleme
            };
        });
        
        // Kategori kutularını dinamik resimlerle doldur
        populateCategoryBoxes();
        
        // Geliştirme: Filtreleri uygula ve yönlendirmeyi başlat
        applyFiltersAndSort(); // Başlangıçta filtreleri ayarla
        handleRouting(); // Yönlendirmeyi işle
        
    } catch (error) {
        console.error("Ürünler yüklenirken hata oluştu:", error);
        appContainer.innerHTML = `<p class="col-span-full text-center text-red-500 text-lg">Ürünler yüklenemedi. Lütfen 'fiyatlar.json' dosyasının doğru yerde olduğundan emin olun. Hata: ${error.message}</p>`;
    } finally {
        loadingIndicator.classList.remove('active');
    }
}

/**
 * Gerekli tüm olay dinleyicilerini ekler
 */
function addEventListeners() {
    window.addEventListener('hashchange', handleRouting);
    
    // Geliştirme: Arama ve Sıralama dinleyicileri
    searchInput.addEventListener('input', handleSearch);
    mobileSearchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSortChange);
    
    mobileMenuBtn.addEventListener('click', () => toggleMobileNav(true));
    mobileNavClose.addEventListener('click', () => toggleMobileNav(false));
    
    mobileNav.addEventListener('click', () => toggleMobileNav(false));
    mobileMenuPanel.addEventListener('click', (e) => e.stopPropagation());
    mobileCartLink.addEventListener('click', () => toggleMobileNav(false));
    
    // Kategori linkleri artık sadece hash'i değiştiriyor,
    // 'hashchange' olayı 'handleRouting' fonksiyonunu tetikliyor.
    sidebarCategoryList.addEventListener('click', (e) => {
        const link = e.target.closest('.category-link');
        if (link) {
            e.preventDefault(); // Sayfanın üste zıplamasını engelle
            window.location.hash = link.getAttribute('href');
        }
    });
    
    mobileCategoryList.addEventListener('click', (e) => {
        const link = e.target.closest('.category-link');
        if (link) {
            e.preventDefault(); 
            window.location.hash = link.getAttribute('href');
            toggleMobileNav(false); // Menüyü kapat
        }
    });
    
    footerCategoryList.addEventListener('click', (e) => {
        const link = e.target.closest('.category-link');
        if (link) {
            window.scrollTo(0, 0);
        }
    });
}

/**
 * Mobil menüyü açar veya kapatır
 * @param {boolean} show Gösterilsin mi?
 */
function toggleMobileNav(show) {
    if (show) {
        mobileNav.classList.remove('-translate-x-full');
    } else {
        mobileNav.classList.add('-translate-x-full');
    }
}

/**
 * Sidebar, mobil menü ve footer'daki kategori listelerini doldurur
 */
function populateCategoryLists() {
    sidebarCategoryList.innerHTML = '';
    mobileCategoryList.innerHTML = '';
    footerCategoryList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryHash = encodeURIComponent(category);
        const href = category === 'Tümü' ? '#/' : `#category/${categoryHash}`;
        
        const mainLi = document.createElement('li');
        mainLi.innerHTML = `<a href="${href}" class="category-link block px-3 py-2 rounded-md transition-colors duration-150 hover:bg-blue-50 text-gray-700" data-category="${category}">${category}</a>`;
        
        const footerLi = document.createElement('li');
        footerLi.innerHTML = `<a href="${href}" class="category-link hover:text-white hover:underline text-gray-400" data-category="${category}">${category}</a>`;

        sidebarCategoryList.appendChild(mainLi.cloneNode(true));
        mobileCategoryList.appendChild(mainLi);
        footerCategoryList.appendChild(footerLi);
    });
}

/**
 * Ana sayfadaki küçük kategori kutularını dinamik resimlerle doldurur
 */
function populateCategoryBoxes() {
    const categoriesToUpdate = {
        'işlemci': 'promo-img-işlemci',
        'monitör': 'promo-img-monitör',
        'ram': 'promo-img-ram',
        'kasa': 'promo-img-kasa'
    };

    for (const [categoryName, imgId] of Object.entries(categoriesToUpdate)) {
        const imgElement = document.getElementById(imgId);
        if (imgElement) {
            const product = allProducts.find(p => p.categoryKeyword.toLowerCase() === categoryName);
            if (product && product.kucuk_resim_linki) {
                imgElement.src = product.kucuk_resim_linki;
            }
        }
    }
}

/**
 * Tüm kategori linklerindeki aktif stilini günceller
 */
function updateActiveCategoryStyles() {
    document.querySelectorAll('.category-link').forEach(link => {
        if (link.dataset.category === currentCategory) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// --- YÖNLENDİRME (ROUTING) ---

/**
 * URL hash'ine göre ilgili sayfayı render eder (Geliştirildi)
 */
function handleRouting() {
    const hash = window.location.hash;
    
    if (hash.startsWith('#product/')) {
        renderDetailPage(decodeURIComponent(hash.substring(9)));
    } else if (hash === '#cart') {
        renderCartPage();
    } else {
        // Bu blok hem '#/' hem de '#category/...' durumlarını yönetir
        if (hash.startsWith('#category/')) {
            currentCategory = decodeURIComponent(hash.substring(10));
        } else {
            currentCategory = 'Tümü';
            // Garip hash'leri düzelt
            if (hash !== '#/' && hash.length > 1) {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        }
        
        // URL değiştiğinde arama terimini sıfırlamıyoruz, 
        // böylece kategori içinde arama yapılabilir.
        
        currentPage = 1; // Sayfayı başa al
        applyFiltersAndSort(); // Filtreleri ve sıralamayı uygula
        renderHomePage(); // Ana sayfayı render et
        
        // İlgili UI elementlerini güncelle
        updateActiveCategoryStyles();
        updatePageTitle();
        toggleFeaturedSections(!currentSearchTerm && currentCategory === 'Tümü');
    }
}

/**
 * Sayfalar arasında geçişi yönetir
 * @param {string} activePageId Gösterilecek sayfanın ID'si ('home', 'detail', 'cart')
 */
function showPage(activePageId) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    if (pages[activePageId]) {
        pages[activePageId].classList.add('active');
    }
    window.scrollTo(0, 0);
}

// --- SAYFA RENDER FONKSİYONLARI ---

/**
 * Ana sayfayı ve ürünleri render eder
 */
function renderHomePage() {
    productGrid.innerHTML = '';
    
    // Öne çıkan ürünleri sadece ana sayfada ve arama yokken göster
    if (currentCategory === 'Tümü' && !currentSearchTerm) {
        renderFeaturedProducts('Ekran Kartı', featuredGpuGrid, 4);
    }
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
        productGrid.innerHTML = `<p class="col-span-full text-center text-gray-500 text-lg">Seçilen kriterlerle eşleşen ürün bulunamadı.</p>`;
    } else {
        productsToShow.forEach(product => {
            const productCard = createProductCard(product);
            productGrid.appendChild(productCard);
        });
    }
    
    renderPagination();
    showPage('home');
}

/**
 * Öne çıkan ürünler bölümünü render eder
 */
function renderFeaturedProducts(categoryName, containerElement, count) {
    if (!containerElement) return;
    
    containerElement.innerHTML = '';
    
    const categoryTerm = categoryName.toLowerCase();
    const featured = allProducts
        .filter(p => p.categoryKeyword && p.categoryKeyword.toLowerCase() === categoryTerm)
        .slice(0, count); 
        
    if (featured.length === 0) {
        containerElement.innerHTML = `<p class="col-span-full text-center text-gray-500">Öne çıkan ürün bulunamadı.</p>`;
    } else {
        featured.forEach(product => {
            const featuredCard = createFeaturedProductCard(product); 
            containerElement.appendChild(featuredCard);
        });
    }
}

/**
 * Ürün detay sayfasını render eder
 */
function renderDetailPage(productId) {
    const product = allProducts.find(p => p.id === productId); 
    
    if (!product) {
        productDetailContent.innerHTML = `<p class="text-red-500">Ürün bulunamadı.</p>`;
        showPage('detail');
        return;
    }
    
    const anaGorsel = (product.detay_gorseller && product.detay_gorseller.length > 0) 
                        ? product.detay_gorseller[0] 
                        : product.resim_linki;

    productDetailContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            <!-- Ürün Galerisi -->
            <div class="lg:sticky lg:top-28">
                <div class="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                    <img id="main-product-image" src="${anaGorsel}" 
                         alt="${product.aciklama}" class="w-full h-auto max-h-[450px] object-contain rounded-md transition-all duration-300" 
                         onerror="this.onerror=null; this.src='https://placehold.co/600x600/f1f5f9/94a3b8?text=Resim+Yok';">
                </div>
                <div id="thumbnail-gallery" class="flex space-x-2 overflow-x-auto p-1 no-scrollbar">
                    <!-- Küçük resimler buraya JS ile eklenecek -->
                </div>
            </div>
            
            <!-- Ürün Bilgileri -->
            <div class="flex flex-col">
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3">${product.aciklama}</h1>
                
                <div class="mb-5">
                    ${product.kargo ? 
                        `<span class="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">${product.kargo}</span>` : 
                        '<span class="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Standart Kargo</span>'
                    }
                </div>
                
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <span class="text-sm text-gray-600">Fiyat</span>
                    <p class="text-3xl md:text-4xl font-extrabold text-blue-700">${formatPrice(product.fiyat)} TL</p>
                </div>
                
                <button class="add-to-cart-btn w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center space-x-3" data-id="${product.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Sepete Ekle</span>
                </button>
                
                <div class="mt-8 border-t border-gray-200 pt-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">Açıklama</h4>
                    <p class="text-gray-600 leading-relaxed">${product.aciklama}</p>
                </div>
            </div>
        </div>
    `;
    
    // --- GALERİ YÖNETİMİ ---
    const mainImage = productDetailContent.querySelector('#main-product-image');
    const thumbnailGallery = productDetailContent.querySelector('#thumbnail-gallery');
    
    const gorseller = (product.detay_gorseller && product.detay_gorseller.length > 0) 
                        ? product.detay_gorseller 
                        : [product.resim_linki];
    
    if (gorseller.length > 1) {
        thumbnailGallery.innerHTML = gorseller.map((gorsel, index) => `
            <button class="thumbnail-btn flex-shrink-0 w-20 h-20 rounded-md border-2 p-1 transition-all ${index === 0 ? 'active border-blue-700' : 'border-gray-200 hover:border-gray-400'}" data-src="${gorsel}">
                <img src="${gorsel}" alt="Küçük resim ${index + 1}" class="w-full h-full object-contain rounded-sm" 
                     onerror="this.onerror=null; this.src='https://placehold.co/80x80/f1f5f9/94a3b8?text=...';">
            </button>
        `).join('');

        thumbnailGallery.addEventListener('click', (e) => {
            const btn = e.target.closest('.thumbnail-btn');
            if (!btn) return;
            
            const newSrc = btn.dataset.src;
            mainImage.src = newSrc;
            
            thumbnailGallery.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('active', 'border-blue-700'));
            btn.classList.add('active', 'border-blue-700');
        });
    } else {
         thumbnailGallery.style.display = 'none';
    }

    // Geliştirme: Buton elementini `addToCart` fonksiyonuna gönder
    productDetailContent.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        addToCart(e.currentTarget.dataset.id, e.currentTarget);
    });
    
    showPage('detail');
}

/**
 * Sepet sayfasını render eder
 */
function renderCartPage() {
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="lg:col-span-3 text-center bg-white p-12 rounded-lg shadow-sm border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-gray-300 mx-auto mb-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.121 0 .239.04.335.117l2.828 2.09a.75.75 0 0 1-.028 1.258H7.5M7.5 14.25N6.623 10.5h11.25L16.5 14.25M7.5 14.25" />
                </svg>
                <h3 class="text-2xl font-semibold text-gray-800 mb-2">Sepetiniz şu anda boş</h3>
                <p class="text-gray-500 mb-6">Hemen alışverişe başlayın ve harika ürünleri keşfedin.</p>
                <a href="#/" class="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg transition-colors">Alışverişe Başla</a>
            </div>
        `;
    } else {
        const itemsHtml = cart.map(item => `
            <div class="flex items-start space-x-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <img src="${item.kucuk_resim_linki}" alt="${item.aciklama}" class="w-24 h-24 object-contain rounded-md border border-gray-200" 
                     onerror="this.onerror=null; this.src='https://placehold.co/100x100/f1f5f9/94a3b8?text=Resim';">
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate" title="${item.aciklama}">${item.aciklama}</p>
                    <p class="text-lg font-bold text-blue-700 my-2">${formatPrice(item.fiyat)} TL</p>
                    <div class="flex items-center space-x-2">
                        <button class="quantity-btn p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700" data-id="${item.id}" data-change="-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
                        </button>
                        <span class="font-bold w-8 text-center text-gray-800">${item.quantity}</span>
                        <button class="quantity-btn p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700" data-id="${item.id}" data-change="1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                    </div>
                </div>
                <button class="remove-from-cart-btn text-gray-400 hover:text-red-500 transition-colors" data-id="${item.id}" title="Sepetten Çıkar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `).join('');

        const subtotal = cart.reduce((acc, item) => acc + (item.fiyat * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 49.90;
        const total = subtotal + shipping;
        
        const summaryHtml = `
            <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:sticky lg:top-28">
                <h3 class="text-xl font-bold border-b border-gray-200 pb-3 mb-4 text-gray-800">Sipariş Özeti</h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Ara Toplam</span>
                        <span class="font-medium text-gray-800">${formatPrice(subtotal)} TL</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Kargo</span>
                        ${shipping === 0 ? 
                            `<span class="font-medium text-green-600">Bedava</span>` : 
                            `<span class="font-medium text-gray-800">${formatPrice(shipping)} TL</span>`
                        }
                    </div>
                    ${subtotal < 500 ? 
                        `<p class="text-xs text-center text-green-700 bg-green-50 p-2 rounded-md"><b>${formatPrice(500 - subtotal)} TL</b> daha ekleyin, kargo bedava!</p>` : ''
                    }
                    <div class="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                        <span class="text-gray-800">Toplam</span>
                        <span class="text-blue-700">${formatPrice(total)} TL</span>
                    </div>
                </div>
                <button class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 mt-6 flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    <span>Güvenli Ödemeye Geç</span>
                </button>
            </div>
        `;

        cartContent.innerHTML = `
            <div class="lg:col-span-2 space-y-4 w-full order-1">
                ${itemsHtml}
            </div>
            <div class="lg:col-span-1 w-full order-2">
                ${summaryHtml}
            </div>
        `;
        
        cartContent.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const change = parseInt(e.currentTarget.dataset.change);
                updateCartQuantity(id, change);
            });
        });
        
        cartContent.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeFromCart(e.currentTarget.dataset.id);
            });
        });
    }
    
    showPage('cart');
}

// --- YARDIMCI RENDER FONKSİYONLARI ---

/**
 * Tek bir ana ürün kartı HTML'i oluşturur
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card overflow-hidden flex flex-col';
    
    card.innerHTML = `
        <a href="#product/${encodeURIComponent(product.id)}" class="block group">
            <div class="overflow-hidden bg-white p-4">
                <img src="${product.kucuk_resim_linki}" alt="${product.aciklama}" 
                     class="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-105" 
                     onerror="this.onerror=null; this.src='https://placehold.co/320x320/f1f5f9/94a3b8?text=Resim+Yok';">
            </div>
        </a>
        <div class="p-4 flex flex-col flex-1 border-t border-gray-200">
            <a href="#product/${encodeURIComponent(product.id)}" class="flex-1">
                <h3 class="text-sm font-medium text-gray-800 h-10 line-clamp-2 hover:text-blue-700">${product.aciklama}</h3>
            </a>
            <div class="mt-4">
                <span class="text-xl font-bold text-gray-900">${formatPrice(product.fiyat)} TL</span>
                ${product.kargo ? `<p class="text-xs text-green-600 font-medium mt-1">${product.kargo}</p>` : ''}
            </div>
            <button class="add-to-cart-btn w-full mt-4 bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2" data-id="${product.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span>Sepete Ekle</span>
            </button>
        </div>
    `;
    
    // Geliştirme: Buton elementini `addToCart` fonksiyonuna gönder
    card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        addToCart(e.currentTarget.dataset.id, e.currentTarget);
    });
    
    return card;
}

/**
 * Öne çıkanlar için küçük ürün kartı HTML'i oluşturur
 */
function createFeaturedProductCard(product) {
    const card = document.createElement('a');
    card.href = `#product/${encodeURIComponent(product.id)}`;
    card.className = 'product-card p-3 flex items-center space-x-3';

    card.innerHTML = `
        <div class="flex-shrink-0 bg-white p-1 rounded-md w-20 h-20 flex items-center justify-center">
            <img src="${product.kucuk_resim_linki}" alt="${product.aciklama}" 
                 class="w-full h-full object-contain" 
                 onerror="this.onerror=null; this.src='https://placehold.co/80x80/f1f5f9/94a3b8?text=...';">
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-700">${product.aciklama}</h4>
            <p class="text-lg font-bold text-gray-900 mt-1">${formatPrice(product.fiyat)} TL</p>
        </div>
    `;
    
    return card;
}

/**
 * Gelişmiş sayfalama kontrollerini oluşturur
 */
function renderPagination() {
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (totalPages <= 1) return;

    const maxButtons = 7;
    let pagesToShow = [];

    if (totalPages <= maxButtons) {
        for (let i = 1; i <= totalPages; i++) {
            pagesToShow.push(i);
        }
    } else {
        let startPages = [1];
        let endPages = [totalPages];
        let middlePages = [];
        
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            middlePages.push(i);
        }

        let allPages = [...startPages, ...middlePages, ...endPages]
            .filter((value, index, self) => self.indexOf(value) === index) 
            .sort((a, b) => a - b); 

        let prevPage = 0;
        for (const page of allPages) {
            if (prevPage + 1 < page) {
                pagesToShow.push('...'); 
            }
            pagesToShow.push(page);
            prevPage = page;
        }
    }

    // Önceki Butonu
    paginationControls.appendChild(
        createPaginationButton('Önceki', currentPage > 1 ? currentPage - 1 : null, false, true)
    );
    
    // Sayfa Numaraları ve Ellipsis
    pagesToShow.forEach(page => {
        if (page === '...') {
            paginationControls.appendChild(createPaginationEllipsis());
        } else {
            paginationControls.appendChild(
                createPaginationButton(page.toString(), page, page === currentPage)
            );
        }
    });
    
    // Sonraki Butonu
    paginationControls.appendChild(
        createPaginationButton('Sonraki', currentPage < totalPages ? currentPage + 1 : null, false, true)
    );
}

/**
 * Tek bir sayfalama butonu oluşturur
 */
function createPaginationButton(text, pageNumber, isActive = false, isNav = false) {
    const button = document.createElement('button');
    button.innerText = text;
    
    let baseClasses = 'pagination-btn';
    let navClasses = isNav ? 'pagination-btn-nav' : '';
    
    if (pageNumber === null) {
        button.className = `${baseClasses} ${navClasses} pagination-btn-disabled`;
        button.disabled = true;
    } else if (isActive) {
        button.className = `${baseClasses} ${navClasses} pagination-btn-active`;
    } else {
        button.className = `${baseClasses} ${navClasses} pagination-btn-default`;
        button.addEventListener('click', () => {
            currentPage = pageNumber;
            renderHomePage(); // Sayfalama değiştiğinde ana sayfayı yeniden render et
        });
    }
    return button;
}

/**
 * Sayfalama için '...' (ellipsis) elementi oluşturur
 */
function createPaginationEllipsis() {
    const span = document.createElement('span');
    span.className = 'pagination-ellipsis text-sm';
    span.innerText = '...';
    return span;
}

// --- FİLTRELEME VE ARAMA (GELİŞTİRİLDİ) ---

/**
 * Arama çubuğuna yazılan metne göre filtreler
 */
function handleSearch(e) {
    currentSearchTerm = e.target.value.toLowerCase().trim();
    // Diğer arama çubuğunu senkronize et
    if (e.target === searchInput) {
        mobileSearchInput.value = currentSearchTerm;
    } else {
        searchInput.value = currentSearchTerm;
    }

    // Eğer kullanıcı ürün veya sepet sayfasındaysa ana sayfaya yönlendir
    if (!pages.home.classList.contains('active')) {
        window.location.hash = '#/'; // Bu, handleRouting'i tetikleyecek
    } else {
        // Zaten ana sayfada, sadece yeniden filtrele ve render et
        currentPage = 1;
        applyFiltersAndSort();
        renderHomePage(); 
        updatePageTitle(); 
        toggleFeaturedSections(!currentSearchTerm && currentCategory === 'Tümü');
    }
}

/**
 * Sıralama seçeneği değiştiğinde tetiklenir
 */
function handleSortChange(e) {
    currentSort = e.target.value;
    currentPage = 1;
    applyFiltersAndSort();
    renderHomePage();
}

/**
 * Kategori, arama ve sıralamayı uygular
 */
function applyFiltersAndSort() {
    let tempProducts = [...allProducts];
    
    // 1. Kategori Filtresi
    if (currentCategory !== 'Tümü') {
        const categoryTerm = currentCategory.toLowerCase();
        tempProducts = tempProducts.filter(product => {
            return product.categoryKeyword && product.categoryKeyword.toLowerCase() === categoryTerm;
        });
    }
    
    // 2. Arama Filtresi (Kategori filtresi üzerine uygulanır)
    if (currentSearchTerm) {
        tempProducts = tempProducts.filter(product => {
            const lowerAciklama = product.aciklama.toLowerCase();
            const lowerCategory = product.categoryKeyword.toLowerCase(); 
            return lowerAciklama.includes(currentSearchTerm) || lowerCategory.includes(currentSearchTerm);
        });
    }
    
    // 3. Sıralama
    switch (currentSort) {
        case 'price-asc':
            tempProducts.sort((a, b) => a.fiyat - b.fiyat);
            break;
        case 'price-desc':
            tempProducts.sort((a, b) => b.fiyat - a.fiyat);
            break;
        case 'name-asc':
            tempProducts.sort((a, b) => a.aciklama.localeCompare(b.aciklama, 'tr'));
            break;
        case 'name-desc':
            tempProducts.sort((a, b) => b.aciklama.localeCompare(a.aciklama, 'tr'));
            break;
        case 'default':
        default:
            // Sadece varsayılan sıralamada, arama yokken ve 'Tümü' kategorisindeyken karıştır
            if (currentCategory === 'Tümü' && !currentSearchTerm) {
                tempProducts.sort(() => 0.5 - Math.random());
            }
            // Diğer durumlarda doğal (JSON) sırasını koru
            break;
    }
    
    filteredProducts = tempProducts;
}

/**
 * Ana sayfadaki başlığı günceller
 */
function updatePageTitle() {
    if (currentSearchTerm) {
        pageTitle.innerText = `Arama Sonuçları: "${currentSearchTerm}"`;
    } else {
        pageTitle.innerText = currentCategory === 'Tümü' ? 'Tüm Ürünler' : currentCategory;
    }
}

/**
 * Ana sayfadaki özel banner/öne çıkanlar bölümlerini gösterir/gizler
 * @param {boolean} show Gösterilsin mi?
 */
function toggleFeaturedSections(show) {
    // Sadece ana sayfada olan elementleri seç
    const hero = document.querySelector('.hero-banner');
    const promos = document.querySelector('.promo-boxes');
    const featured = document.querySelector('.featured-category');
    
    const sections = [hero, promos, featured];

    if (show) {
        sections.forEach(section => {
            if (section) section.style.display = section.classList.contains('hero-banner') ? 'flex' : 'grid';
        });
    } else {
        sections.forEach(section => {
            if (section) section.style.display = 'none';
        });
    }
}

/**
 * Ürün açıklamasına göre kategoriyi akıllıca tahmin eder
 */
function detectCategory(aciklama) {
    const lowerAciklama = aciklama.toLowerCase();

    if (/\b(rtx|gtx)\s*(\d{4}|\d{3}0)/i.test(lowerAciklama) || /\b(rx)\s*(\d{4}|\d{3}0)/i.test(lowerAciklama) || lowerAciklama.includes('arc a')) return "Ekran Kartı";
    if (/\b(ryzen|core i)\s*(\d|x)\b/i.test(lowerAciklama) || lowerAciklama.includes('soket')) return "İşlemci";
    if (/\b(b\d{3}m?|x\d{3}|z\d{3}|a\d{3})\b/i.test(lowerAciklama) && !lowerAciklama.includes('kasa')) return "Anakart";
    if (lowerAciklama.includes('ekran kartı')) return "Ekran Kartı";
    if (lowerAciklama.includes('işlemci')) return "İşlemci";
    if (lowerAciklama.includes('anakart') || lowerAciklama.includes('motherboard')) return "Anakart";
    if (/\d+gb\s*ddr\d/i.test(lowerAciklama) || (lowerAciklama.includes('ram') && !lowerAciklama.includes('ekran kartı'))) return "RAM";
    if (lowerAciklama.includes('ssd') || lowerAciklama.includes('m.2') || lowerAciklama.includes('nvme')) return "SSD";
    if (lowerAciklama.includes('psu') || lowerAciklama.includes('güç kaynağı') || (/\d{3,}w/i.test(lowerAciklama) && (lowerAciklama.includes('80+') || lowerAciklama.includes('pfc')))) return "Güç Kaynağı";
    if ((lowerAciklama.includes('soğutucu') || lowerAciklama.includes('soğutma') || lowerAciklama.includes('cooler') || lowerAciklama.includes('fan'))
        && !lowerAciklama.includes('kasa') && !lowerAciklama.includes('güç kaynağı') && !lowerAciklama.includes('psu')
        && !/\b(rtx|gtx|rx)\b/i.test(lowerAciklama)) return "Soğutma";
    if (lowerAciklama.includes('kasa') || lowerAciklama.includes('case')) return "Kasa";
    if (lowerAciklama.includes('monitör') || lowerAciklama.includes('monitor') || /\d{2,}\s*inç|\d{2,}"/i.test(aciklama)) return "Monitör";
    if (lowerAciklama.includes('mouse') || lowerAciklama.includes('fare')) return "Mouse";
    if (lowerAciklama.includes('klavye') || lowerAciklama.includes('keyboard')) return "Klavye";
    if (lowerAciklama.includes('kulaklık') || lowerAciklama.includes('headset')) return "Kulaklık";
    if (lowerAciklama.includes('hoparlör') || lowerAciklama.includes('speaker')) return "Hoparlör";

    const match = aciklama.match(/\(([^)]+)\)$/);
    if (match) {
        const potentialCategory = match[1].trim();
        if (categories.slice(1).find(c => c.toLowerCase() === potentialCategory.toLowerCase())) {
            return categories.find(c => c.toLowerCase() === potentialCategory.toLowerCase());
        }
    }
    
    return "Diğer";
}


// --- SEPET İŞLEVLERİ ---

/**
 * Sepete ürün ekler (Geliştirildi: Buton geri bildirimi eklendi)
 * @param {string} productId Eklenecek ürünün ID'si
 * @param {HTMLElement | null} buttonElement Tıklanan buton (opsiyonel)
 */
function addToCart(productId, buttonElement = null) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCartToStorage();
    updateCartBadge();
    showToast(`${product.aciklama.substring(0, 30)}... sepete eklendi!`);
    
    // Geliştirme: Buton durumunu güncelle
    if (buttonElement) {
        const originalContent = buttonElement.innerHTML;
        const isDetailPageButton = buttonElement.classList.contains('text-lg'); // Detay sayfasındaki buton daha büyük
        
        buttonElement.disabled = true;
        buttonElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="${isDetailPageButton ? 'w-6 h-6' : 'w-5 h-5'}">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>Eklendi!</span>`;
        
        // Orijinal renkleri kaldırıp başarı rengi ekle
        buttonElement.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'bg-blue-700', 'hover:bg-blue-800');
        buttonElement.classList.add('bg-green-600', 'hover:bg-green-600', 'cursor-default');
        
        setTimeout(() => {
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalContent;
            buttonElement.classList.remove('bg-green-600', 'hover:bg-green-600', 'cursor-default');
            
            // Orijinal renkleri geri yükle
            if (isDetailPageButton) {
                buttonElement.classList.add('bg-blue-700', 'hover:bg-blue-800');
            } else {
                buttonElement.classList.add('bg-blue-600', 'hover:bg-blue-700');
            }
        }, 2000); // 2 saniye sonra eski haline dön
    }
}

/**
 * Sepetten ürün çıkarır
 */
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartBadge();
    renderCartPage(); // Sepet sayfasını yeniden render et
}

/**
 * Sepetteki ürünün miktarını günceller
 */
function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId); // Miktar 0'a düşerse kaldır
        } else {
            saveCartToStorage();
            updateCartBadge();
            renderCartPage(); // Sepet sayfasını yeniden render et
        }
    }
}

/**
 * Sepet ikonundaki sayacı günceller
 */
function updateCartBadge() {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    if (totalItems > 0) {
        cartBadge.innerText = totalItems;
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
}

/**
 * Sepeti localStorage'a kaydeder
 */
function saveCartToStorage() {
    localStorage.setItem('pcDunyasiCart', JSON.stringify(cart));
}

/**
 * Sepeti localStorage'dan yükler
 */
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('pcDunyasiCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartBadge();
}

// --- DİĞER YARDIMCI FONKSİYONLAR ---

/**
 * Fiyatı formatlar (örn: 1500.90 -> 1.500,90)
 */
function formatPrice(price) {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
        return '0,00';
    }
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericPrice);
}

/**
 * Ekranda kısa süreli bir bildirim mesajı gösterir
 */
function showToast(message) {
    toastMessage.innerText = message;
    toast.classList.remove('opacity-0', 'translate-x-full');
    toast.classList.add('opacity-100', 'translate-x-0');
    
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-x-0');
        toast.classList.add('opacity-0', 'translate-x-full');
    }, 3000);
}
