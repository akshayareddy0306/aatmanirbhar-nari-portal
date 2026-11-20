/**
 * Aatmanirbhar Nari — Core Application Controller & UI Router
 * Implements:
 *   - 2-second elegant brand intro with skip option
 *   - Three independent login experiences (Seller, Customer, Admin)
 *   - Native laptop photo upload with drag-and-drop & IndexedDB persistence
 *   - Real-time jewelry business creation & product listing
 *   - Admin verification queue with detailed product photo inspection
 *   - Customer discovery, search, location filters, and purchase request workflow
 *   - Seller purchase request response & status updates
 *   - Replaceable brand logo in administrator branding settings
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentRoute: 'home',
    routeParam: null,
    sellerActiveTab: 'overview',
    adminActiveTab: 'queue',
    customerActiveTab: 'overview',
    uploadedProductImages: [], // temporary images while adding product
    sellerDraftProfilePhoto: null,
    sellerDraftCoverPhoto: null,
    editingProductId: null,
    selectedProductForDetail: null,
    selectedBusinessForDetail: null,
    selectedBusinessForAdminReview: null,
    selectedRequestForSellerAction: null,
    searchQuery: '',
    selectedCategory: '',
    selectedCity: '',
    selectedPincode: ''
  };

  // Safe HTML Escaping
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Default SVG Brand Logo (Graceful side-profile female silhouette)
  function getDefaultLogoSVG(width = 44, height = 44) {
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="22" fill="#FBECEF" />
        <circle cx="50" cy="50" r="42" stroke="#E9E3E5" stroke-width="1.5" />
        <!-- Graceful side silhouette: forehead, nose, lips, chin, neck and swept-back hair bun -->
        <path d="M48 24C38 24 33 32 33 42C33 46 35 48 37 51C36 53 34 57 34 62C34 68 37 72 40 76C43 78 47 79 50 79C47 75 46 70 47 65C47.8 60 50 56 53 54C54 53 55 51 55 49C55 47 54 46 54 44C54 41 56 38 58 37C60 36 61 34 61 31C61 27 55 24 48 24Z" fill="#B96F83" />
        <path d="M54 36C56 39 58 40 60 41C61 41.5 63 42 63 43.5C63 45 61.5 45.5 61 46.5C60.5 47.5 61.5 49 61 50.5C60.5 52 59 52.5 58 53.5C56 55.5 55 59 55 63C55 67 56 71 58 75C53 75 48 72 45 68C43 65 42 60 43 56C43.5 53 45 50 47 48C45 46 44 43 44 40C44 34 49 28 55 28C59 28 62 31 62 34C62 35.5 61 36.5 59 36.5C57 36.5 55 35 54 36Z" fill="#8E4C5E" />
        <!-- Delicate bindi & minimal earring drop -->
        <circle cx="60" cy="38" r="1.5" fill="#B96F83" />
        <circle cx="53" cy="51" r="2" fill="#D4AF37" />
        <path d="M53 53L53 57" stroke="#D4AF37" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    `;
  }

  // Get active brand logo (custom uploaded or default SVG)
  async function renderBrandLogo(width = 44, height = 44) {
    const branding = ANN_DB.getBranding();
    if (branding && branding.logoDataUrl) {
      return `<img src="${branding.logoDataUrl}" alt="Aatmanirbhar Nari" style="width:${width}px;height:${height}px;border-radius:12px;object-fit:cover;" />`;
    }
    return getDefaultLogoSVG(width, height);
  }

  // Route Navigator
  window.navigateTo = function (route, param = null) {
    state.currentRoute = route;
    state.routeParam = param;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderApp();
  };

  // Opening Splash Animation Handler
  function initSplashScreen() {
    const splashEl = document.getElementById('brand-splash');
    if (!splashEl) return;

    const alreadyShown = sessionStorage.getItem('ann_splash_shown');
    if (alreadyShown) {
      splashEl.remove();
      return;
    }

    // Insert default or custom logo into splash
    renderBrandLogo(90, 90).then((logoHtml) => {
      const container = splashEl.querySelector('.splash-logo-mark');
      if (container) container.innerHTML = logoHtml;
    });

    const skipBtn = splashEl.querySelector('.splash-skip-btn');
    const dismissSplash = () => {
      sessionStorage.setItem('ann_splash_shown', 'true');
      splashEl.classList.add('fade-out');
      setTimeout(() => splashEl.remove(), 450);
    };

    if (skipBtn) {
      skipBtn.addEventListener('click', dismissSplash);
    }

    // Auto-dismiss after 2 seconds
    setTimeout(dismissSplash, 2100);
  }

  // Header & Navbar Component
  async function renderNavbar() {
    const session = ANN_DB.getCurrentSession();
    const logoHtml = await renderBrandLogo(42, 42);

    let authButtons = '';
    if (session) {
      let roleLabel = 'Entrepreneur';
      let dashboardRoute = 'seller-dashboard';
      if (session.role === 'admin') {
        roleLabel = 'Administrator';
        dashboardRoute = 'admin-dashboard';
      } else if (session.role === 'customer') {
        roleLabel = 'Customer';
        dashboardRoute = 'customer-dashboard';
      }

      authButtons = `
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('${dashboardRoute}')">
          <span>${esc(session.user.name.split(' ')[0])} (${roleLabel})</span>
        </button>
        <button class="btn btn-outline btn-sm" onclick="handleLogout()">Logout</button>
      `;
    } else {
      authButtons = `
        <button class="btn btn-outline btn-sm" onclick="navigateTo('login-portal')">Log In</button>
        <button class="btn btn-primary btn-sm" onclick="navigateTo('register-seller')">Register Business</button>
      `;
    }

    return `
      <header class="site-nav">
        <div class="container nav-inner">
          <div class="brand-wrapper" onclick="navigateTo('home')">
            <div class="brand-logo-container">${logoHtml}</div>
            <div class="brand-text-block">
              <span class="brand-name">Aatmanirbhar Nari</span>
              <span class="brand-tagline-micro">Home Business Enablement</span>
            </div>
          </div>
          <ul class="nav-links">
            <li><a href="javascript:void(0)" class="nav-link ${state.currentRoute === 'home' ? 'active' : ''}" onclick="navigateTo('home')">Home</a></li>
            <li><a href="javascript:void(0)" class="nav-link ${state.currentRoute === 'directory' ? 'active' : ''}" onclick="navigateTo('directory')">Explore Businesses</a></li>
            <li><a href="javascript:void(0)" class="nav-link ${state.currentRoute === 'products' ? 'active' : ''}" onclick="navigateTo('products')">Product Gallery</a></li>
            <li><a href="javascript:void(0)" class="nav-link ${state.currentRoute === 'learning' ? 'active' : ''}" onclick="navigateTo('learning')">Learning Hub</a></li>
            <li><a href="javascript:void(0)" class="nav-link ${state.currentRoute === 'about' ? 'active' : ''}" onclick="navigateTo('about')">About</a></li>
          </ul>
          <div class="nav-actions">
            ${authButtons}
            <button class="nav-mobile-toggle" onclick="toggleMobileNav()" aria-label="Toggle navigation">☰</button>
          </div>
        </div>
      </header>
    `;
  }

  // Footer Component
  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <span class="brand-name" style="font-size:1.4rem;">Aatmanirbhar Nari</span>
              <p>A digital platform empowering women-led home businesses and small enterprises with visibility, customer connection, and growth enablement.</p>
              <div style="margin-top:16px;">
                <span class="badge badge-lavender">Verified Local Directory</span>
              </div>
            </div>
            <div class="footer-col">
              <h4>Discovery</h4>
              <ul class="footer-links">
                <li><a href="javascript:void(0)" onclick="navigateTo('directory')">Browse Businesses</a></li>
                <li><a href="javascript:void(0)" onclick="navigateTo('products')">Handcrafted Products</a></li>
                <li><a href="javascript:void(0)" onclick="filterByCategory('Jewelry & Accessories')">Jewelry & Accessories</a></li>
                <li><a href="javascript:void(0)" onclick="filterByCategory('Handloom & Tailoring')">Handloom & Tailoring</a></li>
                <li><a href="javascript:void(0)" onclick="filterByCategory('Food & Bakery')">Food & Bakery</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Entrepreneurs</h4>
              <ul class="footer-links">
                <li><a href="javascript:void(0)" onclick="navigateTo('register-seller')">Register Your Business</a></li>
                <li><a href="javascript:void(0)" onclick="navigateTo('login-seller')">Seller Workspace</a></li>
                <li><a href="javascript:void(0)" onclick="navigateTo('learning')">Business Learning Hub</a></li>
                <li><a href="javascript:void(0)" onclick="navigateTo('about')">Quality Guidelines</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Demonstration Notice</h4>
              <p style="font-size:0.825rem;color:var(--text-muted);line-height:1.5;">
                This platform is an interactive frontend demonstration prototype. Purchase requests are customer-seller coordination requests; actual payments and delivery settlements are coordinated directly outside the prototype.
              </p>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; 2026 Aatmanirbhar Nari &middot; Unified Mentor Internship &middot; All Rights Reserved.</span>
            <span>Same-browser Demonstration &middot; IndexedDB Active</span>
          </div>
        </div>
      </footer>
    `;
  }

  // =========================================================================
  // VIEW RENDERERS
  // =========================================================================

  // 1. HOME VIEW
  async function renderHomeView() {
    const approvedBusinesses = ANN_DB.getApprovedBusinesses();
    const approvedProducts = ANN_DB.getApprovedProducts();
    const categories = ANN_DB.getCategories();

    // Featured product cards
    let productCardsHtml = '';
    for (const prod of approvedProducts.slice(0, 3)) {
      let imgUrl = null;
      if (prod.imageIds && prod.imageIds.length > 0) {
        imgUrl = await ANN_DB.getImage(prod.imageIds[0]);
      }
      if (!imgUrl) {
        if (prod.category.includes('Jewelry')) imgUrl = await ANN_DB.getImage('img-seed-jhumka');
        else if (prod.category.includes('Food')) imgUrl = await ANN_DB.getImage('img-seed-pickle');
        else imgUrl = await ANN_DB.getImage('img-seed-diya');
      }
      productCardsHtml += `
        <article class="product-card" onclick="openProductDetail('${prod.id}')">
          <div class="product-card-thumb-wrap">
            <span class="badge badge-pending product-card-badge">${esc(prod.category)}</span>
            <img class="product-card-thumb" src="${imgUrl}" alt="${esc(prod.name)}" onerror="this.src=ANN_DB.getImage('img-seed-jhumka')" />
          </div>
          <div class="product-card-body">
            <span class="product-card-biz">${esc(prod.businessName)}</span>
            <h4 class="product-card-title">${esc(prod.name)}</h4>
            <p class="product-card-desc">${esc(prod.description)}</p>
            <div class="product-card-meta">
              <div class="product-price-box">
                <span class="product-price-val">₹${prod.price}</span>
                ${prod.discountPrice ? `<span class="product-price-strike">₹${prod.discountPrice}</span>` : ''}
              </div>
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openProductDetail('${prod.id}')">Request</button>
            </div>
          </div>
        </article>
      `;
    }

    // Featured business cards with cover photos
    let bizCardsHtml = '';
    for (const biz of approvedBusinesses.slice(0, 3)) {
      let coverImg = biz.coverImageId ? await ANN_DB.getImage(biz.coverImageId) : null;
      if (!coverImg) {
        const bProds = ANN_DB.getProductsByBusinessId(biz.id);
        if (bProds.length > 0 && bProds[0].imageIds.length > 0) {
          coverImg = await ANN_DB.getImage(bProds[0].imageIds[0]);
        }
      }
      if (!coverImg) coverImg = await ANN_DB.getImage('img-seed-biz-sakhi');

      bizCardsHtml += `
        <article class="business-card" onclick="openBusinessDetail('${biz.id}')">
          <div class="business-card-cover-wrap">
            <img class="business-card-cover-img" src="${coverImg}" alt="${esc(biz.name)}" />
          </div>
          <div class="business-card-content">
            <div class="business-card-header">
              <div class="business-avatar">
                <span>${biz.category.includes('Jewelry') ? '💍' : biz.category.includes('Food') ? '🍲' : '🏺'}</span>
              </div>
              <div class="business-header-text">
                <h3>${esc(biz.name)}</h3>
                <span class="business-owner-title">by ${esc(biz.ownerName)}</span>
              </div>
            </div>
            <div style="margin-bottom:8px;">
              <span class="badge badge-lavender">${esc(biz.category)}</span>
            </div>
            <span class="business-location-pill">📍 ${esc(biz.locality)}, ${esc(biz.city)}</span>
            <p class="business-card-desc">${esc(biz.desc)}</p>
            <div class="business-card-footer">
              <span class="badge badge-approved">Verified Seller</span>
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();openBusinessDetail('${biz.id}')">View Profile &rarr;</button>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <section class="hero-section">
        <div class="container hero-grid">
          <div class="hero-copy">
            <span class="eyebrow">A Platform for Women-Led Enterprises</span>
            <h1>Every Dream Deserves <span>a Place to Grow.</span></h1>
            <p>Discover women-led home businesses, explore unique creations and connect directly with the entrepreneurs behind them.</p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-lg" onclick="navigateTo('directory')">Explore Businesses &rarr;</button>
              <button class="btn btn-outline btn-lg" onclick="navigateTo('register-seller')">Register as an Entrepreneur</button>
            </div>
            <div class="hero-highlights">
              <div class="highlight-item">
                <span class="highlight-number">${approvedBusinesses.length}</span>
                <span class="highlight-label">Verified Businesses</span>
              </div>
              <div class="highlight-item">
                <span class="highlight-number">${approvedProducts.length}</span>
                <span class="highlight-label">Handcrafted Products</span>
              </div>
              <div class="highlight-item">
                <span class="highlight-number">100%</span>
                <span class="highlight-label">Direct Connection</span>
              </div>
            </div>
          </div>
          <div class="hero-showcase">
            <div class="showcase-art">
              <div class="showcase-featured-card">
                <div class="showcase-top">
                  <span class="showcase-category-pill">Jewelry & Accessories</span>
                  <span class="badge badge-approved">Admin Verified</span>
                </div>
                <div style="background:var(--pink-light);border-radius:12px;padding:24px;text-align:center;margin-bottom:16px;">
                  <span style="font-size:3.5rem;">💍</span>
                </div>
                <div class="showcase-details">
                  <h3>Sakhi Studio & Crafts</h3>
                  <p>Handmade kundan & pearl jewelry created with artisanal precision in Hyderabad.</p>
                  <div class="showcase-meta">
                    <span class="showcase-price">₹499 — ₹1,150</span>
                    <button class="btn btn-primary btn-sm" onclick="navigateTo('directory')">Browse Collection</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Categories -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <span class="eyebrow">Curated Collections</span>
            <h2>Explore by Category</h2>
            <p>Find genuine home-crafted products, tailoring services, wholesome foods and artisan creations.</p>
          </div>
          <div class="category-grid">
            ${categories
              .map(
                (c) => `
              <div class="category-card" onclick="filterByCategory('${esc(c.name)}')">
                <div class="category-icon-box">${c.icon}</div>
                <h3>${esc(c.name)}</h3>
                <p>${esc(c.desc)}</p>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </section>

      <!-- Featured Handcrafted Products -->
      <section class="section section-tint">
        <div class="container">
          <div class="section-header">
            <span class="eyebrow">Artisanal Offerings</span>
            <h2>Handmade Products Worth Cherishing</h2>
            <p>Each product is crafted in small batches by women entrepreneurs from their homes and workshops.</p>
          </div>
          <div class="products-grid">
            ${productCardsHtml}
          </div>
          <div style="text-align:center;margin-top:36px;">
            <button class="btn btn-outline" onclick="navigateTo('products')">View All Products &rarr;</button>
          </div>
        </div>
      </section>

      <!-- Featured Approved Businesses -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <span class="eyebrow">Verified Entrepreneurs</span>
            <h2>Discover Local Businesses</h2>
            <p>Meet verified home entrepreneurs and explore their full profiles and offerings.</p>
          </div>
          <div class="business-grid">
            ${bizCardsHtml}
          </div>
          <div style="text-align:center;margin-top:36px;">
            <button class="btn btn-outline" onclick="navigateTo('directory')">Explore All Verified Businesses &rarr;</button>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="section section-tint">
        <div class="container">
          <div class="section-header">
            <span class="eyebrow">Transparent Journey</span>
            <h2>How Aatmanirbhar Nari Works</h2>
            <p>A simple, trusted workflow designed to connect home entrepreneurs with appreciative customers.</p>
          </div>
          <div class="category-grid">
            <div class="category-card" style="text-align:left;align-items:flex-start;">
              <div class="category-icon-box">1</div>
              <h3>Register & Profile</h3>
              <p>Women entrepreneurs create a dedicated business profile, detailing their craft, service area, and story.</p>
            </div>
            <div class="category-card" style="text-align:left;align-items:flex-start;">
              <div class="category-icon-box">2</div>
              <h3>Upload Real Photos</h3>
              <p>Upload genuine product photographs, set Indian Rupee prices, and describe materials and availability.</p>
            </div>
            <div class="category-card" style="text-align:left;align-items:flex-start;">
              <div class="category-icon-box">3</div>
              <h3>Admin Verification</h3>
              <p>Administrators review submissions and product photographs to ensure directory authenticity and trust.</p>
            </div>
            <div class="category-card" style="text-align:left;align-items:flex-start;">
              <div class="category-icon-box">4</div>
              <h3>Direct Purchase Requests</h3>
              <p>Customers discover listings and submit purchase requests. Entrepreneurs coordinate directly with buyers.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action Banner -->
      <section class="section">
        <div class="container">
          <div style="background:linear-gradient(135deg,#F6DDE3 0%,#FBECEF 60%,#E9E4F2 100%);border:1px solid var(--border);border-radius:var(--radius-lg);padding:50px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:24px;box-shadow:var(--shadow-md);">
            <div style="max-width:600px;">
              <span class="eyebrow" style="color:var(--rose-dark);">Empower Your Passion</span>
              <h2 style="font-size:2rem;margin-bottom:8px;">Are You a Woman Running a Home Business?</h2>
              <p style="color:var(--text-main);font-size:1.05rem;">
                Get discovered by customers looking for genuine handmade jewelry, custom tailoring, authentic culinary delights, and creative crafts.
              </p>
            </div>
            <div>
              <button class="btn btn-primary btn-lg" onclick="navigateTo('register-seller')">Register Your Business Today &rarr;</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // 2. EXPLORE BUSINESSES DIRECTORY VIEW
  async function renderDirectoryView() {
    const businesses = ANN_DB.getApprovedBusinesses();
    const categories = ANN_DB.getCategories();

    // Filter logic
    const q = (state.searchQuery || '').toLowerCase().trim();
    const cat = state.selectedCategory || '';
    const city = (state.selectedCity || '').toLowerCase().trim();
    const pin = (state.selectedPincode || '').trim();

    const filtered = businesses.filter((b) => {
      const matchQ =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.ownerName.toLowerCase().includes(q);
      const matchCat = !cat || b.category === cat;
      const matchCity = !city || b.city.toLowerCase().includes(city) || b.locality.toLowerCase().includes(city);
      const matchPin = !pin || (b.pincode && b.pincode.includes(pin));
      return matchQ && matchCat && matchCity && matchPin;
    });

    let dirCardsHtml = '';
    for (const b of filtered) {
      let coverImg = b.coverImageId ? await ANN_DB.getImage(b.coverImageId) : null;
      if (!coverImg) {
        const bProds = ANN_DB.getProductsByBusinessId(b.id);
        if (bProds.length > 0 && bProds[0].imageIds.length > 0) {
          coverImg = await ANN_DB.getImage(bProds[0].imageIds[0]);
        }
      }
      if (!coverImg) {
        if (b.category.includes('Jewelry')) coverImg = await ANN_DB.getImage('img-seed-biz-sakhi');
        else if (b.category.includes('Food')) coverImg = await ANN_DB.getImage('img-seed-biz-ananya');
        else coverImg = await ANN_DB.getImage('img-seed-biz-mitti');
      }

      dirCardsHtml += `
        <article class="business-card" onclick="openBusinessDetail('${b.id}')">
          <div class="business-card-cover-wrap">
            <img class="business-card-cover-img" src="${coverImg}" alt="${esc(b.name)}" />
          </div>
          <div class="business-card-content">
            <div class="business-card-header">
              <div class="business-avatar">
                <span>${b.category.includes('Jewelry') ? '💍' : b.category.includes('Food') ? '🍲' : '🏺'}</span>
              </div>
              <div class="business-header-text">
                <h3>${esc(b.name)}</h3>
                <span class="business-owner-title">by ${esc(b.ownerName)}</span>
              </div>
            </div>
            <div style="margin-bottom:8px;">
              <span class="badge badge-lavender">${esc(b.category)}</span>
            </div>
            <span class="business-location-pill">📍 ${esc(b.locality)}, ${esc(b.city)} (${esc(b.pincode)})</span>
            <p class="business-card-desc">${esc(b.desc)}</p>
            <div class="business-card-footer">
              <small style="color:var(--text-muted);font-weight:600;">${b.productCount || 0} Products</small>
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();openBusinessDetail('${b.id}')">View Profile &rarr;</button>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <div class="container" style="padding:48px 0;">
        <div style="margin-bottom:32px;">
          <span class="eyebrow">Directory</span>
          <h1>Explore Women-Led Businesses</h1>
          <p class="lead-text">Discover verified home enterprises across categories and locations.</p>
        </div>

        <!-- Filters Bar -->
        <div class="panel" style="padding:20px;margin-bottom:36px;">
          <div class="form-row-3" style="align-items:end;">
            <div class="form-group" style="margin-bottom:0;">
              <label>Search Business or Keyword</label>
              <input type="text" class="form-control" id="dir-search-input" value="${esc(state.searchQuery)}" placeholder="e.g. Sakhi Studio, jewelry, pickles..." oninput="updateDirectoryFilters()" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label>Filter by Category</label>
              <select class="form-control" id="dir-cat-select" onchange="updateDirectoryFilters()">
                <option value="">All Categories</option>
                ${categories.map((c) => `<option value="${esc(c.name)}" ${cat === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label>City or Locality</label>
              <input type="text" class="form-control" id="dir-city-input" value="${esc(state.selectedCity)}" placeholder="e.g. Hyderabad, Banjara Hills" oninput="updateDirectoryFilters()" />
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <label style="font-size:0.825rem;font-weight:600;">PIN Code:</label>
              <input type="text" class="form-control form-control-sm" style="width:130px;padding:6px 10px;" id="dir-pin-input" value="${esc(state.selectedPincode)}" placeholder="e.g. 500034" oninput="updateDirectoryFilters()" />
              <button class="btn btn-secondary btn-sm" onclick="detectUserLocation()">📍 Near Me</button>
            </div>
            <div>
              <span style="font-size:0.875rem;color:var(--text-muted);">Showing <b>${filtered.length}</b> verified businesses</span>
              ${q || cat || city || pin ? `<button class="btn btn-outline btn-sm" style="margin-left:8px;" onclick="resetDirectoryFilters()">Reset Filters</button>` : ''}
            </div>
          </div>
        </div>

        <!-- Directory Grid -->
        ${
          filtered.length === 0
            ? `
          <div class="empty-state panel">
            <div class="empty-state-icon">🔍</div>
            <h4>No matching businesses found</h4>
            <p>Try clearing filters or searching with a different keyword or location.</p>
            <button class="btn btn-primary btn-sm" style="margin-top:16px;" onclick="resetDirectoryFilters()">View All Businesses</button>
          </div>
        `
            : `
          <div class="business-grid">
            ${dirCardsHtml}
          </div>
        `
        }
      </div>
    `;
  }

  // 3. PRODUCT GALLERY VIEW
  async function renderProductsView() {
    const products = ANN_DB.getApprovedProducts();
    const categories = ANN_DB.getCategories();

    const q = (state.searchQuery || '').toLowerCase().trim();
    const cat = state.selectedCategory || '';
    const city = (state.selectedCity || '').toLowerCase().trim();

    const filtered = products.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q);
      const matchCat = !cat || p.category === cat;
      const matchCity = !city || (p.city && p.city.toLowerCase().includes(city)) || (p.locality && p.locality.toLowerCase().includes(city));
      return matchQ && matchCat && matchCity;
    });

    let cardsHtml = '';
    for (const prod of filtered) {
      let imgUrl = null;
      if (prod.imageIds && prod.imageIds.length > 0) {
        imgUrl = await ANN_DB.getImage(prod.imageIds[0]);
      }
      if (!imgUrl) {
        if (prod.category.includes('Jewelry') || prod.category.includes('Earring')) imgUrl = await ANN_DB.getImage('img-seed-jhumka');
        else if (prod.category.includes('Food')) imgUrl = await ANN_DB.getImage('img-seed-pickle');
        else imgUrl = await ANN_DB.getImage('img-seed-diya');
      }
      cardsHtml += `
        <article class="product-card" onclick="openProductDetail('${prod.id}')">
          <div class="product-card-thumb-wrap">
            <span class="badge badge-pending product-card-badge">${esc(prod.category)}</span>
            <img class="product-card-thumb" src="${imgUrl}" alt="${esc(prod.name)}" onerror="this.src=ANN_DB.getImage('img-seed-jhumka')" />
          </div>
          <div class="product-card-body">
            <span class="product-card-biz">${esc(prod.businessName)}</span>
            <h4 class="product-card-title">${esc(prod.name)}</h4>
            <p class="product-card-desc">${esc(prod.description)}</p>
            <div class="product-card-meta">
              <div class="product-price-box">
                <span class="product-price-val">₹${prod.price}</span>
                ${prod.discountPrice ? `<span class="product-price-strike">₹${prod.discountPrice}</span>` : ''}
              </div>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openProductDetail('${prod.id}')">Request</button>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <div class="container" style="padding:48px 0;">
        <div style="margin-bottom:32px;">
          <span class="eyebrow">Catalog</span>
          <h1>Handcrafted Product Gallery</h1>
          <p class="lead-text">Browse actual photographs of jewelry, apparel, food specialties and home decor crafted by women entrepreneurs.</p>
        </div>

        <!-- Filter bar -->
        <div class="panel" style="padding:20px;margin-bottom:36px;">
          <div class="form-row-3">
            <div class="form-group" style="margin-bottom:0;">
              <label>Search Products</label>
              <input type="text" class="form-control" id="prod-search-input" value="${esc(state.searchQuery)}" placeholder="e.g. Earrings, jhumka, pickle..." oninput="updateProductFilters()" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label>Category</label>
              <select class="form-control" id="prod-cat-select" onchange="updateProductFilters()">
                <option value="">All Categories</option>
                ${categories.map((c) => `<option value="${esc(c.name)}" ${cat === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label>City or Area</label>
              <input type="text" class="form-control" id="prod-city-input" value="${esc(state.selectedCity)}" placeholder="e.g. Hyderabad" oninput="updateProductFilters()" />
            </div>
          </div>
        </div>

        ${
          filtered.length === 0
            ? `
          <div class="empty-state panel">
            <div class="empty-state-icon">💍</div>
            <h4>No products match your criteria</h4>
            <p>Try searching with another keyword or resetting the category filter.</p>
          </div>
        `
            : `
          <div class="products-grid">
            ${cardsHtml}
          </div>
        `
        }
      </div>
    `;
  }

  // 4. BUSINESS DETAIL VIEW (PUBLIC PROFILE)
  async function renderBusinessDetailView(businessId) {
    const biz = ANN_DB.getBusinessById(businessId);
    if (!biz) {
      return `
        <div class="container" style="padding:60px 0;text-align:center;">
          <h2>Business not found</h2>
          <button class="btn btn-primary" onclick="navigateTo('directory')">Back to Directory</button>
        </div>
      `;
    }

    let bizCover = biz.coverImageId ? await ANN_DB.getImage(biz.coverImageId) : null;
    if (!bizCover) {
      if (biz.category.includes('Jewelry')) bizCover = await ANN_DB.getImage('img-seed-biz-sakhi');
      else if (biz.category.includes('Food')) bizCover = await ANN_DB.getImage('img-seed-biz-ananya');
      else bizCover = await ANN_DB.getImage('img-seed-biz-mitti');
    }

    const products = ANN_DB.getProductsByBusinessId(businessId);
    let prodCardsHtml = '';
    for (const prod of products) {
      let imgUrl = null;
      if (prod.imageIds && prod.imageIds.length > 0) {
        imgUrl = await ANN_DB.getImage(prod.imageIds[0]);
      }
      prodCardsHtml += `
        <article class="product-card" onclick="openProductDetail('${prod.id}')">
          <div class="product-card-thumb-wrap">
            <span class="badge badge-pending product-card-badge">${esc(prod.condition || prod.category)}</span>
            <img class="product-card-thumb" src="${imgUrl || ''}" alt="${esc(prod.name)}" />
          </div>
          <div class="product-card-body">
            <h4 class="product-card-title">${esc(prod.name)}</h4>
            <p class="product-card-desc">${esc(prod.description)}</p>
            <div class="product-card-meta">
              <div class="product-price-box">
                <span class="product-price-val">₹${prod.price}</span>
                ${prod.discountPrice ? `<span class="product-price-strike">₹${prod.discountPrice}</span>` : ''}
              </div>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openProductDetail('${prod.id}')">Request to Purchase</button>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <div class="container" style="padding:40px 0 60px;">
        <button class="btn btn-outline btn-sm" style="margin-bottom:24px;" onclick="navigateTo('directory')">&larr; Back to Directory</button>

        <!-- Business Header Banner -->
        <div class="panel" style="padding:0;overflow:hidden;border-top:4px solid var(--rose);">
          <div style="height:220px;width:100%;overflow:hidden;background:var(--pink-light);">
            <img src="${bizCover}" style="width:100%;height:100%;object-fit:cover;" alt="${esc(biz.name)}" onerror="this.src=ANN_DB.getImage('img-seed-biz-sakhi')" />
          </div>
          <div style="padding:32px 36px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px;">
            <div style="display:flex;gap:20px;align-items:center;">
              <div class="business-avatar" style="width:72px;height:72px;font-size:2.2rem;border-radius:18px;">
                <span>${biz.category.includes('Jewelry') ? '💍' : biz.category.includes('Food') ? '🍲' : '🏺'}</span>
              </div>
              <div>
                <span class="badge badge-approved" style="margin-bottom:6px;">Verified Home Business</span>
                <h1 style="font-size:2rem;margin-bottom:4px;">${esc(biz.name)}</h1>
                <p style="color:var(--text-muted);font-size:0.95rem;">Founded by <b>${esc(biz.ownerName)}</b> &middot; ${esc(biz.category)}</p>
              </div>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <button class="btn btn-secondary btn-sm" onclick="openEnquiryModal('${biz.id}', '${esc(biz.name)}')">Send Enquiry</button>
              <button class="btn btn-outline btn-sm" onclick="openReportModal('${biz.id}', '${esc(biz.name)}')">Report Listing</button>
            </div>
          </div>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--border);display:grid;grid-template-columns:1.8fr 1.2fr;gap:32px;">
            <div>
              <h4 style="margin-bottom:10px;">About the Business</h4>
              <p style="color:var(--text-main);line-height:1.7;margin-bottom:18px;">${esc(biz.desc)}</p>
              <div style="display:flex;flex-wrap:wrap;gap:12px;">
                <span class="badge badge-lavender">📍 ${esc(biz.locality)}, ${esc(biz.city)}</span>
                <span class="badge badge-lavender">PIN: ${esc(biz.pincode)}</span>
                <span class="badge badge-lavender">🚚 ${esc(biz.serviceArea || 'Local Pickup & Courier')}</span>
              </div>
            </div>
            <div style="background:var(--pink-light);padding:20px;border-radius:var(--radius-md);border:1px solid var(--border);">
              <h4 style="margin-bottom:12px;font-size:0.95rem;">Contact & Operations</h4>
              <p style="font-size:0.875rem;margin-bottom:8px;"><b>Phone:</b> ${esc(biz.contactPhone)}</p>
              <p style="font-size:0.875rem;margin-bottom:8px;"><b>Email:</b> ${esc(biz.contactEmail)}</p>
              <p style="font-size:0.875rem;margin-bottom:8px;"><b>Hours:</b> ${esc(biz.operatingHours || 'Flexible Home Hours')}</p>
              <p style="font-size:0.875rem;"><b>Address:</b> ${esc(biz.fullAddress)}</p>
            </div>
          </div>
        </div>

        <!-- Products Showcase -->
        <div style="margin-top:40px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <div>
              <h2>Products & Offerings (${products.length})</h2>
              <p style="color:var(--text-muted);font-size:0.95rem;">Select an item to view detailed photographs or submit a purchase request.</p>
            </div>
          </div>

          ${
            products.length === 0
              ? `
            <div class="panel empty-state">
              <div class="empty-state-icon">📦</div>
              <h4>No products listed yet</h4>
              <p>This business has not added any product listings.</p>
            </div>
          `
              : `
            <div class="products-grid">
              ${prodCardsHtml}
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  // 5. PORTAL SELECTOR (THREE SEPARATE LOGINS)
  function renderLoginPortalView() {
    return `
      <div class="auth-page-container">
        <div class="portal-selection-box">
          <span class="eyebrow">Choose Your Experience</span>
          <h1>Welcome to Aatmanirbhar Nari</h1>
          <p class="lead-text" style="margin:12px auto 0;">
            Select your role to access your dedicated workspace or login interface.
          </p>

          <div class="portal-cards-grid">
            <!-- 1. Entrepreneur / Seller -->
            <div class="portal-card" onclick="navigateTo('login-seller')">
              <div class="portal-card-icon">👩‍💼</div>
              <span class="badge badge-pending" style="align-self:flex-start;margin-bottom:12px;">Sell & Grow</span>
              <h3>Entrepreneur / Seller</h3>
              <p>Create your verified business profile, upload actual product photographs, set prices, and manage customer purchase requests.</p>
              <button class="btn btn-primary" style="width:100%;">Entrepreneur Login &rarr;</button>
            </div>

            <!-- 2. Customer / Buyer -->
            <div class="portal-card" onclick="navigateTo('login-customer')">
              <div class="portal-card-icon">🛍️</div>
              <span class="badge badge-lavender" style="align-self:flex-start;margin-bottom:12px;">Discover & Buy</span>
              <h3>Customer / Buyer</h3>
              <p>Explore verified women-led home businesses, view genuine handcrafted creations, and submit direct purchase requests.</p>
              <button class="btn btn-secondary" style="width:100%;">Customer Login &rarr;</button>
            </div>

            <!-- 3. Administrator -->
            <div class="portal-card" onclick="navigateTo('login-admin')">
              <div class="portal-card-icon">🛡️</div>
              <span class="badge badge-approved" style="align-self:flex-start;margin-bottom:12px;">Review & Verify</span>
              <h3>Platform Admin</h3>
              <p>Review submitted businesses, inspect uploaded product photographs, approve or request changes, and manage branding.</p>
              <button class="btn btn-outline" style="width:100%;">Admin Login &rarr;</button>
            </div>
          </div>

          <div style="margin-top:36px;">
            <a href="javascript:void(0)" onclick="navigateTo('directory')" style="font-size:0.95rem;color:var(--text-muted);font-weight:600;">
              Or continue browsing the public business directory as a guest &rarr;
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 6. DEDICATED SELLER LOGIN
  function renderSellerLoginView() {
    return `
      <div class="auth-page-container">
        <div class="auth-card">
          <div class="auth-header">
            <span class="role-tag">Entrepreneur / Seller Portal</span>
            <h2>Sign In to Your Business</h2>
            <p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">Manage your profile, upload products, and respond to buyer requests.</p>
          </div>

          <div class="auth-demo-banner" style="flex-direction:column;align-items:stretch;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span class="badge badge-approved" style="font-size:0.7rem;margin-bottom:2px;">Akshaya Reddy</span>
                <div style="font-size:0.85rem;"><b>pattiakshayareddy03@gmail.com</b> &bull; pass: <b>password123</b></div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="fillAkshayaDemoCredentials()">Quick Fill</button>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px dashed var(--border);">
              <div>
                <span class="badge badge-pending" style="font-size:0.7rem;margin-bottom:2px;">Sample Store</span>
                <div style="font-size:0.85rem;"><b>meera@sakhi.in</b> &bull; pass: <b>seller123</b></div>
              </div>
              <button class="btn btn-subtle btn-sm" onclick="fillSellerDemoCredentials()">Quick Fill</button>
            </div>
          </div>

          <form id="seller-login-form" onsubmit="handleSellerLogin(event)">
            <div class="form-group">
              <label for="seller-ident">Email or Phone Number <span class="required">*</span></label>
              <input type="text" id="seller-ident" class="form-control" required placeholder="Enter registered email or phone" />
            </div>
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label for="seller-pass">Password <span class="required">*</span></label>
                <a href="javascript:void(0)" onclick="openForgotPasswordModal('seller')" style="font-size:0.8rem;">Forgot password?</a>
              </div>
              <input type="password" id="seller-pass" class="form-control" required placeholder="Enter password" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Sign In to Seller Dashboard</button>
          </form>

          <div style="margin-top:24px;text-align:center;padding-top:16px;border-top:1px solid var(--border);font-size:0.875rem;">
            <span>Don't have a seller account yet? </span>
            <a href="javascript:void(0)" onclick="navigateTo('register-seller')" style="font-weight:600;">Register as an Entrepreneur</a>
          </div>
          <div style="margin-top:12px;text-align:center;">
            <a href="javascript:void(0)" onclick="navigateTo('login-portal')" style="font-size:0.8rem;color:var(--text-muted);">&larr; Switch to another login role</a>
          </div>
        </div>
      </div>
    `;
  }

  // 7. DEDICATED CUSTOMER LOGIN
  function renderCustomerLoginView() {
    return `
      <div class="auth-page-container">
        <div class="auth-card">
          <div class="auth-header">
            <span class="role-tag" style="background:var(--lavender);color:var(--text-heading);">Customer / Buyer Portal</span>
            <h2>Customer Sign In</h2>
            <p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">Track your purchase requests and saved women-led businesses.</p>
          </div>

          <div class="auth-demo-banner">
            <span>Demo: <b>anita@example.com</b> / <b>customer123</b></span>
            <button class="btn btn-subtle btn-sm" onclick="fillCustomerDemoCredentials()">Quick Fill</button>
          </div>

          <form id="customer-login-form" onsubmit="handleCustomerLogin(event)">
            <div class="form-group">
              <label for="cust-ident">Email or Phone Number <span class="required">*</span></label>
              <input type="text" id="cust-ident" class="form-control" required placeholder="Enter registered email or phone" />
            </div>
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label for="cust-pass">Password <span class="required">*</span></label>
                <a href="javascript:void(0)" onclick="openForgotPasswordModal('customer')" style="font-size:0.8rem;">Forgot password?</a>
              </div>
              <input type="password" id="cust-pass" class="form-control" required placeholder="Enter password" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Sign In as Customer</button>
          </form>

          <div style="margin-top:24px;text-align:center;padding-top:16px;border-top:1px solid var(--border);font-size:0.875rem;">
            <span>New customer? </span>
            <a href="javascript:void(0)" onclick="navigateTo('register-customer')" style="font-weight:600;">Create customer account</a>
          </div>
          <div style="margin-top:12px;text-align:center;">
            <a href="javascript:void(0)" onclick="navigateTo('login-portal')" style="font-size:0.8rem;color:var(--text-muted);">&larr; Switch to another login role</a>
          </div>
        </div>
      </div>
    `;
  }

  // 8. DEDICATED ADMIN LOGIN
  function renderAdminLoginView() {
    return `
      <div class="auth-page-container">
        <div class="auth-card">
          <div class="auth-header">
            <span class="role-tag" style="background:var(--status-approved-bg);color:var(--status-approved-text);">Platform Administration</span>
            <h2>Administrator Sign In</h2>
            <p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">Platform review queue, product moderation, and branding settings.</p>
          </div>

          <div class="auth-demo-banner">
            <span>Demo: <b>admin@aatmanirbharnari.in</b> / <b>admin123</b></span>
            <button class="btn btn-subtle btn-sm" onclick="fillAdminDemoCredentials()">Quick Fill</button>
          </div>

          <form id="admin-login-form" onsubmit="handleAdminLogin(event)">
            <div class="form-group">
              <label for="admin-email">Admin Email <span class="required">*</span></label>
              <input type="email" id="admin-email" class="form-control" required placeholder="admin@aatmanirbharnari.in" />
            </div>
            <div class="form-group">
              <label for="admin-pass">Password <span class="required">*</span></label>
              <input type="password" id="admin-pass" class="form-control" required placeholder="Enter admin password" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Sign In to Admin Console</button>
          </form>

          <div style="margin-top:24px;text-align:center;padding-top:16px;border-top:1px solid var(--border);font-size:0.8rem;color:var(--text-muted);">
            <span>Platform Security: Admin accounts are managed privately. Public registration is not permitted.</span>
          </div>
          <div style="margin-top:12px;text-align:center;">
            <a href="javascript:void(0)" onclick="navigateTo('login-portal')" style="font-size:0.8rem;color:var(--text-muted);">&larr; Back to login selection</a>
          </div>
        </div>
      </div>
    `;
  }

  // 9. SELLER REGISTRATION VIEW
  function renderSellerRegisterView() {
    const categories = ANN_DB.getCategories();
    return `
      <div class="container" style="max-width:840px;padding:50px 0;">
        <button class="btn btn-outline btn-sm" style="margin-bottom:20px;" onclick="navigateTo('login-seller')">&larr; Back to Seller Login</button>
        
        <div class="panel" style="padding:40px;">
          <div style="margin-bottom:28px;">
            <span class="eyebrow">Entrepreneur Registration</span>
            <h2>Register Your Business on Aatmanirbhar Nari</h2>
            <p style="color:var(--text-muted);">
              Set up your profile, showcase your handcrafted creations, and start receiving direct customer purchase requests.
            </p>
          </div>

          <div style="background:linear-gradient(135deg, #FBECEF 0%, #F6DDE3 100%);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span class="badge badge-approved" style="margin-bottom:4px;">1-Click Evaluator Testing</span>
              <h4 style="margin:2px 0;font-size:1rem;">Register with Akshaya Reddy's Details</h4>
              <p style="font-size:0.825rem;color:var(--text-muted);margin:0;">Instant pre-fill for <b>pattiakshayareddy03@gmail.com</b> &amp; royal jewelry business.</p>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-primary btn-sm" onclick="fillAkshayaJewelryRegistration()">⚡ Auto-fill Akshaya Reddy</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="fillSampleJewelryRegistration()">Sample Radha</button>
            </div>
          </div>

          <form id="seller-reg-form" onsubmit="handleSellerRegisterSubmit(event)">
            <!-- Personal Information -->
            <h4 style="margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border);">1. Personal & Entrepreneur Details</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label for="reg-fullname">Your Full Name <span class="required">*</span></label>
                <input type="text" id="reg-fullname" class="form-control" required placeholder="e.g. Meera Sharma" />
              </div>
              <div class="form-group">
                <label for="reg-email">Email Address <span class="required">*</span></label>
                <input type="email" id="reg-email" class="form-control" required placeholder="e.g. meera@mycrafts.in" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="reg-phone">Phone / WhatsApp Number <span class="required">*</span></label>
                <input type="tel" id="reg-phone" class="form-control" required placeholder="e.g. +91 98765 43210" />
              </div>
              <div class="form-group">
                <label for="reg-pass">Create Password <span class="required">*</span></label>
                <input type="password" id="reg-pass" class="form-control" required minlength="6" placeholder="At least 6 characters" />
              </div>
            </div>

            <!-- Business Information -->
            <h4 style="margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid var(--border);">2. Business & Workshop Details</h4>

            <div class="form-row">
              <div class="form-group">
                <label for="reg-bizname">Business or Brand Name <span class="required">*</span></label>
                <input type="text" id="reg-bizname" class="form-control" required placeholder="e.g. Sakhi Studio & Handcrafted Jewelry" />
              </div>
              <div class="form-group">
                <label for="reg-category">Business Category <span class="required">*</span></label>
                <select id="reg-category" class="form-control" required>
                  ${categories.map((c) => `<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="reg-desc">Business Story & Description <span class="required">*</span></label>
              <textarea id="reg-desc" class="form-control" required placeholder="Describe your craft, specialties, experience, and the story behind your venture..."></textarea>
            </div>

            <!-- Location Details -->
            <h4 style="margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid var(--border);">3. Location & Service Reach</h4>

            <div class="form-row-3">
              <div class="form-group">
                <label for="reg-state">State <span class="required">*</span></label>
                <input type="text" id="reg-state" class="form-control" required placeholder="e.g. Telangana" value="Telangana" />
              </div>
              <div class="form-group">
                <label for="reg-city">City <span class="required">*</span></label>
                <input type="text" id="reg-city" class="form-control" required placeholder="e.g. Hyderabad" value="Hyderabad" />
              </div>
              <div class="form-group">
                <label for="reg-locality">Area / Locality <span class="required">*</span></label>
                <input type="text" id="reg-locality" class="form-control" required placeholder="e.g. Banjara Hills, Kukatpally" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="reg-pincode">PIN Code <span class="required">*</span></label>
                <input type="text" id="reg-pincode" class="form-control" required placeholder="e.g. 500034" maxlength="6" />
              </div>
              <div class="form-group">
                <label for="reg-service-area">Service & Delivery Area</label>
                <input type="text" id="reg-service-area" class="form-control" placeholder="e.g. Hyderabad local delivery & Pan-India courier" />
              </div>
            </div>

            <div class="form-group">
              <label for="reg-address">Full Address / Workshop Location</label>
              <input type="text" id="reg-address" class="form-control" placeholder="Street, landmark, or pickup point" />
            </div>

            <!-- Business Cover Photograph / Branding (Requirement 3) -->
            <h4 style="margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid var(--border);">4. Business Cover Photograph / Storefront Banner</h4>
            <div class="form-group">
              <label for="reg-cover-file">Upload Cover Photo or Store Banner (Optional)</label>
              <input type="file" id="reg-cover-file" class="form-control" accept="image/png,image/jpeg,image/jpg,image/webp" onchange="handleSellerRegCoverSelect(event)" />
              <span class="form-help">Select a photograph from your laptop (JPG, PNG, or WEBP). If omitted, an artisanal banner will be automatically assigned.</span>
              <div id="reg-cover-preview" style="margin-top:10px;height:140px;display:none;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border);background:var(--pink-light);"></div>
            </div>

            <!-- Action buttons -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:32px;padding-top:20px;border-top:1px solid var(--border);">
              <button type="button" class="btn btn-outline" onclick="saveSellerRegistrationDraft()">Save Draft & Continue Later</button>
              <button type="submit" class="btn btn-primary btn-lg">Submit Business Profile &rarr;</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 10. CUSTOMER REGISTRATION VIEW
  function renderCustomerRegisterView() {
    return `
      <div class="auth-page-container">
        <div class="auth-card">
          <div class="auth-header">
            <span class="role-tag" style="background:var(--lavender);color:var(--text-heading);">New Customer</span>
            <h2>Create Customer Account</h2>
            <p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">Join to discover and support local women-led enterprises.</p>
          </div>

          <form id="customer-reg-form" onsubmit="handleCustomerRegisterSubmit(event)">
            <div class="form-group">
              <label for="cust-reg-name">Full Name <span class="required">*</span></label>
              <input type="text" id="cust-reg-name" class="form-control" required placeholder="e.g. Anita Desai" />
            </div>
            <div class="form-group">
              <label for="cust-reg-email">Email Address <span class="required">*</span></label>
              <input type="email" id="cust-reg-email" class="form-control" required placeholder="e.g. anita@example.com" />
            </div>
            <div class="form-group">
              <label for="cust-reg-phone">Phone Number <span class="required">*</span></label>
              <input type="tel" id="cust-reg-phone" class="form-control" required placeholder="e.g. +91 98765 99887" />
            </div>
            <div class="form-group">
              <label for="cust-reg-city">City</label>
              <input type="text" id="cust-reg-city" class="form-control" placeholder="e.g. Hyderabad" />
            </div>
            <div class="form-group">
              <label for="cust-reg-pass">Create Password <span class="required">*</span></label>
              <input type="password" id="cust-reg-pass" class="form-control" required minlength="6" placeholder="At least 6 characters" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Create Account</button>
          </form>

          <div style="margin-top:20px;text-align:center;padding-top:14px;border-top:1px solid var(--border);font-size:0.875rem;">
            <span>Already have an account? </span>
            <a href="javascript:void(0)" onclick="navigateTo('login-customer')" style="font-weight:600;">Sign in here</a>
          </div>
        </div>
      </div>
    `;
  }

  // 11. SELLER DASHBOARD VIEW
  async function renderSellerDashboardView() {
    const session = ANN_DB.getCurrentSession();
    if (!session || session.role !== 'entrepreneur') {
      navigateTo('login-seller');
      return '';
    }

    const business = ANN_DB.getBusinessByOwnerId(session.user.id);
    const products = business ? ANN_DB.getProductsByBusinessId(business.id) : [];
    const requests = business ? ANN_DB.getRequestsForSeller(business.id) : [];
    const enquiries = business ? ANN_DB.getEnquiriesForBusiness(business.id) : [];

    const activeTab = state.sellerActiveTab || 'overview';

    let mainContentHtml = '';

    // A. TAB: OVERVIEW
    if (activeTab === 'overview') {
      const statusClass =
        business && business.status === 'Approved'
          ? 'badge-approved'
          : business && business.status === 'Pending Review'
          ? 'badge-pending'
          : business && business.status === 'Changes Requested'
          ? 'badge-changes'
          : 'badge-rejected';

      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Seller Dashboard</span>
            <h2>Welcome back, ${esc(session.user.name)}</h2>
            <p style="color:var(--text-muted);">${business ? esc(business.name) : 'No business registered'}</p>
          </div>
          <div>
            ${
              business
                ? `<span class="badge ${statusClass}" style="font-size:0.85rem;padding:6px 14px;">Status: ${business.status}</span>`
                : ''
            }
          </div>
        </div>

        <!-- Metrics Row -->
        <div class="metrics-row">
          <div class="metric-card">
            <span class="metric-card-label">Approval Status</span>
            <div style="margin-top:6px;">
              <span class="badge ${statusClass}">${business ? business.status : 'Draft'}</span>
            </div>
            <span class="metric-card-sub">${business && business.status === 'Approved' ? 'Publicly discoverable' : 'Pending admin review'}</span>
          </div>
          <div class="metric-card">
            <span class="metric-card-label">Total Products</span>
            <span class="metric-card-val">${products.length}</span>
            <span class="metric-card-sub">Active in catalog</span>
          </div>
          <div class="metric-card">
            <span class="metric-card-label">Purchase Requests</span>
            <span class="metric-card-val">${requests.length}</span>
            <span class="metric-card-sub">${requests.filter((r) => r.status === 'New Request').length} New</span>
          </div>
          <div class="metric-card">
            <span class="metric-card-label">Inquiries Received</span>
            <span class="metric-card-val">${enquiries.length}</span>
            <span class="metric-card-sub">Customer messages</span>
          </div>
        </div>

        <!-- Submission Status Banner -->
        ${
          business && business.status === 'Draft'
            ? `
          <div class="panel" style="background:var(--pink-light);border-color:var(--rose);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
              <div>
                <h4 style="color:var(--rose-dark);margin-bottom:4px;">Your profile is in Draft status</h4>
                <p style="font-size:0.9rem;color:var(--text-main);">Submit your business and products for admin review so customers can discover you in the directory.</p>
              </div>
              <button class="btn btn-primary" onclick="submitBusinessForAdminReview('${business.id}')">Submit for Admin Review</button>
            </div>
          </div>
        `
            : ''
        }

        ${
          business && business.status === 'Changes Requested'
            ? `
          <div class="panel" style="background:var(--status-changes-bg);border-color:var(--status-changes-text);">
            <h4 style="color:var(--status-changes-text);margin-bottom:6px;">Admin Requested Modifications</h4>
            <p style="font-size:0.9rem;margin-bottom:12px;"><b>Admin note:</b> ${esc(business.reviewNote || 'Please review and update your information.')}</p>
            <button class="btn btn-primary btn-sm" onclick="submitBusinessForAdminReview('${business.id}')">Re-submit for Review</button>
          </div>
        `
            : ''
        }

        <!-- Recent Purchase Requests -->
        <div class="panel">
          <div class="panel-header">
            <h3>Recent Customer Purchase Requests</h3>
            <button class="btn btn-outline btn-sm" onclick="setSellerTab('requests')">View All (${requests.length})</button>
          </div>
          ${
            requests.length === 0
              ? `
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <h4>No purchase requests yet</h4>
              <p>Once your business is approved and customers view your products, requests will appear here.</p>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Qty</th>
                    <th>Est. Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${requests.slice(0, 4).map((r) => `
                    <tr>
                      <td><b>${esc(r.id)}</b></td>
                      <td>${esc(r.productName)}</td>
                      <td>${esc(r.customerName)}<br><small style="color:var(--text-muted);">${esc(r.contactPreference)}: ${esc(r.customerPhone)}</small></td>
                      <td>${r.quantity}</td>
                      <td><b>₹${r.estimatedTotal}</b></td>
                      <td><span class="badge ${r.status === 'Accepted' ? 'badge-approved' : r.status === 'New Request' ? 'badge-pending' : 'badge-lavender'}">${r.status}</span></td>
                      <td><button class="btn btn-secondary btn-sm" onclick="openSellerRequestAction('${r.id}')">Manage</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>

        <!-- Quick Actions -->
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="setSellerTab('add-product')">+ Add New Product</button>
          <button class="btn btn-outline" onclick="setSellerTab('products')">Manage My Products (${products.length})</button>
          <button class="btn btn-secondary" onclick="openBusinessDetail('${business ? business.id : ''}')">Preview Public Profile</button>
        </div>
      `;
    }

    // B. TAB: MY BUSINESS PROFILE (VIEW & EDIT)
    else if (activeTab === 'profile') {
      const categories = ANN_DB.getCategories();
      const statusClass =
        business && business.status === 'Approved'
          ? 'badge-approved'
          : business && business.status === 'Pending Review'
          ? 'badge-pending'
          : business && business.status === 'Changes Requested'
          ? 'badge-changes'
          : 'badge-rejected';

      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Entrepreneur Workspace</span>
            <h2>My Business Profile</h2>
            <p style="color:var(--text-muted);">View and update your registered business details, contact information, and service area.</p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-outline btn-sm" onclick="openBusinessDetail('${business ? business.id : ''}')">Preview Public Profile</button>
            ${
              business && (business.status === 'Draft' || business.status === 'Changes Requested')
                ? `<button class="btn btn-primary btn-sm" onclick="submitBusinessForAdminReview('${business.id}')">Submit for Admin Review</button>`
                : ''
            }
          </div>
        </div>

        <div class="panel">
          <form id="seller-profile-edit-form" onsubmit="handleSaveBusinessProfile(event)">
            <div class="form-row">
              <div class="form-group">
                <label for="edit-biz-name">Business / Brand Name <span class="required">*</span></label>
                <input type="text" id="edit-biz-name" class="form-control" required value="${esc(business ? business.name : '')}" />
              </div>
              <div class="form-group">
                <label for="edit-biz-category">Category <span class="required">*</span></label>
                <select id="edit-biz-category" class="form-control" required>
                  ${categories.map(c => `<option value="${esc(c.name)}" ${business && business.category === c.name ? 'selected' : ''}>${c.icon} ${esc(c.name)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="edit-biz-desc">Business Story & Description <span class="required">*</span></label>
              <textarea id="edit-biz-desc" class="form-control" required>${esc(business ? business.desc : '')}</textarea>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label for="edit-biz-state">State</label>
                <input type="text" id="edit-biz-state" class="form-control" value="${esc(business ? business.state : 'Telangana')}" />
              </div>
              <div class="form-group">
                <label for="edit-biz-city">City</label>
                <input type="text" id="edit-biz-city" class="form-control" value="${esc(business ? business.city : 'Hyderabad')}" />
              </div>
              <div class="form-group">
                <label for="edit-biz-locality">Locality / Area</label>
                <input type="text" id="edit-biz-locality" class="form-control" value="${esc(business ? business.locality : '')}" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="edit-biz-pincode">PIN Code</label>
                <input type="text" id="edit-biz-pincode" class="form-control" value="${esc(business ? business.pincode : '')}" maxlength="6" />
              </div>
              <div class="form-group">
                <label for="edit-biz-service-area">Service & Delivery Area</label>
                <input type="text" id="edit-biz-service-area" class="form-control" value="${esc(business ? business.serviceArea : '')}" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="edit-biz-phone">Public Contact Phone / WhatsApp</label>
                <input type="tel" id="edit-biz-phone" class="form-control" value="${esc(business ? business.contactPhone : '')}" />
              </div>
              <div class="form-group">
                <label for="edit-biz-hours">Operating Hours</label>
                <input type="text" id="edit-biz-hours" class="form-control" value="${esc(business ? business.operatingHours : '')}" />
              </div>
            </div>

            <div class="form-group">
              <label for="edit-biz-address">Full Address / Workshop Location</label>
              <input type="text" id="edit-biz-address" class="form-control" value="${esc(business ? business.fullAddress : '')}" />
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:28px;padding-top:18px;border-top:1px solid var(--border);">
              <div>
                <span class="badge ${statusClass}">Status: ${business ? business.status : 'Draft'}</span>
              </div>
              <div style="display:flex;gap:12px;">
                <button type="button" class="btn btn-outline" onclick="openBusinessDetail('${business ? business.id : ''}')">Preview Public Profile</button>
                <button type="submit" class="btn btn-primary btn-lg">Save Profile Changes</button>
              </div>
            </div>
          </form>
        </div>
      `;
    }

    // C. TAB: ADD PRODUCT (REAL LAPTOP PHOTO UPLOADER)
    else if (activeTab === 'add-product') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Product Catalog</span>
            <h2>${state.editingProductId ? 'Edit Product' : 'Add New Product with Real Laptop Photos'}</h2>
            <p style="color:var(--text-muted);">Select genuine product photos from your computer, set prices, and publish to your store.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="setSellerTab('products')">&larr; Back to My Products</button>
        </div>

        <div class="panel">
          <form id="product-upload-form" onsubmit="handleProductSaveSubmit(event)">
            
            <!-- Real Photo Upload Dropzone (HIGHEST PRIORITY REQUIREMENT) -->
            <div class="form-group" style="margin-bottom:28px;">
              <label style="font-size:1rem;margin-bottom:8px;">
                Actual Product Photographs <span class="required">*</span>
              </label>
              
              <!-- Hidden Native File Input -->
              <input
                type="file"
                id="product-native-file-picker"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style="display:none;"
                onchange="handleNativeProductImageSelect(event)"
              />

              <!-- Dropzone Box -->
              <div
                class="upload-dropzone"
                id="product-upload-dropzone"
                onclick="triggerNativeProductFilePicker()"
                ondragover="handleProductDragOver(event)"
                ondragleave="handleProductDragLeave(event)"
                ondrop="handleProductFileDrop(event)"
              >
                <div class="dropzone-icon">📷</div>
                <div class="dropzone-title">Click to Upload Photographs from Your Computer</div>
                <div class="dropzone-sub">
                  Supports multiple JPG, JPEG, PNG, or WEBP images (Up to 10MB each)
                </div>
                <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation();triggerNativeProductFilePicker()">
                    📷 Select Photos from Laptop
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();fillSampleJewelryProductFields()">
                    ⚡ Auto-fill Jewelry Details (Price &amp; Features)
                  </button>
                </div>
              </div>

              <!-- Instant Previews Grid -->
              <div id="product-images-preview-grid" class="image-preview-grid">
                <!-- Dynamically populated -->
              </div>
              <span class="form-help" style="margin-top:8px;display:block;">
                First image will be the primary catalog thumbnail. Images are stored securely in your browser's IndexedDB.
              </span>
            </div>

            <!-- Product Information -->
            <h4 style="margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border);">Product Information</h4>

            <div class="form-row">
              <div class="form-group">
                <label for="prod-name">Product Name <span class="required">*</span></label>
                <input type="text" id="prod-name" class="form-control" required placeholder="e.g. Handmade Kundan & Pearl Jhumka Earrings" />
              </div>
              <div class="form-group">
                <label for="prod-category">Product Category <span class="required">*</span></label>
                <select id="prod-category" class="form-control" required>
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Earrings">Earrings</option>
                  <option value="Necklace & Sets">Necklace & Sets</option>
                  <option value="Bangles & Bracelets">Bangles & Bracelets</option>
                  <option value="Handloom & Tailoring">Handloom & Tailoring</option>
                  <option value="Food & Bakery">Food & Bakery</option>
                  <option value="Home Decor & Crafts">Home Decor & Crafts</option>
                  <option value="Beauty & Wellness">Beauty & Wellness</option>
                </select>
              </div>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label for="prod-price">Price in INR (₹) <span class="required">*</span></label>
                <input type="number" id="prod-price" class="form-control" required placeholder="e.g. 499" min="1" />
              </div>
              <div class="form-group">
                <label for="prod-discount">Discount MRP (Optional)</label>
                <input type="number" id="prod-discount" class="form-control" placeholder="e.g. 699" min="1" />
              </div>
              <div class="form-group">
                <label for="prod-qty">Available Quantity / Batches</label>
                <input type="number" id="prod-qty" class="form-control" value="10" min="1" />
              </div>
            </div>

            <div class="form-group">
              <label for="prod-description">Product Description <span class="required">*</span></label>
              <textarea id="prod-description" class="form-control" required placeholder="Describe the materials, craftsmanship, styling tips, and dimensions..."></textarea>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label for="prod-material">Material</label>
                <input type="text" id="prod-material" class="form-control" placeholder="e.g. Brass, Kundan stones, Freshwater pearls" />
              </div>
              <div class="form-group">
                <label for="prod-color">Colour</label>
                <input type="text" id="prod-color" class="form-control" placeholder="e.g. Antique Gold & Pearl White" />
              </div>
              <div class="form-group">
                <label for="prod-size">Size / Dimensions</label>
                <input type="text" id="prod-size" class="form-control" placeholder="e.g. 2.4 inches drop length" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="prod-condition">Condition / Type</label>
                <select id="prod-condition" class="form-control">
                  <option value="Handcrafted New">Handcrafted New</option>
                  <option value="Made to Order">Made to Order</option>
                  <option value="Customizable Batch">Customizable Batch</option>
                </select>
              </div>
              <div class="form-group">
                <label for="prod-availability">Availability Status</label>
                <select id="prod-availability" class="form-control">
                  <option value="In Stock">In Stock - Ready to Dispatch</option>
                  <option value="Made to Order">Made to Order (2-3 days)</option>
                  <option value="Pre-order">Pre-order</option>
                </select>
              </div>
            </div>

            <!-- Location & Delivery Notes -->
            <h4 style="margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid var(--border);">Location & Delivery Details</h4>

            <div class="form-row-3">
              <div class="form-group">
                <label for="prod-city">City</label>
                <input type="text" id="prod-city" class="form-control" value="${esc(business ? business.city : 'Hyderabad')}" />
              </div>
              <div class="form-group">
                <label for="prod-locality">Locality</label>
                <input type="text" id="prod-locality" class="form-control" value="${esc(business ? business.locality : 'Banjara Hills')}" />
              </div>
              <div class="form-group">
                <label for="prod-pin">PIN Code</label>
                <input type="text" id="prod-pin" class="form-control" value="${esc(business ? business.pincode : '500034')}" />
              </div>
            </div>

            <div class="form-group">
              <label for="prod-delivery-notes">Delivery & Pickup Instructions</label>
              <input type="text" id="prod-delivery-notes" class="form-control" placeholder="e.g. Local pickup available from Banjara Hills; 24-hr courier delivery in Hyderabad." />
            </div>

            <!-- Form Actions -->
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:32px;padding-top:20px;border-top:1px solid var(--border);">
              <button type="button" class="btn btn-outline" onclick="previewProductModal()">Preview Product</button>
              <button type="submit" class="btn btn-primary btn-lg">${state.editingProductId ? 'Update Product' : 'Save & Publish Product'}</button>
            </div>
          </form>
        </div>
      `;
    }

    // C. TAB: MY PRODUCTS
    else if (activeTab === 'products') {
      let prodRowsHtml = '';
      for (const p of products) {
        let imgUrl = null;
        if (p.imageIds && p.imageIds.length > 0) {
          imgUrl = await ANN_DB.getImage(p.imageIds[0]);
        }
        prodRowsHtml += `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:12px;">
                <img src="${imgUrl || ''}" alt="" style="width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid var(--border);" />
                <div>
                  <b>${esc(p.name)}</b><br>
                  <small style="color:var(--text-muted);">${esc(p.category)} &middot; ${esc(p.availability)}</small>
                </div>
              </div>
            </td>
            <td><b>₹${p.price}</b> ${p.discountPrice ? `<small style="text-decoration:line-through;color:var(--text-muted);">₹${p.discountPrice}</small>` : ''}</td>
            <td>${p.quantity || 1} in stock</td>
            <td><span class="badge badge-approved">${p.status || 'Published'}</span></td>
            <td>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn-outline btn-sm" onclick="confirmDeleteProduct('${p.id}')">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }

      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Inventory & Catalog</span>
            <h2>My Products (${products.length})</h2>
            <p style="color:var(--text-muted);">Manage your offerings, edit details, or remove discontinued items.</p>
          </div>
          <button class="btn btn-primary" onclick="setSellerTab('add-product')">+ Add New Product</button>
        </div>

        <div class="panel">
          ${
            products.length === 0
              ? `
            <div class="empty-state">
              <div class="empty-state-icon">💍</div>
              <h4>No products listed yet</h4>
              <p>Add your first handcrafted jewelry piece with photographs from your laptop.</p>
              <button class="btn btn-primary btn-sm" style="margin-top:14px;" onclick="setSellerTab('add-product')">Add Product Now</button>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product & Thumbnail</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${prodRowsHtml}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      `;
    }

    // D. TAB: CUSTOMER PURCHASE REQUESTS
    else if (activeTab === 'requests') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Customer Engagement</span>
            <h2>Purchase Requests (${requests.length})</h2>
            <p style="color:var(--text-muted);">Manage purchase requests sent by buyers, update statuses, and send coordination notes.</p>
          </div>
        </div>

        <div class="panel">
          ${
            requests.length === 0
              ? `
            <div class="empty-state">
              <div class="empty-state-icon">🛍️</div>
              <h4>No purchase requests yet</h4>
              <p>When customers view your earrings or products and request to purchase, they will appear here.</p>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Product</th>
                    <th>Customer Name & Contact</th>
                    <th>Fulfillment</th>
                    <th>Qty / Est. Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${requests.map((r) => `
                    <tr>
                      <td><b>${esc(r.id)}</b><br><small style="color:var(--text-muted);">${new Date(r.createdAt).toLocaleDateString()}</small></td>
                      <td><b>${esc(r.productName)}</b></td>
                      <td>
                        <b>${esc(r.customerName)}</b><br>
                        <small style="color:var(--text-muted);">${esc(r.contactPreference)}: ${esc(r.customerPhone)}</small>
                      </td>
                      <td>${esc(r.fulfillmentPreference)}<br><small style="color:var(--text-muted);">${esc(r.deliveryAddress || 'Self-Pickup')}</small></td>
                      <td>${r.quantity} pcs<br><b>₹${r.estimatedTotal}</b></td>
                      <td>
                        <span class="badge ${r.status === 'Accepted' ? 'badge-approved' : r.status === 'New Request' ? 'badge-pending' : r.status === 'Declined' ? 'badge-rejected' : 'badge-lavender'}">
                          ${r.status}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-primary btn-sm" onclick="openSellerRequestAction('${r.id}')">Manage</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      `;
    }

    // E. TAB: ENQUIRIES
    else if (activeTab === 'enquiries') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Communication</span>
            <h2>Customer Inquiries (${enquiries.length})</h2>
            <p style="color:var(--text-muted);">General questions and customization queries sent by potential buyers.</p>
          </div>
        </div>

        <div class="panel">
          ${
            enquiries.length === 0
              ? `
            <div class="empty-state">
              <div class="empty-state-icon">💬</div>
              <h4>No customer inquiries yet</h4>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${enquiries.map((e) => `
                    <tr>
                      <td>${new Date(e.createdAt).toLocaleDateString()}</td>
                      <td><b>${esc(e.name)}</b><br><small style="color:var(--text-muted);">${esc(e.contact)}</small></td>
                      <td>
                        ${e.productName ? `<div style="font-size:0.8rem;color:var(--rose);font-weight:600;margin-bottom:3px;">Re: ${esc(e.productName)}</div>` : ''}
                        ${esc(e.message)}
                        ${e.sellerReply ? `<div style="margin-top:6px;font-size:0.825rem;color:var(--rose-dark);background:var(--pink-light);padding:6px 10px;border-radius:6px;"><b>Your reply:</b> "${esc(e.sellerReply)}"</div>` : ''}
                      </td>
                      <td><span class="badge ${e.status === 'Responded' ? 'badge-approved' : 'badge-lavender'}">${e.status}</span></td>
                      <td><button class="btn btn-secondary btn-sm" onclick="replyToEnquiryPrompt('${e.id}')">${e.status === 'Responded' ? 'Update Reply' : 'Reply'}</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      `;
    }

    // F. TAB: APPROVAL STATUS & SUBMISSION
    else if (activeTab === 'approval-status') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Platform Verification</span>
            <h2>Business Verification Status</h2>
            <p style="color:var(--text-muted);">Administrative review state and moderation history.</p>
          </div>
        </div>

        <div class="panel">
          <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;">
            <div style="font-size:2.4rem;">
              ${business && business.status === 'Approved' ? '✅' : '⏳'}
            </div>
            <div>
              <h3>Current Status: <span style="color:var(--rose);">${business ? business.status : 'Draft'}</span></h3>
              <p style="color:var(--text-muted);font-size:0.9rem;">
                ${
                  business && business.status === 'Approved'
                    ? 'Your business and products are actively published in the public directory and searchable by customers.'
                    : 'Your profile is awaiting review by the platform administrator.'
                }
              </p>
            </div>
          </div>

          ${
            business && business.reviewNote
              ? `
            <div style="background:var(--pink-light);padding:16px;border-radius:var(--radius-sm);margin-bottom:20px;">
              <b>Latest Moderator Feedback:</b>
              <p style="margin-top:4px;color:var(--text-main);">${esc(business.reviewNote)}</p>
            </div>
          `
              : ''
          }

          <div style="display:flex;gap:12px;margin-top:20px;">
            ${
              business && (business.status === 'Draft' || business.status === 'Changes Requested')
                ? `<button class="btn btn-primary" onclick="submitBusinessForAdminReview('${business.id}')">Submit for Admin Review</button>`
                : ''
            }
            <button class="btn btn-outline" onclick="openBusinessDetail('${business ? business.id : ''}')">View Public Profile</button>
          </div>
        </div>
      `;
    }

    // Sidebar navigation items
    const navItems = [
      ['overview', '📊 Dashboard Overview'],
      ['profile', '🏢 My Business Profile'],
      ['add-product', '➕ Add Product (Photo Upload)'],
      ['products', '💍 My Products'],
      ['requests', '🛍️ Customer Requests'],
      ['enquiries', '💬 Customer Inquiries'],
      ['approval-status', '🛡️ Approval Status']
    ];

    return `
      <div class="dashboard-wrapper">
        <aside class="dashboard-sidebar">
          <div class="sidebar-user-block">
            <div class="sidebar-user-name">${esc(session.user.name)}</div>
            <div class="sidebar-user-role">Entrepreneur / Seller</div>
          </div>
          <ul class="sidebar-nav-list">
            ${navItems
              .map(
                (item) => `
              <li class="sidebar-nav-item ${activeTab === item[0] ? 'active' : ''}">
                <button onclick="setSellerTab('${item[0]}')">${item[1]}</button>
              </li>
            `
              )
              .join('')}
          </ul>
          <div class="sidebar-logout">
            <button onclick="handleLogout()">🚪 Logout</button>
          </div>
        </aside>
        <main class="dashboard-main">
          ${mainContentHtml}
        </main>
      </div>
    `;
  }

  // 12. ADMIN DASHBOARD VIEW
  async function renderAdminDashboardView() {
    const session = ANN_DB.getCurrentSession();
    if (!session || session.role !== 'admin') {
      navigateTo('login-admin');
      return '';
    }

    const allBusinesses = ANN_DB.getAllBusinesses();
    const pendingBusinesses = allBusinesses.filter((b) => b.status === 'Pending Review');
    const approvedBusinesses = allBusinesses.filter((b) => b.status === 'Approved');
    const rejectedBusinesses = allBusinesses.filter((b) => b.status === 'Rejected' || b.status === 'Changes Requested');
    const allProducts = ANN_DB.getAllProducts();
    const allRequests = ANN_DB.getAllRequests();
    const allReports = ANN_DB.getAllReports();
    const auditLog = ANN_DB.getAuditLog();

    const activeTab = state.adminActiveTab || 'queue';
    let mainContentHtml = '';

    // A. TAB: VERIFICATION QUEUE (HIGHEST PRIORITY INSPECTION)
    if (activeTab === 'queue') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Admin Console</span>
            <h2>Business Verification Queue (${pendingBusinesses.length})</h2>
            <p style="color:var(--text-muted);">Inspect submitted entrepreneur credentials, stories, and uploaded product photographs.</p>
          </div>
        </div>

        <!-- Metrics -->
        <div class="metrics-row">
          <div class="metric-card">
            <span class="metric-card-label">Pending Reviews</span>
            <span class="metric-card-val" style="color:var(--rose);">${pendingBusinesses.length}</span>
            <span class="metric-card-sub">Awaiting moderation</span>
          </div>
          <div class="metric-card">
            <span class="metric-card-label">Approved Live</span>
            <span class="metric-card-val">${approvedBusinesses.length}</span>
            <span class="metric-card-sub">In public directory</span>
          </div>
          <div class="metric-card">
            <span class="metric-card-label">Total Listings</span>
            <span class="metric-card-val">${allProducts.length}</span>
            <span class="metric-card-sub">Products uploaded</span>
          </div>
          <div class="metric-card">
            <span class="metric-card-label">Customer Requests</span>
            <span class="metric-card-val">${allRequests.length}</span>
            <span class="metric-card-sub">Platform activity</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Pending Submissions</h3>
          </div>
          ${
            pendingBusinesses.length === 0
              ? `
            <div class="empty-state">
              <div class="empty-state-icon">✅</div>
              <h4>All caught up!</h4>
              <p>There are no pending business submissions waiting for verification.</p>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Business & Owner</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Submitted On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingBusinesses.map((b) => `
                    <tr>
                      <td>
                        <b>${esc(b.name)}</b><br>
                        <small style="color:var(--text-muted);">Owner: ${esc(b.ownerName)} &middot; ${esc(b.contactPhone)}</small>
                      </td>
                      <td><span class="badge badge-lavender">${esc(b.category)}</span></td>
                      <td>${esc(b.locality)}, ${esc(b.city)}</td>
                      <td>${b.submittedAt ? new Date(b.submittedAt).toLocaleDateString() : 'Just now'}</td>
                      <td>
                        <button class="btn btn-primary btn-sm" onclick="openAdminBusinessInspection('${b.id}')">
                          Inspect & Approve
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      `;
    }

    // B. TAB: APPROVED BUSINESSES
    else if (activeTab === 'approved') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Directory Management</span>
            <h2>Approved & Live Businesses (${approvedBusinesses.length})</h2>
          </div>
        </div>
        <div class="panel">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Approved Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${approvedBusinesses.map((b) => `
                  <tr>
                    <td><b>${esc(b.name)}</b><br><small style="color:var(--text-muted);">${esc(b.ownerName)}</small></td>
                    <td>${esc(b.category)}</td>
                    <td>${esc(b.city)}</td>
                    <td>${b.reviewedAt ? new Date(b.reviewedAt).toLocaleDateString() : 'Active'}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="openBusinessDetail('${b.id}')">View Profile</button>
                      <button class="btn btn-secondary btn-sm" onclick="adminSuspendBusiness('${b.id}')">Suspend</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // C. TAB: ALL LISTINGS
    else if (activeTab === 'listings') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Content Quality</span>
            <h2>All Products & Listings (${allProducts.length})</h2>
          </div>
        </div>
        <div class="panel">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Business</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${allProducts.map((p) => `
                  <tr>
                    <td><b>${esc(p.name)}</b></td>
                    <td>${esc(p.businessName)}</td>
                    <td>₹${p.price}</td>
                    <td>${esc(p.category)}</td>
                    <td><span class="badge badge-approved">${p.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // D. TAB: REPORTS & COMPLAINTS
    else if (activeTab === 'reports') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Trust & Safety</span>
            <h2>Reports & Complaints (${allReports.length})</h2>
          </div>
        </div>
        <div class="panel">
          ${
            allReports.length === 0
              ? `
            <div class="empty-state">
              <div class="empty-state-icon">🛡️</div>
              <h4>No reports submitted</h4>
              <p>User-reported issues regarding listings or businesses will appear here.</p>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Reported Entity</th>
                    <th>Reason</th>
                    <th>Details</th>
                    <th>Reporter</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${allReports.map((r) => `
                    <tr>
                      <td><b>${esc(r.id)}</b></td>
                      <td>${esc(r.businessName)}</td>
                      <td><b>${esc(r.reason)}</b></td>
                      <td>${esc(r.description)}</td>
                      <td>${esc(r.reporterContact)}</td>
                      <td><span class="badge badge-pending">${r.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      `;
    }

    // E. TAB: LOGO & BRANDING SETTINGS (REQUIREMENT 4)
    else if (activeTab === 'branding') {
      const branding = ANN_DB.getBranding();
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Platform Customization</span>
            <h2>Logo & Branding Settings</h2>
            <p style="color:var(--text-muted);">Upload a custom brand logo from your computer or restore the default silhouette.</p>
          </div>
        </div>

        <div class="panel" style="max-width:680px;">
          <h4 style="margin-bottom:16px;">Active Brand Logo</h4>
          <div style="display:flex;align-items:center;gap:24px;margin-bottom:24px;padding:20px;background:var(--pink-light);border-radius:var(--radius-md);border:1px solid var(--border);">
            <div id="admin-branding-logo-preview" style="width:72px;height:72px;border-radius:14px;background:#fff;border:1px solid var(--border);display:grid;place-items:center;overflow:hidden;">
              ${
                branding.logoDataUrl
                  ? `<img src="${branding.logoDataUrl}" style="width:100%;height:100%;object-fit:cover;" />`
                  : getDefaultLogoSVG(60, 60)
              }
            </div>
            <div>
              <p style="font-weight:600;color:var(--text-heading);">${branding.logoDataUrl ? 'Custom Uploaded Logo Active' : 'Default Side-Silhouette SVG Active'}</p>
              <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Appears on top navbar, splash intro, and footers.</p>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:24px;">
            <label style="font-weight:600;">Upload Replacement Logo Image</label>
            <input type="file" id="admin-logo-upload-input" accept="image/*" class="form-control" onchange="handleAdminLogoFileSelect(event)" />
            <span class="form-help">Select a square PNG, JPG, or WEBP file from your laptop.</span>
          </div>

          <div style="display:flex;gap:12px;">
            <button class="btn btn-primary" onclick="saveAdminBrandingLogo()">Save Logo</button>
            <button class="btn btn-outline" onclick="resetAdminBrandingLogo()">Reset to Default Logo</button>
          </div>
        </div>
      `;
    }

    // F. TAB: AUDIT LOG
    else if (activeTab === 'audit') {
      mainContentHtml = `
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">System Transparency</span>
            <h2>Moderation & Audit History (${auditLog.length})</h2>
          </div>
        </div>
        <div class="panel">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Business</th>
                  <th>Moderator</th>
                  <th>Reason / Notes</th>
                </tr>
              </thead>
              <tbody>
                ${auditLog.map((a) => `
                  <tr>
                    <td>${new Date(a.timestamp).toLocaleString()}</td>
                    <td><span class="badge badge-lavender">${esc(a.action)}</span></td>
                    <td><b>${esc(a.businessName)}</b></td>
                    <td>${esc(a.adminName)}</td>
                    <td>${esc(a.reason)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    const navItems = [
      ['queue', `🔍 Verification Queue (${pendingBusinesses.length})`],
      ['approved', `🏢 Approved Businesses (${approvedBusinesses.length})`],
      ['listings', `📦 Manage Listings (${allProducts.length})`],
      ['reports', `🛡️ Reports & Complaints (${allReports.length})`],
      ['branding', '🎨 Logo & Branding Settings'],
      ['audit', '📜 Moderation Audit Trail']
    ];

    return `
      <div class="dashboard-wrapper">
        <aside class="dashboard-sidebar">
          <div class="sidebar-user-block">
            <div class="sidebar-user-name">${esc(session.user.name)}</div>
            <div class="sidebar-user-role">Platform Administrator</div>
          </div>
          <ul class="sidebar-nav-list">
            ${navItems
              .map(
                (item) => `
              <li class="sidebar-nav-item ${activeTab === item[0] ? 'active' : ''}">
                <button onclick="setAdminTab('${item[0]}')">${item[1]}</button>
              </li>
            `
              )
              .join('')}
          </ul>
          <div class="sidebar-logout">
            <button onclick="handleLogout()">🚪 Logout</button>
          </div>
        </aside>
        <main class="dashboard-main">
          ${mainContentHtml}
        </main>
      </div>
    `;
  }

  // 13. CUSTOMER DASHBOARD VIEW
  async function renderCustomerDashboardView() {
    const session = ANN_DB.getCurrentSession();
    if (!session || session.role !== 'customer') {
      navigateTo('login-customer');
      return '';
    }

    const lastContact = localStorage.getItem('ann_last_customer_contact') || '';
    const searchKey = session.user.email || session.user.phone || session.user.name || lastContact;
    const requests = ANN_DB.getRequestsForCustomer(searchKey);
    const enquiries = ANN_DB.getEnquiriesForCustomer(searchKey);

    return `
      <div class="container" style="padding:48px 0 60px;">
        <div class="dashboard-top-bar">
          <div>
            <span class="eyebrow">Customer Workspace</span>
            <h2>Welcome, ${esc(session.user.name)}</h2>
            <p style="color:var(--text-muted);">Track your purchase requests and direct communication with home entrepreneurs.</p>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-primary" onclick="navigateTo('directory')">Explore Businesses</button>
            <button class="btn btn-outline" onclick="handleLogout()">Logout</button>
          </div>
        </div>

        <!-- Purchase Requests Table -->
        <div class="panel">
          <div class="panel-header">
            <h3>My Purchase Requests (${requests.length})</h3>
            <span class="badge badge-lavender">Direct Coordination</span>
          </div>

          ${
            requests.length === 0
              ? `
            <div class="empty-state">
              <div class="empty-state-icon">🛍️</div>
              <h4>No purchase requests yet</h4>
              <p>Explore handcrafted jewelry and home products in our directory and click "Request to Purchase".</p>
              <button class="btn btn-primary btn-sm" style="margin-top:14px;" onclick="navigateTo('products')">Browse Products</button>
            </div>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Product</th>
                    <th>Business</th>
                    <th>Qty / Est. Total</th>
                    <th>Status</th>
                    <th>Seller Response / Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${requests.map((r) => `
                    <tr>
                      <td><b>${esc(r.id)}</b><br><small style="color:var(--text-muted);">${new Date(r.createdAt).toLocaleDateString()}</small></td>
                      <td><b>${esc(r.productName)}</b></td>
                      <td>${esc(r.businessName)}</td>
                      <td>${r.quantity} pcs &middot; <b>₹${r.estimatedTotal}</b></td>
                      <td>
                        <span class="badge ${r.status === 'Accepted' ? 'badge-approved' : r.status === 'New Request' ? 'badge-pending' : r.status === 'Declined' ? 'badge-rejected' : 'badge-lavender'}">
                          ${r.status}
                        </span>
                      </td>
                      <td>
                        ${r.sellerNote ? `<span style="color:var(--rose-dark);font-weight:600;">"${esc(r.sellerNote)}"</span>` : '<span style="color:var(--text-muted);">Awaiting response</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>

        <!-- Enquiries Table -->
        <div class="panel">
          <div class="panel-header">
            <h3>My Inquiries (${enquiries.length})</h3>
          </div>
          ${
            enquiries.length === 0
              ? `
            <p style="color:var(--text-muted);font-size:0.9rem;">You haven't sent any general questions to businesses yet.</p>
          `
              : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Business & Product</th>
                    <th>Your Question / Message</th>
                    <th>Status</th>
                    <th>Seller Response</th>
                  </tr>
                </thead>
                <tbody>
                  ${enquiries.map((e) => `
                    <tr>
                      <td>${new Date(e.createdAt).toLocaleDateString()}</td>
                      <td>
                        <b>${esc(e.businessName)}</b>
                        ${e.productName ? `<br><small style="color:var(--rose);font-weight:600;">Re: ${esc(e.productName)}</small>` : ''}
                      </td>
                      <td>${esc(e.message)}</td>
                      <td><span class="badge ${e.status === 'Responded' ? 'badge-approved' : 'badge-lavender'}">${e.status}</span></td>
                      <td>
                        ${e.sellerReply ? `
                          <div style="background:var(--pink-light);padding:8px 12px;border-radius:6px;border-left:3px solid var(--rose);font-size:0.85rem;color:var(--text-heading);">
                            <b>Seller:</b> "${esc(e.sellerReply)}"
                          </div>
                        ` : '<small style="color:var(--text-muted);">Awaiting response from entrepreneur</small>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  // 14. LEARNING HUB VIEW
  function renderLearningView() {
    const categories = [
      {
        title: 'Starting a Home Business',
        icon: '📝',
        summary: 'Essential fundamentals for first-time women entrepreneurs setting up home-based ventures.',
        guides: [
          'Structuring your home enterprise from your living space',
          'Basic bookkeeping & maintaining simple order logs',
          'Setting realistic batch schedules around family commitments'
        ]
      },
      {
        title: 'Product Photography with Your Phone',
        icon: '📸',
        summary: 'How to capture clean, sharp, daylight photographs of jewelry, apparel, and craft creations.',
        guides: [
          'Using morning window light for jewelry highlights without harsh glare',
          'Selecting neutral, uncluttered textured backgrounds (linen & slate)',
          'Close-up macro angles to showcase intricate stone work and textures'
        ]
      },
      {
        title: 'Digital Marketing & Social Discovery',
        icon: '📱',
        summary: 'Authentic ways to share your craftsmanship and reach customers who cherish handcrafted work.',
        guides: [
          'Crafting heartfelt behind-the-scenes stories on WhatsApp and Instagram',
          'Engaging your local neighborhood and resident welfare groups',
          'Building repeating customer relationships through word of mouth'
        ]
      },
      {
        title: 'Pricing & Financial Literacy',
        icon: '💰',
        summary: 'How to calculate your material costs, value your skilled labor, and set healthy margins.',
        guides: [
          'Formulating price = raw materials + skilled artisan hours + packing',
          'Avoiding underpricing your hand-intensive handmade pieces',
          'Managing cash flow and re-investing profits into raw materials'
        ]
      },
      {
        title: 'Customer Communication & Trust',
        icon: '🤝',
        summary: 'Polite, clear, professional communication that builds trust and recurring orders.',
        guides: [
          'Setting clear delivery timelines and dispatch expectations upfront',
          'Sharing transparent product dimensions and care instructions',
          'Handling customer feedback and customizations gracefully'
        ]
      },
      {
        title: 'Growing a Small Enterprise',
        icon: '🌱',
        summary: 'Pathways to expand beyond personal circles into structured, sustainable micro-enterprises.',
        guides: [
          'Collaborating with other women artisans for festive gift hampers',
          'Participating in curated local exhibitions and artisan flea markets',
          'Understanding local municipal trade guidelines and simple registrations'
        ]
      }
    ];

    return `
      <div class="container" style="padding:48px 0 70px;">
        <div style="margin-bottom:40px;text-align:center;max-width:720px;margin-inline:auto;">
          <span class="eyebrow">Knowledge Center</span>
          <h1>Entrepreneur Learning Hub</h1>
          <p class="lead-text" style="margin:12px auto 0;">
            Curated, practical guides designed to support first-time women entrepreneurs in building credible, thriving home businesses.
          </p>
        </div>

        <div class="category-grid" style="grid-template-columns:repeat(3,1fr);gap:24px;">
          ${categories.map((c) => `
            <div class="panel" style="padding:28px;display:flex;flex-direction:column;">
              <div style="font-size:2.2rem;margin-bottom:14px;">${c.icon}</div>
              <h3 style="font-size:1.25rem;margin-bottom:8px;">${esc(c.title)}</h3>
              <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:18px;line-height:1.5;">${esc(c.summary)}</p>
              <ul style="list-style:disc;padding-left:18px;font-size:0.825rem;color:var(--text-main);display:flex;flex-direction:column;gap:8px;margin-top:auto;">
                ${c.guides.map((g) => `<li>${esc(g)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>

        <div style="background:var(--pink-light);border:1px solid var(--border);border-radius:var(--radius-md);padding:24px;margin-top:40px;text-align:center;">
          <p style="font-size:0.875rem;color:var(--text-muted);">
            <b>Educational Note:</b> These resources are provided for self-guided learning. Aatmanirbhar Nari does not claim official government endorsement or guaranteed business outcomes.
          </p>
        </div>
      </div>
    `;
  }

  // 15. ABOUT VIEW
  function renderAboutView() {
    return `
      <div class="container" style="padding:48px 0 70px;max-width:860px;">
        <span class="eyebrow">Our Mission</span>
        <h1>About Aatmanirbhar Nari</h1>
        <p class="lead-text" style="margin-top:12px;">
          A home business enablement platform empowering women creators, tailors, bakers, and artisans with structured visibility, customer discovery, and direct connection.
        </p>

        <div class="panel" style="margin-top:36px;padding:36px;line-height:1.8;">
          <h3 style="margin-bottom:12px;">Problem Context</h3>
          <p style="margin-bottom:20px;color:var(--text-main);">
            Millions of women across India operate skilled home businesses—creating heirloom jewelry, bespoke apparel, authentic regional foods, and handcrafted decor. However, their visibility is frequently fragmented across informal messaging chats and social posts where price discovery, location verification, and trust remain challenging.
          </p>

          <h3 style="margin-bottom:12px;">Our Approach</h3>
          <p style="margin-bottom:20px;color:var(--text-main);">
            Aatmanirbhar Nari bridges this gap through a verified directory where entrepreneurs present their authentic identity, upload genuine product photographs, specify local service areas, and receive direct purchase requests without intermediaries taking hefty commissions.
          </p>

          <h3 style="margin-bottom:12px;">Demonstration Scope & Boundaries</h3>
          <p style="color:var(--text-muted);font-size:0.9rem;">
            This prototype demonstrates the complete end-to-end user experience, including seller registration, native photo upload from laptops, administrative review, and customer purchase request coordination. Payments, courier fulfillment settlements, and legal statutory verifications are handled outside this frontend prototype.
          </p>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MAIN ROUTE DISPATCHER
  // =========================================================================
  async function renderApp() {
    const root = document.getElementById('root');
    if (!root) return;

    const navHtml = await renderNavbar();
    let bodyHtml = '';

    switch (state.currentRoute) {
      case 'home':
        bodyHtml = await renderHomeView();
        break;
      case 'directory':
        bodyHtml = await renderDirectoryView();
        break;
      case 'products':
        bodyHtml = await renderProductsView();
        break;
      case 'business-detail':
        bodyHtml = await renderBusinessDetailView(state.routeParam);
        break;
      case 'learning':
        bodyHtml = renderLearningView();
        break;
      case 'about':
        bodyHtml = renderAboutView();
        break;
      case 'login-portal':
        bodyHtml = renderLoginPortalView();
        break;
      case 'login-seller':
        bodyHtml = renderSellerLoginView();
        break;
      case 'login-customer':
        bodyHtml = renderCustomerLoginView();
        break;
      case 'login-admin':
        bodyHtml = renderAdminLoginView();
        break;
      case 'register-seller':
        bodyHtml = renderSellerRegisterView();
        break;
      case 'register-customer':
        bodyHtml = renderCustomerRegisterView();
        break;
      case 'seller-dashboard':
        bodyHtml = await renderSellerDashboardView();
        break;
      case 'admin-dashboard':
        bodyHtml = await renderAdminDashboardView();
        break;
      case 'customer-dashboard':
        bodyHtml = await renderCustomerDashboardView();
        break;
      default:
        bodyHtml = await renderHomeView();
        break;
    }

    const footerHtml = renderFooter();

    root.innerHTML = `
      ${navHtml}
      <main id="app-body">${bodyHtml}</main>
      ${footerHtml}
    `;

    // Re-bind preview images if currently on add-product tab
    if (state.currentRoute === 'seller-dashboard' && state.sellerActiveTab === 'add-product') {
      renderUploadedProductImagesGrid();
    }
  }

  // =========================================================================
  // AUTHENTICATION HANDLERS
  // =========================================================================

  window.handleSellerLogin = function (e) {
    e.preventDefault();
    const ident = document.getElementById('seller-ident').value;
    const pass = document.getElementById('seller-pass').value;
    const res = ANN_DB.login('entrepreneur', ident, pass);
    if (res.success) {
      showToast('Welcome back, ' + res.user.name + '!');
      navigateTo('seller-dashboard');
    } else {
      alert(res.message);
    }
  };

  window.handleCustomerLogin = function (e) {
    e.preventDefault();
    const ident = document.getElementById('cust-ident').value;
    const pass = document.getElementById('cust-pass').value;
    const res = ANN_DB.login('customer', ident, pass);
    if (res.success) {
      showToast('Welcome, ' + res.user.name + '!');
      navigateTo('customer-dashboard');
    } else {
      alert(res.message);
    }
  };

  window.handleAdminLogin = function (e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;
    const res = ANN_DB.login('admin', email, pass);
    if (res.success) {
      showToast('Administrator session verified');
      navigateTo('admin-dashboard');
    } else {
      alert(res.message);
    }
  };

  window.handleLogout = function () {
    ANN_DB.clearSession();
    showToast('Logged out successfully');
    navigateTo('login-portal');
  };

  // Quick Demo Fill Helpers
  window.fillSellerDemoCredentials = function () {
    document.getElementById('seller-ident').value = 'meera@sakhi.in';
    document.getElementById('seller-pass').value = 'seller123';
  };

  window.fillCustomerDemoCredentials = function () {
    document.getElementById('cust-ident').value = 'anita@example.com';
    document.getElementById('cust-pass').value = 'customer123';
  };

  // Quick-fill Akshaya Reddy Credentials
  window.fillAkshayaDemoCredentials = function () {
    const identEl = document.getElementById('seller-ident');
    const passEl = document.getElementById('seller-pass');
    if (identEl) identEl.value = 'pattiakshayareddy03@gmail.com';
    if (passEl) passEl.value = 'password123';
    showToast('Credentials filled: pattiakshayareddy03@gmail.com');
  };

  // Pre-fill Akshaya Reddy's Jewelry Business Registration
  window.fillAkshayaJewelryRegistration = function () {
    document.getElementById('reg-fullname').value = 'Akshaya Reddy';
    document.getElementById('reg-email').value = 'pattiakshayareddy03@gmail.com';
    document.getElementById('reg-phone').value = '+91 98765 12345';
    document.getElementById('reg-pass').value = 'password123';
    document.getElementById('reg-bizname').value = 'Akshaya Handcrafted Jewels & Studio';
    document.getElementById('reg-category').value = 'Jewelry & Accessories';
    document.getElementById('reg-desc').value =
      'Specializing in royal Kundan choker sets, bespoke pearl earrings, and festive Indian bridal jewelry handcrafted with love in Hyderabad.';
    document.getElementById('reg-state').value = 'Telangana';
    document.getElementById('reg-city').value = 'Hyderabad';
    document.getElementById('reg-locality').value = 'Banjara Hills';
    document.getElementById('reg-pincode').value = '500034';
    document.getElementById('reg-service-area').value = 'Hyderabad local courier and Pan-India express delivery';
    document.getElementById('reg-address').value = 'Plot 18, Road No. 12, Banjara Hills, Hyderabad';
    showToast('Akshaya Reddy registration details populated!');
  };

  // Auto-fill Product Form with Realistic Jewelry Details
  window.fillSampleJewelryProductFields = function () {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal('prod-name', 'Handcrafted Royal Kundan Choker & Earrings Set');
    setVal('prod-category', 'Jewelry & Accessories');
    setVal('prod-price', '2450');
    setVal('prod-discount', '2999');
    setVal('prod-qty', '6');
    setVal('prod-description', 'Exquisite bridal and festive jewelry set handcrafted with lustrous freshwater pearls and fine Kundan stones on 22K gold matte brass. Hypoallergenic and lightweight for long celebration wear.');
    setVal('prod-material', 'Brass base, 22K matte gold plating, natural freshwater pearls & kundan stones');
    setVal('prod-color', 'Antique Gold & Cream Pearl');
    setVal('prod-size', '14-inch choker with adjustable silk dori + matching 2.2-inch drop earrings');
    setVal('prod-condition', 'Handcrafted New');
    setVal('prod-availability', 'In Stock');
    showToast('✨ Jewelry product details auto-filled (₹2,450)!');
  };

  window.fillAdminDemoCredentials = function () {
    document.getElementById('admin-email').value = 'admin@aatmanirbharnari.in';
    document.getElementById('admin-pass').value = 'admin123';
  };

  // Pre-fill Sample Jewelry Business for Evaluator Testing
  window.fillSampleJewelryRegistration = function () {
    document.getElementById('reg-fullname').value = 'Radha Verma';
    document.getElementById('reg-email').value = 'radha@vermajewels.in';
    document.getElementById('reg-phone').value = '+91 99887 76655';
    document.getElementById('reg-pass').value = 'radha123';
    document.getElementById('reg-bizname').value = 'Radha Handcrafted Jewels & Earrings';
    document.getElementById('reg-category').value = 'Jewelry & Accessories';
    document.getElementById('reg-desc').value =
      'Boutique jewelry maker handcrafting traditional and contemporary earrings, kundan drops, and festive pearl necklaces from my Hyderabad home studio.';
    document.getElementById('reg-state').value = 'Telangana';
    document.getElementById('reg-city').value = 'Hyderabad';
    document.getElementById('reg-locality').value = 'Madhapur';
    document.getElementById('reg-pincode').value = '500081';
    document.getElementById('reg-service-area').value = 'Hyderabad local courier and Pan-India speed post';
    document.getElementById('reg-address').value = 'Flat 204, Green Meadows, Madhapur, Hyderabad';
    showToast('Sample jewelry details populated');
  };

  window.handleSellerRegCoverSelect = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      state.regCoverDataUrl = evt.target.result;
      const preview = document.getElementById('reg-cover-preview');
      if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = `<img src="${state.regCoverDataUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
      }
      showToast('Cover photo attached to registration!');
    };
    reader.readAsDataURL(file);
  };

  window.handleSellerRegisterSubmit = function (e) {
    e.preventDefault();
    const data = {
      fullName: document.getElementById('reg-fullname').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      password: document.getElementById('reg-pass').value,
      businessName: document.getElementById('reg-bizname').value,
      category: document.getElementById('reg-category').value,
      description: document.getElementById('reg-desc').value,
      state: document.getElementById('reg-state').value,
      city: document.getElementById('reg-city').value,
      locality: document.getElementById('reg-locality').value,
      pincode: document.getElementById('reg-pincode').value,
      serviceArea: document.getElementById('reg-service-area').value,
      fullAddress: document.getElementById('reg-address').value,
      coverDataUrl: state.regCoverDataUrl || null,
      isDraft: false
    };

    const res = ANN_DB.registerSeller(data);
    if (res.success) {
      state.regCoverDataUrl = null;
      showToast('Business registered and submitted for review!');
      state.sellerActiveTab = 'overview';
      navigateTo('seller-dashboard');
    } else {
      alert(res.message);
    }
  };

  window.saveSellerRegistrationDraft = function () {
    const data = {
      fullName: document.getElementById('reg-fullname').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      password: document.getElementById('reg-pass').value,
      businessName: document.getElementById('reg-bizname').value,
      category: document.getElementById('reg-category').value,
      description: document.getElementById('reg-desc').value,
      state: document.getElementById('reg-state').value,
      city: document.getElementById('reg-city').value,
      locality: document.getElementById('reg-locality').value,
      pincode: document.getElementById('reg-pincode').value,
      serviceArea: document.getElementById('reg-service-area').value,
      fullAddress: document.getElementById('reg-address').value,
      isDraft: true
    };
    localStorage.setItem('ann_seller_reg_draft', JSON.stringify(data));
    showToast('Registration draft saved locally. You can resume anytime.');
  };

  window.handleCustomerRegisterSubmit = function (e) {
    e.preventDefault();
    const data = {
      fullName: document.getElementById('cust-reg-name').value,
      email: document.getElementById('cust-reg-email').value,
      phone: document.getElementById('cust-reg-phone').value,
      city: document.getElementById('cust-reg-city').value,
      password: document.getElementById('cust-reg-pass').value
    };
    const res = ANN_DB.registerCustomer(data);
    if (res.success) {
      showToast('Account created successfully!');
      navigateTo('customer-dashboard');
    } else {
      alert(res.message);
    }
  };

  // =========================================================================
  // REAL PRODUCT IMAGE UPLOAD ENGINE (REQUIREMENT 8)
  // =========================================================================

  window.triggerNativeProductFilePicker = function () {
    const input = document.getElementById('product-native-file-picker');
    if (input) input.click();
  };

  window.handleProductDragOver = function (e) {
    e.preventDefault();
    const dropzone = document.getElementById('product-upload-dropzone');
    if (dropzone) dropzone.classList.add('dragover');
  };

  window.handleProductDragLeave = function (e) {
    e.preventDefault();
    const dropzone = document.getElementById('product-upload-dropzone');
    if (dropzone) dropzone.classList.remove('dragover');
  };

  window.handleProductFileDrop = function (e) {
    e.preventDefault();
    const dropzone = document.getElementById('product-upload-dropzone');
    if (dropzone) dropzone.classList.remove('dragover');

    if (e.dataTransfer && e.dataTransfer.files) {
      processSelectedImageFiles(Array.from(e.dataTransfer.files));
    }
  };

  window.handleNativeProductImageSelect = function (e) {
    if (e.target && e.target.files) {
      processSelectedImageFiles(Array.from(e.target.files));
    }
  };

  async function processSelectedImageFiles(files) {
    const validFiles = files.filter((f) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(f.type);
      const isValidSize = f.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) showToast(`Skipped ${f.name}: only JPG, PNG, and WEBP supported`, 'error');
      if (!isValidSize) showToast(`Skipped ${f.name}: file exceeds 10MB limit`, 'error');
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = async function (evt) {
          const dataUrl = evt.target.result;
          const imgId = 'img-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          await ANN_DB.saveImage(imgId, dataUrl, {
            name: file.name,
            size: file.size,
            type: file.type
          });
          state.uploadedProductImages.push({
            id: imgId,
            dataUrl,
            name: file.name
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    renderUploadedProductImagesGrid();
    const nameEl = document.getElementById('prod-name');
    if (nameEl && !nameEl.value.trim()) {
      fillSampleJewelryProductFields();
      showToast('✨ Photo loaded from laptop & jewelry details auto-filled! You can adjust name or price before saving.');
    } else {
      showToast(`Loaded ${validFiles.length} photo(s) from your laptop`);
    }
  }

  let imageIndexToReplace = null;

  window.replaceUploadedImage = function (index) {
    imageIndexToReplace = index;
    let input = document.getElementById('product-replace-file-picker');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'product-replace-file-picker';
      input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
      input.style.display = 'none';
      input.onchange = handleProductImageReplace;
      document.body.appendChild(input);
    }
    input.value = '';
    input.click();
  };

  async function handleProductImageReplace(e) {
    if (e.target && e.target.files && e.target.files[0] && imageIndexToReplace !== null) {
      const file = e.target.files[0];
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type);
      if (!isValidType) {
        showToast('Invalid image type. Please select JPG, PNG, or WEBP.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async function (evt) {
        const dataUrl = evt.target.result;
        const imgId = 'img-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        await ANN_DB.saveImage(imgId, dataUrl, {
          name: file.name,
          size: file.size,
          type: file.type
        });
        state.uploadedProductImages[imageIndexToReplace] = {
          id: imgId,
          dataUrl,
          name: file.name
        };
        imageIndexToReplace = null;
        renderUploadedProductImagesGrid();
        showToast('Photo replaced successfully');
      };
      reader.readAsDataURL(file);
    }
  }

  function renderUploadedProductImagesGrid() {
    const grid = document.getElementById('product-images-preview-grid');
    if (!grid) return;

    grid.innerHTML = state.uploadedProductImages
      .map(
        (img, idx) => `
      <div class="image-preview-card">
        ${idx === 0 ? '<span class="image-preview-badge">Primary Cover</span>' : ''}
        <img src="${img.dataUrl}" alt="${esc(img.name)}" />
        <div class="image-preview-actions">
          ${idx !== 0 ? `<button type="button" onclick="makeImagePrimary(${idx})" title="Set as Primary">⭐</button>` : ''}
          <button type="button" onclick="replaceUploadedImage(${idx})" title="Replace this Photo">🔄</button>
          <button type="button" onclick="removeUploadedImage(${idx})" title="Remove Photo">🗑️</button>
        </div>
      </div>
    `
      )
      .join('');
  }

  window.makeImagePrimary = function (index) {
    if (index > 0 && index < state.uploadedProductImages.length) {
      const item = state.uploadedProductImages.splice(index, 1)[0];
      state.uploadedProductImages.unshift(item);
      renderUploadedProductImagesGrid();
      showToast('Primary photo updated');
    }
  };

  window.removeUploadedImage = function (index) {
    if (index >= 0 && index < state.uploadedProductImages.length) {
      const removed = state.uploadedProductImages.splice(index, 1)[0];
      ANN_DB.deleteImage(removed.id);
      renderUploadedProductImagesGrid();
      showToast('Photo removed');
    }
  };

  window.handleProductSaveSubmit = function (e) {
    e.preventDefault();
    const session = ANN_DB.getCurrentSession();
    if (!session) return;
    const business = ANN_DB.getBusinessByOwnerId(session.user.id);
    if (!business) {
      alert('Please complete your business profile registration first.');
      return;
    }

    if (state.uploadedProductImages.length === 0) {
      alert('Please upload at least one photograph of your product from your computer.');
      return;
    }

    const imageIds = state.uploadedProductImages.map((img) => img.id);

    const productData = {
      id: state.editingProductId || undefined,
      businessId: business.id,
      businessName: business.name,
      name: document.getElementById('prod-name').value.trim(),
      category: document.getElementById('prod-category').value,
      price: Number(document.getElementById('prod-price').value),
      discountPrice: document.getElementById('prod-discount').value ? Number(document.getElementById('prod-discount').value) : null,
      quantity: Number(document.getElementById('prod-qty').value) || 1,
      description: document.getElementById('prod-description').value.trim(),
      material: document.getElementById('prod-material').value.trim(),
      color: document.getElementById('prod-color').value.trim(),
      size: document.getElementById('prod-size').value.trim(),
      condition: document.getElementById('prod-condition').value,
      availability: document.getElementById('prod-availability').value,
      city: document.getElementById('prod-city').value.trim(),
      locality: document.getElementById('prod-locality').value.trim(),
      pincode: document.getElementById('prod-pin').value.trim(),
      deliveryNotes: document.getElementById('prod-delivery-notes').value.trim(),
      imageIds
    };

    ANN_DB.saveProduct(productData);
    state.uploadedProductImages = [];
    state.editingProductId = null;
    showToast('Product saved successfully and added to your catalog!');
    setSellerTab('products');
  };

  window.editProduct = async function (productId) {
    const prod = ANN_DB.getProductById(productId);
    if (!prod) return;

    state.editingProductId = prod.id;
    state.uploadedProductImages = [];

    if (prod.imageIds) {
      for (const id of prod.imageIds) {
        const url = await ANN_DB.getImage(id);
        if (url) {
          state.uploadedProductImages.push({ id, dataUrl: url, name: 'product.jpg' });
        }
      }
    }

    setSellerTab('add-product');

    setTimeout(() => {
      document.getElementById('prod-name').value = prod.name;
      document.getElementById('prod-category').value = prod.category;
      document.getElementById('prod-price').value = prod.price;
      if (prod.discountPrice) document.getElementById('prod-discount').value = prod.discountPrice;
      document.getElementById('prod-qty').value = prod.quantity || 10;
      document.getElementById('prod-description').value = prod.description;
      if (prod.material) document.getElementById('prod-material').value = prod.material;
      if (prod.color) document.getElementById('prod-color').value = prod.color;
      if (prod.size) document.getElementById('prod-size').value = prod.size;
      if (prod.condition) document.getElementById('prod-condition').value = prod.condition;
      if (prod.availability) document.getElementById('prod-availability').value = prod.availability;
      renderUploadedProductImagesGrid();
    }, 50);
  };

  window.confirmDeleteProduct = function (productId) {
    if (confirm('Are you sure you want to delete this product listing? This action cannot be undone.')) {
      ANN_DB.deleteProduct(productId);
      showToast('Product deleted from catalog');
      renderApp();
    }
  };

  window.submitBusinessForAdminReview = function (businessId) {
    const res = ANN_DB.submitBusinessForReview(businessId);
    if (res.success) {
      showToast('Business submitted for admin review!');
      renderApp();
    }
  };

  // =========================================================================
  // ADMIN INSPECTION & APPROVAL WORKFLOW (REQUIREMENT 11)
  // =========================================================================

  window.openAdminBusinessInspection = async function (businessId) {
    const biz = ANN_DB.getBusinessById(businessId);
    if (!biz) return;

    const products = ANN_DB.getProductsByBusinessId(businessId);

    let productsInspectionHtml = '';
    for (const prod of products) {
      let imgUrl = null;
      if (prod.imageIds && prod.imageIds.length > 0) {
        imgUrl = await ANN_DB.getImage(prod.imageIds[0]);
      }
      productsInspectionHtml += `
        <div style="display:flex;gap:14px;align-items:center;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;background:#fff;">
          <img src="${imgUrl || ''}" alt="" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:1px solid var(--border);" />
          <div style="flex:1;">
            <b>${esc(prod.name)}</b><br>
            <span style="font-size:0.85rem;color:var(--text-muted);">${esc(prod.category)} &middot; ₹${prod.price}</span>
            <p style="font-size:0.8rem;color:var(--text-main);margin-top:2px;">${esc(prod.description)}</p>
          </div>
        </div>
      `;
    }

    const modalHtml = `
      <div class="modal-overlay active" id="admin-inspect-modal" onclick="closeAdminModal(event)">
        <div class="modal-dialog modal-dialog-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Inspect Business Submission</h3>
            <button class="modal-close-btn" onclick="closeModalDirect('admin-inspect-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:24px;margin-bottom:24px;">
              <div>
                <span class="badge badge-pending" style="margin-bottom:8px;">Pending Verification</span>
                <h2 style="font-size:1.6rem;margin-bottom:4px;">${esc(biz.name)}</h2>
                <p style="color:var(--text-muted);">Owner: <b>${esc(biz.ownerName)}</b> &middot; ${esc(biz.category)}</p>
                <div style="margin-top:14px;">
                  <b>Business Description & Story:</b>
                  <p style="margin-top:4px;color:var(--text-main);line-height:1.6;">${esc(biz.desc)}</p>
                </div>
              </div>
              <div style="background:var(--pink-light);padding:18px;border-radius:var(--radius-md);border:1px solid var(--border);font-size:0.85rem;">
                <h4 style="margin-bottom:10px;font-size:0.95rem;">Contact & Verification Details</h4>
                <p style="margin-bottom:6px;"><b>Phone:</b> ${esc(biz.contactPhone)}</p>
                <p style="margin-bottom:6px;"><b>Email:</b> ${esc(biz.contactEmail)}</p>
                <p style="margin-bottom:6px;"><b>Address:</b> ${esc(biz.fullAddress)}</p>
                <p style="margin-bottom:6px;"><b>City:</b> ${esc(biz.city)} (${esc(biz.pincode)})</p>
                <p><b>Service Area:</b> ${esc(biz.serviceArea)}</p>
              </div>
            </div>

            <h4 style="margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border);">
              Uploaded Product Offerings & Photographs (${products.length})
            </h4>
            ${
              products.length === 0
                ? '<p style="color:var(--text-muted);font-size:0.85rem;">No products uploaded yet by this seller.</p>'
                : productsInspectionHtml
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="adminPromptReject('${biz.id}')">Reject</button>
            <button class="btn btn-secondary" onclick="adminPromptRequestChanges('${biz.id}')">Request Changes</button>
            <button class="btn btn-primary" onclick="adminApproveBusinessDirect('${biz.id}')">Approve & Publish to Directory</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-root').innerHTML = modalHtml;
  }

  window.adminApproveBusinessDirect = function (businessId) {
    if (confirm('Approve this business? It will immediately become visible to customers in the public directory.')) {
      ANN_DB.reviewBusiness(businessId, 'Approved', 'Business credentials and product photographs verified.');
      closeModalDirect('admin-inspect-modal');
      showToast('Business Approved & Published to Directory!');
      renderApp();
    }
  };

  window.adminPromptRequestChanges = function (businessId) {
    const reason = prompt('Enter modifications requested for this business:');
    if (reason && reason.trim()) {
      ANN_DB.reviewBusiness(businessId, 'Changes Requested', reason.trim());
      closeModalDirect('admin-inspect-modal');
      showToast('Changes requested. Seller notified.');
      renderApp();
    }
  };

  window.adminPromptReject = function (businessId) {
    const reason = prompt('Enter rejection reason:');
    if (reason && reason.trim()) {
      ANN_DB.reviewBusiness(businessId, 'Rejected', reason.trim());
      closeModalDirect('admin-inspect-modal');
      showToast('Business rejected.');
      renderApp();
    }
  };

  window.adminSuspendBusiness = function (businessId) {
    if (confirm('Suspend this business listing from the public directory?')) {
      ANN_DB.reviewBusiness(businessId, 'Suspended', 'Suspended by admin moderation.');
      showToast('Business suspended.');
      renderApp();
    }
  };

  // =========================================================================
  // BRANDING SETTINGS (ADMIN LOGO REPLACEMENT)
  // =========================================================================

  let tempAdminLogoDataUrl = null;

  window.handleAdminLogoFileSelect = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      tempAdminLogoDataUrl = evt.target.result;
      const preview = document.getElementById('admin-branding-logo-preview');
      if (preview) {
        preview.innerHTML = `<img src="${tempAdminLogoDataUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
      }
      showToast('Logo preview updated. Click "Save Logo" to apply site-wide.');
    };
    reader.readAsDataURL(file);
  };

  window.saveAdminBrandingLogo = function () {
    if (!tempAdminLogoDataUrl) {
      alert('Please choose an image file to upload as the new logo.');
      return;
    }
    ANN_DB.saveBranding({ logoDataUrl: tempAdminLogoDataUrl });
    showToast('Platform logo updated across all pages!');
    renderApp();
  };

  window.resetAdminBrandingLogo = function () {
    if (confirm('Reset platform logo to the default side-profile silhouette?')) {
      ANN_DB.resetBranding();
      tempAdminLogoDataUrl = null;
      showToast('Default brand logo restored.');
      renderApp();
    }
  };

  // =========================================================================
  // CUSTOMER PURCHASE REQUEST FLOW (REQUIREMENT 13)
  // =========================================================================

  window.openProductDetail = async function (productId) {
    const prod = ANN_DB.getProductById(productId);
    if (!prod) return;

    const biz = ANN_DB.getBusinessById(prod.businessId);

    let galleryImgs = [];
    if (prod.imageIds) {
      for (const id of prod.imageIds) {
        const url = await ANN_DB.getImage(id);
        if (url) galleryImgs.push(url);
      }
    }
    const mainImg = galleryImgs[0] || '';

    const modalHtml = `
      <div class="modal-overlay active" id="product-detail-modal" onclick="closeModalDirect('product-detail-modal')">
        <div class="modal-dialog modal-dialog-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <span class="badge badge-pending">${esc(prod.category)}</span>
            <button class="modal-close-btn" onclick="closeModalDirect('product-detail-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:28px;">
              <div>
                <img id="detail-main-img" src="${mainImg}" alt="" style="width:100%;height:320px;border-radius:var(--radius-md);object-fit:cover;border:1px solid var(--border);margin-bottom:12px;" />
                ${
                  galleryImgs.length > 1
                    ? `
                  <div style="display:flex;gap:10px;">
                    ${galleryImgs.map((url) => `
                      <img src="${url}" onclick="document.getElementById('detail-main-img').src='${url}'" style="width:60px;height:60px;border-radius:6px;object-fit:cover;cursor:pointer;border:1px solid var(--border);" />
                    `).join('')}
                  </div>
                `
                    : ''
                }
              </div>
              <div style="display:flex;flex-direction:column;">
                <h2 style="font-size:1.6rem;margin-bottom:8px;">${esc(prod.name)}</h2>
                <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:16px;">
                  <span style="font-size:1.8rem;font-weight:700;color:var(--text-heading);">₹${prod.price}</span>
                  ${prod.discountPrice ? `<span style="text-decoration:line-through;color:var(--text-muted);">₹${prod.discountPrice}</span>` : ''}
                </div>

                <p style="color:var(--text-main);font-size:0.95rem;line-height:1.6;margin-bottom:18px;">
                  ${esc(prod.description)}
                </p>

                <div style="background:var(--pink-light);padding:14px;border-radius:var(--radius-sm);font-size:0.85rem;margin-bottom:20px;display:flex;flex-direction:column;gap:6px;">
                  <div><b>Craft Condition:</b> ${esc(prod.condition || 'Handcrafted')}</div>
                  ${prod.material ? `<div><b>Materials:</b> ${esc(prod.material)}</div>` : ''}
                  ${prod.color ? `<div><b>Colour:</b> ${esc(prod.color)}</div>` : ''}
                  ${prod.size ? `<div><b>Size:</b> ${esc(prod.size)}</div>` : ''}
                  <div><b>Availability:</b> ${esc(prod.availability)}</div>
                  <div><b>Location:</b> ${esc(prod.locality || (biz ? biz.locality : ''))}, ${esc(prod.city || (biz ? biz.city : ''))}</div>
                </div>

                <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px;">
                  <button class="btn btn-primary btn-lg" style="width:100%;" onclick="openPurchaseRequestForm('${prod.id}')">
                    Request to Purchase &rarr;
                  </button>
                  <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="closeModalDirect('product-detail-modal');openEnquiryModal('${biz ? biz.id : ''}', '${esc(biz ? biz.name : '')}', '${prod.id}', '${esc(prod.name)}')">
                    💬 Ask a Question / Product Enquiry
                  </button>
                  <button class="btn btn-outline btn-sm" style="width:100%;" onclick="closeModalDirect('product-detail-modal');openBusinessDetail('${biz ? biz.id : ''}')">
                    View Business Profile (${esc(biz ? biz.name : '')})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-root').innerHTML = modalHtml;
  }

  window.openPurchaseRequestForm = function (productId) {
    const prod = ANN_DB.getProductById(productId);
    if (!prod) return;
    const biz = ANN_DB.getBusinessById(prod.businessId);

    const session = ANN_DB.getCurrentSession();
    const custName = session && session.role === 'customer' ? session.user.name : '';
    const custEmail = session && session.role === 'customer' ? session.user.email : '';
    const custPhone = session && session.role === 'customer' ? session.user.phone : '';

    const modalHtml = `
      <div class="modal-overlay active" id="purchase-request-modal" onclick="closeModalDirect('purchase-request-modal')">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Request to Purchase</h3>
            <button class="modal-close-btn" onclick="closeModalDirect('purchase-request-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background:var(--pink-light);padding:14px;border-radius:var(--radius-sm);margin-bottom:18px;">
              <b>Item:</b> ${esc(prod.name)} &middot; <b>₹${prod.price}</b> each<br>
              <small style="color:var(--text-muted);">Seller: ${esc(biz ? biz.name : '')} (${esc(biz ? biz.city : '')})</small>
            </div>

            <form id="purchase-req-form" onsubmit="handlePurchaseRequestSubmit(event, '${prod.id}')">
              <div class="form-row">
                <div class="form-group">
                  <label for="req-cust-name">Your Name <span class="required">*</span></label>
                  <input type="text" id="req-cust-name" class="form-control" required value="${esc(custName)}" placeholder="e.g. Anita Desai" />
                </div>
                <div class="form-group">
                  <label for="req-cust-phone">WhatsApp / Phone <span class="required">*</span></label>
                  <input type="tel" id="req-cust-phone" class="form-control" required value="${esc(custPhone)}" placeholder="e.g. +91 98765 99887" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="req-cust-email">Email Address <span class="required">*</span></label>
                  <input type="email" id="req-cust-email" class="form-control" required value="${esc(custEmail)}" placeholder="e.g. anita@example.com" />
                </div>
                <div class="form-group">
                  <label for="req-qty">Quantity <span class="required">*</span></label>
                  <input type="number" id="req-qty" class="form-control" value="1" min="1" max="100" onchange="calculateReqTotal(${prod.price})" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="req-contact-pref">Preferred Contact Method</label>
                  <select id="req-contact-pref" class="form-control">
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="req-fulfillment">Pickup or Delivery Preference</label>
                  <select id="req-fulfillment" class="form-control">
                    <option value="Local Delivery">Local Courier Delivery</option>
                    <option value="Self-Pickup">Self-Pickup from Workshop</option>
                    <option value="Pan-India Shipping">Pan-India Courier</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="req-address">Delivery Location / Address</label>
                <input type="text" id="req-address" class="form-control" placeholder="House/Flat number, locality, city" />
              </div>

              <div class="form-group">
                <label for="req-notes">Message / Customization Request</label>
                <textarea id="req-notes" class="form-control" placeholder="Any specific requirements, celebration date, or customization notes for the seller..."></textarea>
              </div>

              <div style="background:var(--lavender);padding:12px;border-radius:var(--radius-sm);font-size:0.8rem;color:var(--text-main);margin-bottom:16px;">
                <b>Demonstration Notice:</b> This purchase request coordinates directly with the seller. No advance payment is charged on this platform.
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--border);">
                <div>
                  <span style="font-size:0.85rem;color:var(--text-muted);">Estimated Total:</span>
                  <span id="req-est-total" style="font-size:1.3rem;font-weight:700;color:var(--text-heading);margin-left:6px;">₹${prod.price}</span>
                </div>
                <button type="submit" class="btn btn-primary btn-lg">Submit Purchase Request &rarr;</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-root').innerHTML = modalHtml;
  }

  window.calculateReqTotal = function (unitPrice) {
    const qtyInput = document.getElementById('req-qty');
    const totalEl = document.getElementById('req-est-total');
    if (qtyInput && totalEl) {
      const qty = Number(qtyInput.value) || 1;
      totalEl.textContent = '₹' + unitPrice * qty;
    }
  };

  window.handlePurchaseRequestSubmit = function (e, productId) {
    e.preventDefault();
    const prod = ANN_DB.getProductById(productId);
    if (!prod) return;
    const biz = ANN_DB.getBusinessById(prod.businessId);

    const requestData = {
      businessId: prod.businessId,
      businessName: prod.businessName,
      sellerUserId: biz ? biz.ownerId : null,
      productId: prod.id,
      productName: prod.name,
      productPrice: prod.price,
      customerName: document.getElementById('req-cust-name').value,
      customerEmail: document.getElementById('req-cust-email').value,
      customerPhone: document.getElementById('req-cust-phone').value,
      quantity: Number(document.getElementById('req-qty').value) || 1,
      contactPreference: document.getElementById('req-contact-pref').value,
      fulfillmentPreference: document.getElementById('req-fulfillment').value,
      deliveryAddress: document.getElementById('req-address').value,
      message: document.getElementById('req-notes').value
    };

    const newReq = ANN_DB.createPurchaseRequest(requestData);
    closeModalDirect('purchase-request-modal');
    closeModalDirect('product-detail-modal');

    // Show confirmation modal with Reference ID
    const successModalHtml = `
      <div class="modal-overlay active" id="req-success-modal" onclick="closeModalDirect('req-success-modal')">
        <div class="modal-dialog" onclick="event.stopPropagation()" style="text-align:center;padding:36px;">
          <div style="font-size:3.5rem;margin-bottom:14px;">🎉</div>
          <span class="badge badge-approved" style="margin-bottom:10px;">Request Submitted</span>
          <h2 style="margin-bottom:8px;">Purchase Request Received!</h2>
          <p style="color:var(--text-muted);font-size:0.95rem;margin-bottom:18px;">
            Your reference ID is <b>${esc(newReq.id)}</b>. The entrepreneur has received your request and will contact you via ${esc(newReq.contactPreference)}.
          </p>
          <div style="background:var(--pink-light);padding:14px;border-radius:var(--radius-sm);margin-bottom:24px;font-size:0.875rem;">
            <b>Product:</b> ${esc(newReq.productName)} &middot; <b>Quantity:</b> ${newReq.quantity} &middot; <b>Est. Total:</b> ₹${newReq.estimatedTotal}
          </div>
          <div style="display:flex;justify-content:center;gap:12px;">
            <button class="btn btn-outline" onclick="closeModalDirect('req-success-modal')">Continue Browsing</button>
            <button class="btn btn-primary" onclick="closeModalDirect('req-success-modal');navigateTo('customer-dashboard')">View in My Requests &rarr;</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-root').innerHTML = successModalHtml;
  };

  // Seller Action on Request (Accept / Decline / Respond)
  window.openSellerRequestAction = function (requestId) {
    const allReqs = ANN_DB.getAllRequests();
    const req = allReqs.find((r) => r.id === requestId);
    if (!req) return;

    const modalHtml = `
      <div class="modal-overlay active" id="seller-req-modal" onclick="closeModalDirect('seller-req-modal')">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Manage Purchase Request (${esc(req.id)})</h3>
            <button class="modal-close-btn" onclick="closeModalDirect('seller-req-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom:18px;background:var(--pink-light);padding:16px;border-radius:var(--radius-sm);">
              <h4>${esc(req.productName)}</h4>
              <p style="font-size:0.9rem;color:var(--text-heading);margin-top:4px;">
                Quantity: <b>${req.quantity}</b> &middot; Total Amount: <b>₹${req.estimatedTotal}</b>
              </p>
            </div>

            <div style="font-size:0.875rem;line-height:1.6;margin-bottom:20px;">
              <p><b>Customer:</b> ${esc(req.customerName)}</p>
              <p><b>Contact Preference:</b> ${esc(req.contactPreference)} (${esc(req.customerPhone)} / ${esc(req.customerEmail)})</p>
              <p><b>Fulfillment:</b> ${esc(req.fulfillmentPreference)}</p>
              ${req.deliveryAddress ? `<p><b>Address:</b> ${esc(req.deliveryAddress)}</p>` : ''}
              ${req.message ? `<p><b>Customer Note:</b> "${esc(req.message)}"</p>` : ''}
              <p><b>Current Status:</b> <span class="badge badge-lavender">${req.status}</span></p>
            </div>

            <div class="form-group">
              <label for="seller-reply-note">Seller Response Note to Buyer</label>
              <textarea id="seller-reply-note" class="form-control" placeholder="e.g. Order accepted! Will dispatch tomorrow via local courier. Tracking shared on WhatsApp.">${esc(req.sellerNote || '')}</textarea>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
              <button class="btn btn-outline btn-sm" onclick="handleSellerUpdateRequestStatus('${req.id}', 'Declined')">Decline Request</button>
              <button class="btn btn-secondary btn-sm" onclick="handleSellerUpdateRequestStatus('${req.id}', 'Completed')">Mark Completed</button>
              <button class="btn btn-primary btn-sm" onclick="handleSellerUpdateRequestStatus('${req.id}', 'Accepted')">Accept & Confirm Request</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-root').innerHTML = modalHtml;
  };

  window.handleSellerUpdateRequestStatus = function (requestId, newStatus) {
    const note = document.getElementById('seller-reply-note').value.trim();
    ANN_DB.updateRequestStatus(requestId, newStatus, note);
    closeModalDirect('seller-req-modal');
    showToast(`Request ${requestId} status updated to: ${newStatus}`);
    renderApp();
  };

  // General & Product Enquiry Modal
  window.openEnquiryModal = function (businessId, businessName, productId = null, productName = null) {
    const session = ANN_DB.getCurrentSession();
    const custName = session && session.role === 'customer' ? session.user.name : '';
    const custContact = session && session.role === 'customer' ? (session.user.phone || session.user.email) : '';

    const modalHtml = `
      <div class="modal-overlay active" id="enquiry-modal" onclick="closeModalDirect('enquiry-modal')">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Send Inquiry to ${esc(businessName)}</h3>
            <button class="modal-close-btn" onclick="closeModalDirect('enquiry-modal')">&times;</button>
          </div>
          <div class="modal-body">
            ${
              productName
                ? `
              <div style="background:var(--pink-light);padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:16px;border:1px solid var(--border);">
                <b>Product Inquiry:</b> ${esc(productName)}
              </div>
            `
                : ''
            }
            <form onsubmit="handleSendEnquirySubmit(event, '${businessId}', '${esc(businessName)}', '${productId || ''}', '${esc(productName || '')}')">
              <div class="form-group">
                <label>Your Name <span class="required">*</span></label>
                <input type="text" id="enq-name" class="form-control" required value="${esc(custName)}" placeholder="e.g. Pooja Hegde" />
              </div>
              <div class="form-group">
                <label>Your Phone or Email <span class="required">*</span></label>
                <input type="text" id="enq-contact" class="form-control" required value="${esc(custContact)}" placeholder="e.g. +91 98765 00000 or email" />
              </div>
              <div class="form-group">
                <label>Your Question / Inquiry <span class="required">*</span></label>
                <textarea id="enq-msg" class="form-control" required placeholder="Ask about custom bulk orders, bridal sets, batch ingredients, or delivery..."></textarea>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;">Submit Inquiry &rarr;</button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-root').innerHTML = modalHtml;
  };

  window.handleSendEnquirySubmit = function (e, businessId, businessName, productId, productName) {
    e.preventDefault();
    const contactVal = document.getElementById('enq-contact').value;
    ANN_DB.createEnquiry({
      businessId,
      businessName,
      productId: productId || null,
      productName: productName || null,
      name: document.getElementById('enq-name').value,
      contact: contactVal,
      message: document.getElementById('enq-msg').value
    });
    localStorage.setItem('ann_last_customer_contact', contactVal);
    closeModalDirect('enquiry-modal');
    showToast('Inquiry sent to entrepreneur!');
    if (state.currentRoute === 'customer-dashboard') {
      renderApp();
    }
  };

  // Seller Reply to Customer Enquiry
  window.replyToEnquiryPrompt = function (enquiryId) {
    const enquiries = ANN_DB.getAllEnquiries();
    const enq = enquiries.find((e) => e.id === enquiryId);
    if (!enq) return;

    const modalHtml = `
      <div class="modal-overlay active" id="reply-enquiry-modal" onclick="closeModalDirect('reply-enquiry-modal')">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Reply to Customer Inquiry</h3>
            <button class="modal-close-btn" onclick="closeModalDirect('reply-enquiry-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background:var(--pink-light);padding:14px;border-radius:var(--radius-sm);margin-bottom:18px;">
              <p><b>From:</b> ${esc(enq.name)} (${esc(enq.contact)})</p>
              ${enq.productName ? `<p style="color:var(--rose);font-weight:600;margin-top:4px;">Regarding Product: ${esc(enq.productName)}</p>` : ''}
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
                <b>Inquiry Message:</b>
                <p style="margin-top:4px;color:var(--text-main);">${esc(enq.message)}</p>
              </div>
            </div>

            <form onsubmit="handleSendSellerEnquiryReply(event, '${enq.id}')">
              <div class="form-group">
                <label for="seller-reply-text">Your Reply to Customer <span class="required">*</span></label>
                <textarea id="seller-reply-text" class="form-control" required placeholder="Type your response to the customer...">${esc(enq.sellerReply || '')}</textarea>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
                <button type="button" class="btn btn-outline" onclick="closeModalDirect('reply-enquiry-modal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Send Response &rarr;</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-root').innerHTML = modalHtml;
  };

  window.handleSendSellerEnquiryReply = function (e, enquiryId) {
    e.preventDefault();
    const replyText = document.getElementById('seller-reply-text').value.trim();
    ANN_DB.updateEnquiryReply(enquiryId, replyText);
    closeModalDirect('reply-enquiry-modal');
    showToast('Reply sent! Inquiry marked as Responded.');
    renderApp();
  };

  window.handleSaveBusinessProfile = function (e) {
    e.preventDefault();
    const session = ANN_DB.getCurrentSession();
    if (!session) return;
    const business = ANN_DB.getBusinessByOwnerId(session.user.id);
    if (!business) return;

    const updatedData = {
      ...business,
      name: document.getElementById('edit-biz-name').value.trim(),
      category: document.getElementById('edit-biz-category').value,
      desc: document.getElementById('edit-biz-desc').value.trim(),
      state: document.getElementById('edit-biz-state').value.trim(),
      city: document.getElementById('edit-biz-city').value.trim(),
      locality: document.getElementById('edit-biz-locality').value.trim(),
      pincode: document.getElementById('edit-biz-pincode').value.trim(),
      serviceArea: document.getElementById('edit-biz-service-area').value.trim(),
      contactPhone: document.getElementById('edit-biz-phone').value.trim(),
      operatingHours: document.getElementById('edit-biz-hours').value.trim(),
      fullAddress: document.getElementById('edit-biz-address').value.trim()
    };

    ANN_DB.saveBusiness(updatedData);
    showToast('Business profile updated successfully!');
    renderApp();
  };

  // Report Listing Modal
  window.openReportModal = function (businessId, businessName) {
    const modalHtml = `
      <div class="modal-overlay active" id="report-modal" onclick="closeModalDirect('report-modal')">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Report Listing: ${esc(businessName)}</h3>
            <button class="modal-close-btn" onclick="closeModalDirect('report-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <form onsubmit="handleReportSubmit(event, '${businessId}', '${esc(businessName)}')">
              <div class="form-group">
                <label>Reason for Concern <span class="required">*</span></label>
                <select id="rep-reason" class="form-control" required>
                  <option value="Inaccurate Information">Inaccurate Information or Pricing</option>
                  <option value="Suspected Fraud">Suspected Fraud or Unresponsive Seller</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Prohibited Items">Prohibited Items</option>
                </select>
              </div>
              <div class="form-group">
                <label>Details / Description <span class="required">*</span></label>
                <textarea id="rep-desc" class="form-control" required placeholder="Please describe the issue observed..."></textarea>
              </div>
              <div class="form-group">
                <label>Your Contact (Optional)</label>
                <input type="text" id="rep-contact" class="form-control" placeholder="Email or phone for admin follow-up" />
              </div>
              <button type="submit" class="btn btn-outline" style="width:100%;border-color:var(--status-rejected-text);color:var(--status-rejected-text);">
                Submit Report to Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-root').innerHTML = modalHtml;
  };

  window.handleReportSubmit = function (e, businessId, businessName) {
    e.preventDefault();
    ANN_DB.createReport({
      businessId,
      businessName,
      reason: document.getElementById('rep-reason').value,
      description: document.getElementById('rep-desc').value,
      reporterContact: document.getElementById('rep-contact').value
    });
    closeModalDirect('report-modal');
    showToast('Report captured for administrative review.');
  };

  // Forgot password demo modal
  window.openForgotPasswordModal = function (role) {
    alert(`Demo Notice: For evaluation testing, you can use the 'Quick Fill' demo credentials on the ${role} login page.`);
  };

  window.closeModalDirect = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
  };

  // Directory filter controls
  window.updateDirectoryFilters = function () {
    const sInput = document.getElementById('dir-search-input');
    const cSelect = document.getElementById('dir-cat-select');
    const cityInput = document.getElementById('dir-city-input');
    const pinInput = document.getElementById('dir-pin-input');

    if (sInput) state.searchQuery = sInput.value;
    if (cSelect) state.selectedCategory = cSelect.value;
    if (cityInput) state.selectedCity = cityInput.value;
    if (pinInput) state.selectedPincode = pinInput.value;

    renderApp();
  };

  window.resetDirectoryFilters = function () {
    state.searchQuery = '';
    state.selectedCategory = '';
    state.selectedCity = '';
    state.selectedPincode = '';
    renderApp();
  };

  window.filterByCategory = function (catName) {
    state.selectedCategory = catName;
    navigateTo('directory');
  };

  window.detectUserLocation = function () {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your city manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.selectedCity = 'Hyderabad';
        showToast('Location set to Hyderabad (approximate)');
        renderApp();
      },
      (err) => {
        alert('Location access was denied or unavailable. Manual location filtering is active.');
      }
    );
  };

  window.updateProductFilters = function () {
    const sInput = document.getElementById('prod-search-input');
    const cSelect = document.getElementById('prod-cat-select');
    const cityInput = document.getElementById('prod-city-input');

    if (sInput) state.searchQuery = sInput.value;
    if (cSelect) state.selectedCategory = cSelect.value;
    if (cityInput) state.selectedCity = cityInput.value;

    renderApp();
  };

  window.openBusinessDetail = function (businessId) {
    navigateTo('business-detail', businessId);
  };

  window.setSellerTab = function (tab) {
    state.sellerActiveTab = tab;
    renderApp();
  };

  window.setAdminTab = function (tab) {
    state.adminActiveTab = tab;
    renderApp();
  };

  window.toggleMobileNav = function () {
    const links = document.querySelector('.nav-links');
    if (links) {
      if (links.style.display === 'flex') {
        links.style.display = 'none';
      } else {
        links.style.display = 'flex';
        links.style.flexDirection = 'column';
        links.style.position = 'absolute';
        links.style.top = '74px';
        links.style.left = '0';
        links.style.right = '0';
        links.style.background = '#FFFCFA';
        links.style.padding = '20px';
        links.style.borderBottom = '1px solid #E9E3E5';
        links.style.boxShadow = '0 8px 24px rgba(185,111,131,0.08)';
      }
    }
  };

  // Preview Product Modal before saving
  window.previewProductModal = function () {
    const name = document.getElementById('prod-name').value || 'Product Preview';
    const price = document.getElementById('prod-price').value || '0';
    const desc = document.getElementById('prod-description').value || 'No description provided.';
    const imgUrl = state.uploadedProductImages.length > 0 ? state.uploadedProductImages[0].dataUrl : '';

    const modalHtml = `
      <div class="modal-overlay active" id="prod-preview-modal" onclick="closeModalDirect('prod-preview-modal')">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Listing Preview</h3>
            <button class="modal-close-btn" onclick="closeModalDirect('prod-preview-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div style="height:240px;background:var(--pink-light);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:16px;">
              ${imgUrl ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="height:100%;display:grid;place-items:center;color:var(--text-muted);">No photo selected</div>'}
            </div>
            <h2>${esc(name)}</h2>
            <div style="font-size:1.4rem;font-weight:700;color:var(--text-heading);margin:8px 0 12px;">₹${price}</div>
            <p style="color:var(--text-muted);line-height:1.6;">${esc(desc)}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="closeModalDirect('prod-preview-modal')">Back to Editing</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-root').innerHTML = modalHtml;
  };

  // =========================================================================
  // BOOTSTRAP APPLICATION
  // =========================================================================
  async function init() {
    await ANN_DB.init();
    initSplashScreen();
    await renderApp();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
