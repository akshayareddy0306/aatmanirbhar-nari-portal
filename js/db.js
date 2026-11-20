/**
 * Aatmanirbhar Nari — Shared Browser-Side Database & Persistence Layer
 * Combines IndexedDB (for full-resolution images) and localStorage (for structured relational records).
 * Enables seamless cross-role testing (Seller <-> Admin <-> Customer) in the same browser.
 */

const ANN_DB = (function () {
  const DB_NAME = 'AatmanirbharNariDB';
  const DB_VERSION = 1;
  const IMAGE_STORE = 'product_images';

  let idbPromise = null;

  function svgToBase64(svg) {
    if (typeof window !== 'undefined' && window.btoa) {
      return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
    }
    if (typeof Buffer !== 'undefined') {
      return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    }
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  const SVGS = {
  jhumka: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <radialGradient id="bgJ" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#FFF5F7"/><stop offset="100%" stop-color="#F6DDE3"/></radialGradient>
      <linearGradient id="goldJ" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFEAA7"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
      <radialGradient id="pearlJ" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="60%" stop-color="#FDFBF7"/><stop offset="100%" stop-color="#E2D9CC"/></radialGradient>
      <filter id="shJ"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#B96F83" flood-opacity="0.3"/></filter>
    </defs>
    <rect width="500" height="500" fill="url(#bgJ)"/>
    <g filter="url(#shJ)">
      <circle cx="250" cy="110" r="30" fill="url(#goldJ)" stroke="#B96F83" stroke-width="2"/>
      <circle cx="250" cy="110" r="18" fill="url(#pearlJ)" stroke="#AA771C" stroke-width="1.5"/>
      <circle cx="250" cy="110" r="7" fill="#B96F83"/>
      <path d="M 246 140 L 254 140 L 252 165 L 248 165 Z" fill="url(#goldJ)"/>
      <circle cx="250" cy="165" r="5" fill="url(#goldJ)"/>
      <path d="M 180 195 Q 250 155 320 195 C 315 255 185 255 180 195 Z" fill="url(#goldJ)" stroke="#AA771C" stroke-width="2"/>
      <path d="M 195 205 Q 250 180 305 205" fill="none" stroke="#FFF5F7" stroke-width="2" opacity="0.7"/>
      <path d="M 190 225 Q 250 200 310 225" fill="none" stroke="#AA771C" stroke-width="2"/>
      <circle cx="225" cy="215" r="4" fill="#B96F83"/>
      <circle cx="250" cy="212" r="5" fill="url(#pearlJ)"/>
      <circle cx="275" cy="215" r="4" fill="#B96F83"/>
      <rect x="180" y="245" width="140" height="8" rx="4" fill="#AA771C"/>
      <g>
        <circle cx="190" cy="272" r="7" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <circle cx="205" cy="278" r="7.5" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <circle cx="220" cy="284" r="8" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <circle cx="235" cy="288" r="8.5" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <circle cx="250" cy="292" r="9.5" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1.2"/>
        <circle cx="265" cy="288" r="8.5" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <circle cx="280" cy="284" r="8" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <circle cx="295" cy="278" r="7.5" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <circle cx="310" cy="272" r="7" fill="url(#pearlJ)" stroke="#B96F83" stroke-width="1"/>
        <line x1="190" y1="253" x2="190" y2="265" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="205" y1="253" x2="205" y2="271" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="220" y1="253" x2="220" y2="276" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="235" y1="253" x2="235" y2="280" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="250" y1="253" x2="250" y2="282" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="265" y1="253" x2="265" y2="280" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="280" y1="253" x2="280" y2="276" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="295" y1="253" x2="295" y2="271" stroke="#AA771C" stroke-width="1.5"/>
        <line x1="310" y1="253" x2="310" y2="265" stroke="#AA771C" stroke-width="1.5"/>
      </g>
    </g>
    <rect x="40" y="405" width="420" height="65" rx="14" fill="#FFFFFF" fill-opacity="0.92" stroke="#E9E3E5"/>
    <text x="250" y="432" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#3D3642" text-anchor="middle">Kundan &amp; Pearl Jhumka Earrings</text>
    <text x="250" y="454" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#B96F83" text-anchor="middle">Sakhi Studio &bull; Handcrafted in Hyderabad</text>
  </svg>`,

  chandbali: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <radialGradient id="bgC" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#FFF5F7"/><stop offset="100%" stop-color="#FBECEF"/></radialGradient>
      <linearGradient id="goldC" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFEAA7"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
      <radialGradient id="pearlC" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="60%" stop-color="#FDFBF7"/><stop offset="100%" stop-color="#E2D9CC"/></radialGradient>
      <filter id="shC"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#B96F83" flood-opacity="0.25"/></filter>
    </defs>
    <rect width="500" height="500" fill="url(#bgC)"/>
    <g filter="url(#shC)">
      <circle cx="250" cy="95" r="24" fill="url(#goldC)" stroke="#B96F83" stroke-width="1.5"/>
      <circle cx="250" cy="95" r="14" fill="#F6DDE3" stroke="#D4AF37" stroke-width="1.5"/>
      <circle cx="250" cy="95" r="6" fill="#B96F83"/>
      <line x1="250" y1="120" x2="250" y2="145" stroke="#AA771C" stroke-width="3"/>
      <!-- Crescent Outer & Inner -->
      <path d="M 160 180 C 160 295 340 295 340 180 C 315 250 185 250 160 180 Z" fill="#FBECEF" stroke="url(#goldC)" stroke-width="4"/>
      <!-- Meenakari floral motif inside crescent -->
      <circle cx="250" cy="220" r="22" fill="#F6DDE3" stroke="#B96F83" stroke-width="2"/>
      <circle cx="250" cy="220" r="12" fill="url(#goldC)"/>
      <circle cx="250" cy="220" r="5" fill="#FFF"/>
      <!-- Seed pearls around outer crescent -->
      <circle cx="170" cy="205" r="6.5" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <circle cx="185" cy="235" r="7" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <circle cx="205" cy="260" r="7.5" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <circle cx="230" cy="275" r="8" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <circle cx="250" cy="280" r="9" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1.2"/>
      <circle cx="270" cy="275" r="8" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <circle cx="295" cy="260" r="7.5" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <circle cx="315" cy="235" r="7" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <circle cx="330" cy="205" r="6.5" fill="url(#pearlC)" stroke="#B96F83" stroke-width="1"/>
      <!-- Hanging drops -->
      <g>
        <circle cx="215" cy="305" r="6" fill="url(#pearlC)" stroke="#AA771C" stroke-width="1"/>
        <line x1="215" y1="285" x2="215" y2="299" stroke="#AA771C" stroke-width="1.5"/>
        <circle cx="250" cy="315" r="7.5" fill="url(#pearlC)" stroke="#AA771C" stroke-width="1"/>
        <line x1="250" y1="289" x2="250" y2="307" stroke="#AA771C" stroke-width="1.5"/>
        <circle cx="285" cy="305" r="6" fill="url(#pearlC)" stroke="#AA771C" stroke-width="1"/>
        <line x1="285" y1="285" x2="285" y2="299" stroke="#AA771C" stroke-width="1.5"/>
      </g>
    </g>
    <rect x="40" y="405" width="420" height="65" rx="14" fill="#FFFFFF" fill-opacity="0.92" stroke="#E9E3E5"/>
    <text x="250" y="432" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#3D3642" text-anchor="middle">Floral Meenakari Chandbalis</text>
    <text x="250" y="454" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#B96F83" text-anchor="middle">Pastel Blush Pink &bull; Pure Brass Enamel</text>
  </svg>`,

  necklace: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <radialGradient id="bgN" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#FAF8FC"/><stop offset="100%" stop-color="#E9E4F2"/></radialGradient>
      <linearGradient id="goldN" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFEAA7"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
      <radialGradient id="pearlN" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="65%" stop-color="#FAF5EE"/><stop offset="100%" stop-color="#D9CFC4"/></radialGradient>
      <filter id="shN"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#55515A" flood-opacity="0.2"/></filter>
    </defs>
    <rect width="500" height="500" fill="url(#bgN)"/>
    <g filter="url(#shN)">
      <!-- Silk tie cords -->
      <path d="M 80 80 Q 150 140 180 160" fill="none" stroke="#D4AF37" stroke-width="4" stroke-dasharray="6,3"/>
      <path d="M 420 80 Q 350 140 320 160" fill="none" stroke="#D4AF37" stroke-width="4" stroke-dasharray="6,3"/>
      <!-- Main Choker Strand Arc -->
      <path d="M 120 160 Q 250 280 380 160" fill="none" stroke="url(#goldN)" stroke-width="6"/>
      <!-- Strung Baroque Pearls -->
      <ellipse cx="140" cy="180" rx="11" ry="13" fill="url(#pearlN)" stroke="#B96F83" stroke-width="1"/>
      <ellipse cx="170" cy="204" rx="12" ry="14" fill="url(#pearlN)" stroke="#B96F83" stroke-width="1"/>
      <ellipse cx="205" cy="222" rx="13" ry="15" fill="url(#pearlN)" stroke="#B96F83" stroke-width="1"/>
      <ellipse cx="295" cy="222" rx="13" ry="15" fill="url(#pearlN)" stroke="#B96F83" stroke-width="1"/>
      <ellipse cx="330" cy="204" rx="12" ry="14" fill="url(#pearlN)" stroke="#B96F83" stroke-width="1"/>
      <ellipse cx="360" cy="180" rx="11" ry="13" fill="url(#pearlN)" stroke="#B96F83" stroke-width="1"/>
      <!-- Center Floral Filigree Pendant -->
      <g transform="translate(250, 235)">
        <circle cx="0" cy="0" r="26" fill="url(#goldN)" stroke="#AA771C" stroke-width="2"/>
        <circle cx="0" cy="0" r="16" fill="#FBECEF" stroke="#B96F83" stroke-width="2"/>
        <circle cx="0" cy="0" r="7" fill="#B96F83"/>
        <!-- Pendant drop pearl -->
        <line x1="0" y1="26" x2="0" y2="44" stroke="#AA771C" stroke-width="2.5"/>
        <ellipse cx="0" cy="56" rx="11" ry="15" fill="url(#pearlN)" stroke="#B96F83" stroke-width="1.2"/>
      </g>
    </g>
    <rect x="40" y="405" width="420" height="65" rx="14" fill="#FFFFFF" fill-opacity="0.92" stroke="#E9E3E5"/>
    <text x="250" y="432" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#3D3642" text-anchor="middle">Baroque Freshwater Pearl Choker</text>
    <text x="250" y="454" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#B96F83" text-anchor="middle">Natural Pearls &bull; 22K Gold Matte Filigree</text>
  </svg>`,

  pickle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <radialGradient id="bgP" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#FFFBF5"/><stop offset="100%" stop-color="#FBECEF"/></radialGradient>
      <linearGradient id="oilGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#D9480F"/><stop offset="40%" stop-color="#C92A2A"/><stop offset="100%" stop-color="#861B1B"/></linearGradient>
      <filter id="shP"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#861B1B" flood-opacity="0.2"/></filter>
    </defs>
    <rect width="500" height="500" fill="url(#bgP)"/>
    <g filter="url(#shP)">
      <!-- Jar Body Glass -->
      <rect x="165" y="140" width="170" height="200" rx="24" fill="#FFFFFF" fill-opacity="0.5" stroke="#E9E3E5" stroke-width="3"/>
      <!-- Spiced Oil & Pickle Mix inside -->
      <rect x="175" y="170" width="150" height="160" rx="16" fill="url(#oilGrad)"/>
      <!-- Mango Chunks & Spices -->
      <path d="M 195 200 Q 215 190 230 205 Q 220 225 200 220 Z" fill="#E67700" stroke="#FFE066" stroke-width="1.5"/>
      <path d="M 245 230 Q 275 220 285 245 Q 265 265 240 250 Z" fill="#E67700" stroke="#FFE066" stroke-width="1.5"/>
      <circle cx="210" cy="245" r="4" fill="#FFE066"/>
      <circle cx="270" cy="205" r="3.5" fill="#FFE066"/>
      <circle cx="230" cy="275" r="4" fill="#FFE066"/>
      <!-- Jar Lid Cloth Wrap (Traditional Bharani Top) -->
      <path d="M 175 140 C 185 105 315 105 325 140 Z" fill="#C92A2A" stroke="#861B1B" stroke-width="2"/>
      <ellipse cx="250" cy="115" rx="55" ry="16" fill="#E03131"/>
      <rect x="190" y="132" width="120" height="8" rx="4" fill="#D4AF37"/>
      <!-- Cloth string tie -->
      <line x1="210" y1="136" x2="195" y2="160" stroke="#FFEAA7" stroke-width="2.5"/>
      <line x1="210" y1="136" x2="205" y2="165" stroke="#FFEAA7" stroke-width="2.5"/>
      <!-- Kraft Paper Label -->
      <rect x="185" y="225" width="130" height="60" rx="8" fill="#FFF4E6" stroke="#D4AF37" stroke-width="1.5"/>
      <text x="250" y="248" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#861B1B" text-anchor="middle">AVAKAYA MANGO</text>
      <text x="250" y="264" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600" fill="#E67700" text-anchor="middle">Sun-dried &bull; 500g Jar</text>
      <text x="250" y="276" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" fill="#55515A" text-anchor="middle">Ananya Homemade</text>
    </g>
    <rect x="40" y="405" width="420" height="65" rx="14" fill="#FFFFFF" fill-opacity="0.92" stroke="#E9E3E5"/>
    <text x="250" y="432" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#3D3642" text-anchor="middle">Traditional Avakaya Mango Pickle</text>
    <text x="250" y="454" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#B96F83" text-anchor="middle">Cold-Pressed Sesame Oil &bull; Grandma Recipe</text>
  </svg>`,

  diya: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
    <defs>
      <radialGradient id="bgD" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#FCF9F6"/><stop offset="100%" stop-color="#E9E4F2"/></radialGradient>
      <linearGradient id="clayGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#D97736"/><stop offset="50%" stop-color="#B85D19"/><stop offset="100%" stop-color="#7A390B"/></linearGradient>
      <radialGradient id="flameGrad" cx="50%" cy="80%" r="70%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="30%" stop-color="#FFD43B"/><stop offset="70%" stop-color="#FF922B"/><stop offset="100%" stop-color="#F03E3E"/></radialGradient>
      <filter id="glowF"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#FFD43B" flood-opacity="0.6"/></filter>
    </defs>
    <rect width="500" height="500" fill="url(#bgD)"/>
    <!-- Diya Base Clay -->
    <path d="M 130 250 Q 250 310 370 250 Q 250 210 130 250 Z" fill="url(#clayGrad)" stroke="#7A390B" stroke-width="2"/>
    <ellipse cx="250" cy="245" rx="100" ry="24" fill="#7A390B"/>
    <ellipse cx="250" cy="247" rx="90" ry="18" fill="#F76707" opacity="0.8"/>
    <!-- Hand-carved floral edge notches -->
    <circle cx="150" cy="248" r="4" fill="#FFEAA7"/>
    <circle cx="180" cy="265" r="4" fill="#FFEAA7"/>
    <circle cx="215" cy="275" r="4" fill="#FFEAA7"/>
    <circle cx="250" cy="278" r="5" fill="#FFEAA7"/>
    <circle cx="285" cy="275" r="4" fill="#FFEAA7"/>
    <circle cx="320" cy="265" r="4" fill="#FFEAA7"/>
    <circle cx="350" cy="248" r="4" fill="#FFEAA7"/>
    <!-- Glowing Flame -->
    <g filter="url(#glowF)">
      <path d="M 235 245 C 230 195 250 145 250 130 C 250 145 270 195 265 245 Z" fill="url(#flameGrad)"/>
      <ellipse cx="250" cy="215" rx="7" ry="20" fill="#FFFFFF" opacity="0.85"/>
    </g>
    <rect x="40" y="405" width="420" height="65" rx="14" fill="#FFFFFF" fill-opacity="0.92" stroke="#E9E3E5"/>
    <text x="250" y="432" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#3D3642" text-anchor="middle">Hand-carved Terracotta Diya Set</text>
    <text x="250" y="454" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#B96F83" text-anchor="middle">Mitti &amp; Clay Studio &bull; Natural River Clay</text>
  </svg>`,

  // Business Cover Banners (16:9 widescreen)
  bizSakhi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
    <defs>
      <linearGradient id="bBgS" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FBECEF"/><stop offset="50%" stop-color="#F6DDE3"/><stop offset="100%" stop-color="#E9E4F2"/></linearGradient>
      <linearGradient id="bGoldS" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFEAA7"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
    </defs>
    <rect width="800" height="360" fill="url(#bBgS)"/>
    <!-- Decorative arches & jewelry tray -->
    <rect x="50" y="50" width="700" height="260" rx="18" fill="#FFFFFF" fill-opacity="0.8" stroke="#E9E3E5" stroke-width="2"/>
    <circle cx="160" cy="180" r="70" fill="#FBECEF" stroke="#B96F83" stroke-width="3"/>
    <text x="160" y="195" font-size="64" text-anchor="middle">💍</text>
    <text x="260" y="150" font-family="'Playfair Display', serif" font-size="28" font-weight="700" fill="#3D3642">Sakhi Studio &amp; Handcrafted Jewelry</text>
    <text x="260" y="185" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" fill="#55515A">Bespoke Pearl Jhumkas, Brass Chokers &amp; Festive Enamel Earrings</text>
    <rect x="260" y="215" width="130" height="32" rx="16" fill="#F6DDE3"/>
    <text x="325" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#B96F83" text-anchor="middle">📍 Banjara Hills</text>
    <rect x="405" y="215" width="150" height="32" rx="16" fill="#E9E4F2"/>
    <text x="480" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#55515A" text-anchor="middle">✨ Admin Verified</text>
  </svg>`,

  bizAnanya: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
    <defs>
      <linearGradient id="bBgA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFF9F5"/><stop offset="50%" stop-color="#FBECEF"/><stop offset="100%" stop-color="#F6DDE3"/></linearGradient>
    </defs>
    <rect width="800" height="360" fill="url(#bBgA)"/>
    <rect x="50" y="50" width="700" height="260" rx="18" fill="#FFFFFF" fill-opacity="0.8" stroke="#E9E3E5" stroke-width="2"/>
    <circle cx="160" cy="180" r="70" fill="#FFF4E6" stroke="#E67700" stroke-width="3"/>
    <text x="160" y="195" font-size="64" text-anchor="middle">🍲</text>
    <text x="260" y="150" font-family="'Playfair Display', serif" font-size="28" font-weight="700" fill="#3D3642">Ananya Homemade Flavours</text>
    <text x="260" y="185" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" fill="#55515A">Authentic Andhra Mango Pickles, Spice Blends &amp; Festive Sweets</text>
    <rect x="260" y="215" width="125" height="32" rx="16" fill="#FFF4E6"/>
    <text x="322" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#E67700" text-anchor="middle">📍 Kukatpally</text>
    <rect x="400" y="215" width="150" height="32" rx="16" fill="#E9E4F2"/>
    <text x="475" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#55515A" text-anchor="middle">✨ Admin Verified</text>
  </svg>`,

  bizMitti: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
    <defs>
      <linearGradient id="bBgM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FAF7F5"/><stop offset="50%" stop-color="#E9E4F2"/><stop offset="100%" stop-color="#FBECEF"/></linearGradient>
    </defs>
    <rect width="800" height="360" fill="url(#bBgM)"/>
    <rect x="50" y="50" width="700" height="260" rx="18" fill="#FFFFFF" fill-opacity="0.8" stroke="#E9E3E5" stroke-width="2"/>
    <circle cx="160" cy="180" r="70" fill="#FBECEF" stroke="#B85D19" stroke-width="3"/>
    <text x="160" y="195" font-size="64" text-anchor="middle">🏺</text>
    <text x="260" y="150" font-family="'Playfair Display', serif" font-size="28" font-weight="700" fill="#3D3642">Mitti &amp; Clay Artisan Studio</text>
    <text x="260" y="185" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" fill="#55515A">Eco-conscious Terracotta Planters, Clay Diyas &amp; Pottery</text>
    <rect x="260" y="215" width="125" height="32" rx="16" fill="#FBECEF"/>
    <text x="322" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#B85D19" text-anchor="middle">📍 Patancheru</text>
    <rect x="400" y="215" width="150" height="32" rx="16" fill="#E9E4F2"/>
    <text x="475" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#55515A" text-anchor="middle">✨ Admin Verified</text>
  </svg>`,

  bizAkshaya: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
    <defs>
      <linearGradient id="bBgAk" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FDF8FA"/><stop offset="50%" stop-color="#F6DDE3"/><stop offset="100%" stop-color="#E9E4F2"/></linearGradient>
    </defs>
    <rect width="800" height="360" fill="url(#bBgAk)"/>
    <rect x="50" y="50" width="700" height="260" rx="18" fill="#FFFFFF" fill-opacity="0.85" stroke="#E9E3E5" stroke-width="2"/>
    <circle cx="160" cy="180" r="70" fill="#FBECEF" stroke="#B96F83" stroke-width="3"/>
    <text x="160" y="195" font-size="64" text-anchor="middle">👑</text>
    <text x="260" y="150" font-family="'Playfair Display', serif" font-size="28" font-weight="700" fill="#3D3642">Akshaya Handcrafted Jewels &amp; Studio</text>
    <text x="260" y="185" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" fill="#55515A">Royal Kundan Chokers, Bespoke Bridal Earrings &amp; Silver Filigree</text>
    <rect x="260" y="215" width="130" height="32" rx="16" fill="#F6DDE3"/>
    <text x="325" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#B96F83" text-anchor="middle">📍 Banjara Hills</text>
    <rect x="405" y="215" width="150" height="32" rx="16" fill="#E9E4F2"/>
    <text x="480" y="236" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#55515A" text-anchor="middle">✨ Entrepreneur</text>
  </svg>`
};

  // Pre-compiled Base64 Map for instantaneous image rendering
  const SEED_IMAGE_MAP = {
    'img-seed-jhumka': svgToBase64(SVGS.jhumka),
    'img-seed-chandbali': svgToBase64(SVGS.chandbali),
    'img-seed-necklace': svgToBase64(SVGS.necklace),
    'img-seed-pickle': svgToBase64(SVGS.pickle),
    'img-seed-diya': svgToBase64(SVGS.diya),
    'img-seed-biz-sakhi': svgToBase64(SVGS.bizSakhi),
    'img-seed-biz-ananya': svgToBase64(SVGS.bizAnanya),
    'img-seed-biz-mitti': svgToBase64(SVGS.bizMitti),
    'img-seed-biz-akshaya': svgToBase64(SVGS.bizAkshaya)
  };

  // Initialize IndexedDB for high-res photo persistence
  function openIDB() {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to memory/local storage');
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        resolve(null);
      };
    });
    return idbPromise;
  }

  // Save image dataUrl to IndexedDB
  async function saveImage(id, dataUrl, meta = {}) {
    const db = await openIDB();
    if (!db) {
      try {
        localStorage.setItem('ann_img_' + id, dataUrl);
      } catch (e) {
        console.warn('Image storage quota exceeded');
      }
      return id;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, 'readwrite');
      const store = tx.objectStore(IMAGE_STORE);
      store.put({
        id,
        dataUrl,
        name: meta.name || 'image.jpg',
        type: meta.type || 'image/jpeg',
        size: meta.size || 0,
        createdAt: new Date().toISOString()
      });
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  // Retrieve image dataUrl from IndexedDB or seed cache
  async function getImage(id) {
    if (!id) return null;
    // Check instant seed cache
    if (SEED_IMAGE_MAP[id]) {
      return SEED_IMAGE_MAP[id];
    }
    if (id.startsWith('data:image/svg+xml;utf8,<svg')) {
      return svgToBase64(id.replace('data:image/svg+xml;utf8,', ''));
    }
    if (id.startsWith('data:') || id.startsWith('http://') || id.startsWith('https://')) {
      return id; // already inline data or URL
    }
    const db = await openIDB();
    if (!db) {
      let val = localStorage.getItem('ann_img_' + id) || null;
      if (val && val.startsWith('data:image/svg+xml;utf8,<svg')) {
        val = svgToBase64(val.replace('data:image/svg+xml;utf8,', ''));
      }
      return val || SEED_IMAGE_MAP[id] || null;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(IMAGE_STORE, 'readonly');
      const store = tx.objectStore(IMAGE_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        let val = (req.result && req.result.dataUrl) || localStorage.getItem('ann_img_' + id) || null;
        if (val && val.startsWith('data:image/svg+xml;utf8,<svg')) {
          val = svgToBase64(val.replace('data:image/svg+xml;utf8,', ''));
        }
        resolve(val || SEED_IMAGE_MAP[id] || null);
      };
      req.onerror = () => {
        let val = localStorage.getItem('ann_img_' + id) || null;
        if (val && val.startsWith('data:image/svg+xml;utf8,<svg')) {
          val = svgToBase64(val.replace('data:image/svg+xml;utf8,', ''));
        }
        resolve(val || SEED_IMAGE_MAP[id] || null);
      };
    });
  }

  // Delete image from IndexedDB
  async function deleteImage(id) {
    const db = await openIDB();
    localStorage.removeItem('ann_img_' + id);
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(IMAGE_STORE, 'readwrite');
      const store = tx.objectStore(IMAGE_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  // Storage helper
  function readJSON(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Categories list
  const DEFAULT_CATEGORIES = [
    { id: 'cat-jewel', name: 'Jewelry & Accessories', icon: '💍', desc: 'Handcrafted earrings, kundan necklaces, bangles and festive jewelry' },
    { id: 'cat-textile', name: 'Handloom & Tailoring', icon: '🧵', desc: 'Custom stitching, hand-embroidered blouses, dupattas and cotton dresses' },
    { id: 'cat-food', name: 'Food & Bakery', icon: '🍲', desc: 'Authentic pickles, artisanal cookies, sweets and traditional snack batches' },
    { id: 'cat-decor', name: 'Home Decor & Crafts', icon: '🏺', desc: 'Terracotta pottery, hand-poured soy candles, macrame and brass decor' },
    { id: 'cat-beauty', name: 'Beauty & Wellness', icon: '💄', desc: 'Chemical-free herbal soaps, organic hair oils and Ayurvedic face ubtans' },
    { id: 'cat-gift', name: 'Handmade Gifting', icon: '🎁', desc: 'Curated gift hampers, festive gift packs and customized celebration boxes' },
    { id: 'cat-edu', name: 'Educational Guidance', icon: '📚', desc: 'Home tuition, child learning aids, creative workshops and mentoring' },
    { id: 'cat-organic', name: 'Eco-Living & Plants', icon: '🌿', desc: 'Indoor air-purifying plants, cloth shopping bags and eco-friendly home essentials' }
  ];

  // Seed default admin and sample businesses
  function seedDatabaseIfEmpty() {
    let users = readJSON('ann_users', null);
    if (!users || users.length === 0) {
      users = [
        {
          id: 'usr-admin-1',
          name: 'Platform Administrator',
          email: 'admin@aatmanirbharnari.in',
          phone: '+91 98765 00001',
          password: 'admin123',
          role: 'admin',
          createdAt: '2026-10-01T10:00:00Z'
        },
        {
          id: 'usr-seller-akshaya',
          name: 'Akshaya Reddy',
          email: 'pattiakshayareddy03@gmail.com',
          phone: '+91 98765 12345',
          password: 'password123',
          role: 'entrepreneur',
          createdAt: '2026-10-25T10:00:00Z'
        },
        {
          id: 'usr-seller-1',
          name: 'Meera Sharma',
          email: 'meera@sakhi.in',
          phone: '+91 98765 43210',
          password: 'seller123',
          role: 'entrepreneur',
          createdAt: '2026-10-15T09:30:00Z'
        },
        {
          id: 'usr-cust-1',
          name: 'Anita Desai',
          email: 'anita@example.com',
          phone: '+91 98765 99887',
          password: 'customer123',
          role: 'customer',
          city: 'Hyderabad',
          createdAt: '2026-10-20T14:15:00Z'
        }
      ];
      writeJSON('ann_users', users);
    }

    let categories = readJSON('ann_categories', null);
    if (!categories || categories.length === 0) {
      writeJSON('ann_categories', DEFAULT_CATEGORIES);
    }

    let businesses = readJSON('ann_businesses', null);
    if (!businesses || businesses.length === 0) {
      businesses = [
        {
          id: 'biz-akshaya',
          ownerId: 'usr-seller-akshaya',
          ownerName: 'Akshaya Reddy',
          name: 'Akshaya Handcrafted Jewels & Studio',
          category: 'Jewelry & Accessories',
          categoryId: 'cat-jewel',
          desc: 'Specializing in royal Kundan choker sets, bespoke pearl earrings, and festive Indian bridal jewelry handcrafted with love in Hyderabad.',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Banjara Hills',
          pincode: '500034',
          fullAddress: 'Plot 18, Road No. 12, Banjara Hills, Hyderabad',
          contactPhone: '+91 98765 12345',
          contactEmail: 'pattiakshayareddy03@gmail.com',
          operatingHours: '10:00 AM - 7:00 PM (Mon-Sat)',
          serviceArea: 'Hyderabad local courier and Pan-India express delivery',
          status: 'Approved',
          coverImageId: 'img-seed-biz-akshaya',
          logoImageId: null,
          submittedAt: '2026-10-25T11:00:00Z',
          reviewedAt: '2026-10-25T14:30:00Z',
          reviewNote: 'Verified artisan jewelry workshop. Approved for public directory.',
          productCount: 1
        },
        {
          id: 'biz-1',
          ownerId: 'usr-seller-1',
          ownerName: 'Meera Sharma',
          name: 'Sakhi Studio & Handcrafted Jewelry',
          category: 'Jewelry & Accessories',
          categoryId: 'cat-jewel',
          desc: 'Specializing in delicate handcrafted pearl jhumkas, brass chokers and festive earrings crafted lovingly by women artisans from home.',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Banjara Hills',
          pincode: '500034',
          fullAddress: 'Plot 42, Road No. 10, Banjara Hills, Hyderabad',
          contactPhone: '+91 98765 43210',
          contactEmail: 'meera@sakhi.in',
          operatingHours: '10:00 AM - 7:00 PM (Mon-Sat)',
          serviceArea: 'Hyderabad city-wide delivery & Pan-India courier',
          status: 'Approved',
          coverImageId: 'img-seed-biz-sakhi',
          logoImageId: null,
          submittedAt: '2026-10-16T11:00:00Z',
          reviewedAt: '2026-10-16T14:20:00Z',
          reviewNote: 'Profile and product documentation verified. Approved for public directory.',
          productCount: 3
        },
        {
          id: 'biz-2',
          ownerId: 'usr-seller-ananya',
          ownerName: 'Ananya Rao',
          name: 'Ananya Homemade Flavours',
          category: 'Food & Bakery',
          categoryId: 'cat-food',
          desc: 'Traditional sun-dried mango pickles, organic spiced flaxseed powders, and festive Andhra sweets prepared in small, hygienic batches.',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Kukatpally',
          pincode: '500072',
          fullAddress: 'Flat 302, Sri Sai Residency, KPHB Phase 3, Kukatpally, Hyderabad',
          contactPhone: '+91 94401 22334',
          contactEmail: 'ananya@homemadeflavours.in',
          operatingHours: '9:00 AM - 8:00 PM',
          serviceArea: 'Hyderabad & Secunderabad',
          status: 'Approved',
          coverImageId: 'img-seed-biz-ananya',
          logoImageId: null,
          submittedAt: '2026-10-18T10:00:00Z',
          reviewedAt: '2026-10-18T16:00:00Z',
          reviewNote: 'Verified homemade culinary practice. Approved.',
          productCount: 2
        },
        {
          id: 'biz-3',
          ownerId: 'usr-seller-kavya',
          ownerName: 'Kavya Reddy',
          name: 'Mitti & Clay Artisan Studio',
          category: 'Home Decor & Crafts',
          categoryId: 'cat-decor',
          desc: 'Eco-conscious terracotta planters, festive brass diyas and hand-carved pottery crafted using natural river clay.',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Sangareddy',
          locality: 'Patancheru',
          pincode: '502319',
          fullAddress: 'Artisans Enclave, Patancheru, Greater Hyderabad',
          contactPhone: '+91 91210 55667',
          contactEmail: 'kavya@mitticlay.in',
          operatingHours: '10:00 AM - 6:00 PM',
          serviceArea: 'Telangana & Andhra Pradesh',
          status: 'Approved',
          coverImageId: 'img-seed-biz-mitti',
          logoImageId: null,
          submittedAt: '2026-10-19T09:00:00Z',
          reviewedAt: '2026-10-19T13:45:00Z',
          reviewNote: 'Handmade pottery samples verified. Approved.',
          productCount: 2
        }
      ];
      writeJSON('ann_businesses', businesses);
    }

    let products = readJSON('ann_products', null);
    if (!products || products.length === 0) {
      products = [
        {
          id: 'prod-akshaya-1',
          businessId: 'biz-akshaya',
          businessName: 'Akshaya Handcrafted Jewels & Studio',
          name: 'Royal Kundan & Freshwater Pearl Choker Set',
          category: 'Jewelry & Accessories',
          price: 2450,
          discountPrice: 2999,
          description: 'Exquisite bridal and festive jewelry set handcrafted with lustrous freshwater pearls and fine Kundan stones on 22K gold matte brass.',
          condition: 'Handcrafted New',
          material: 'Brass base, 22K matte gold plating, natural freshwater pearls & kundan stones',
          color: 'Antique Gold & Cream Pearl',
          size: '14-inch choker with adjustable silk dori + matching 2.2-inch drop earrings',
          quantity: 6,
          availability: 'In Stock',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Banjara Hills',
          pincode: '500034',
          pickupAvailable: true,
          deliveryNotes: 'Dispatched in premium keepsake velvet presentation box within 24 hours.',
          imageIds: ['img-seed-jhumka', 'img-seed-necklace'],
          status: 'Published',
          createdAt: '2026-10-25T12:00:00Z'
        },
        {
          id: 'prod-101',
          businessId: 'biz-1',
          businessName: 'Sakhi Studio & Handcrafted Jewelry',
          name: 'Handcrafted Kundan & Pearl Jhumka Earrings',
          category: 'Jewelry & Accessories',
          price: 549,
          discountPrice: 699,
          description: 'Intricately designed traditional jhumkas adorned with natural white freshwater pearls and fine kundan stones. Lightweight and hypoallergenic, ideal for weddings and celebrations.',
          condition: 'Handcrafted New',
          material: 'Brass base, 22K gold matte plating, faux pearls & kundan stones',
          color: 'Antique Gold & Cream Pearl',
          size: '2.4 inches drop length',
          quantity: 12,
          availability: 'In Stock',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Banjara Hills',
          pincode: '500034',
          pickupAvailable: true,
          deliveryNotes: 'Same-day local delivery in Hyderabad; 3-4 days pan-India shipping.',
          imageIds: ['img-seed-jhumka'],
          status: 'Published',
          createdAt: '2026-10-16T12:00:00Z'
        },
        {
          id: 'prod-102',
          businessId: 'biz-1',
          businessName: 'Sakhi Studio & Handcrafted Jewelry',
          name: 'Floral Meenakari Drop Chandbali Earrings',
          category: 'Jewelry & Accessories',
          price: 499,
          discountPrice: 599,
          description: 'Pastel pink and white hand-enameled Meenakari Chandbalis surrounded by delicate pearl drops. Graceful aesthetic for both ethnic wear and contemporary fusion outfits.',
          condition: 'Handcrafted New',
          material: 'Hand-painted Meenakari enamel, brass, pearl seed beads',
          color: 'Blush Pink & Ivory',
          size: '2.0 inches width, 2.5 inches length',
          quantity: 8,
          availability: 'In Stock',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Banjara Hills',
          pincode: '500034',
          pickupAvailable: true,
          deliveryNotes: 'Securely packaged in keepsake fabric pouches.',
          imageIds: ['img-seed-chandbali'],
          status: 'Published',
          createdAt: '2026-10-16T12:30:00Z'
        },
        {
          id: 'prod-103',
          businessId: 'biz-1',
          businessName: 'Sakhi Studio & Handcrafted Jewelry',
          name: 'Hand-strung Baroque Pearl Choker Necklace',
          category: 'Jewelry & Accessories',
          price: 899,
          discountPrice: 1150,
          description: 'Contemporary minimal choker featuring iridescent baroque freshwater pearls with an adjustable braided silk dori tie-up.',
          condition: 'Handcrafted New',
          material: 'Treated freshwater baroque pearls, tarnish-resistant gold accents',
          color: 'Iridescent Pearl White',
          size: '14-inch strand + 4-inch adjustable extender dori',
          quantity: 5,
          availability: 'Made to Order',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Banjara Hills',
          pincode: '500034',
          pickupAvailable: true,
          deliveryNotes: 'Custom neck size adjustments available upon request.',
          imageIds: ['img-seed-necklace'],
          status: 'Published',
          createdAt: '2026-10-16T13:00:00Z'
        },
        {
          id: 'prod-201',
          businessId: 'biz-2',
          businessName: 'Ananya Homemade Flavours',
          name: 'Traditional Avakaya Mango Pickle (500g)',
          category: 'Food & Bakery',
          price: 290,
          discountPrice: 320,
          description: 'Authentic grandma recipe prepared using fresh raw sour mangoes, cold-pressed gingelly oil, and stone-ground spices. Zero artificial preservatives.',
          condition: 'Freshly Prepared',
          material: 'Sour mangoes, pure sesame oil, mustard seed powder, red chili',
          color: 'Rich Crimson',
          size: '500 grams reusable glass jar',
          quantity: 20,
          availability: 'In Stock',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Hyderabad',
          locality: 'Kukatpally',
          pincode: '500072',
          pickupAvailable: true,
          deliveryNotes: 'Delivery across Hyderabad within 24 hours.',
          imageIds: ['img-seed-pickle'],
          status: 'Published',
          createdAt: '2026-10-18T11:00:00Z'
        },
        {
          id: 'prod-301',
          businessId: 'biz-3',
          businessName: 'Mitti & Clay Artisan Studio',
          name: 'Hand-carved Terracotta Festive Diya Set (Pack of 4)',
          category: 'Home Decor & Crafts',
          price: 360,
          discountPrice: 420,
          description: 'Natural clay diyas hand-etched with botanical motifs, fired in wood kilns. Adds earthy warmth and grace to festive corners.',
          condition: 'Handmade New',
          material: 'Natural riverbed terracotta clay',
          color: 'Natural Terracotta Ochre',
          size: '3.5 inches diameter each',
          quantity: 15,
          availability: 'In Stock',
          state: 'Telangana',
          city: 'Hyderabad',
          district: 'Sangareddy',
          locality: 'Patancheru',
          pincode: '502319',
          pickupAvailable: true,
          deliveryNotes: 'Carefully wrapped with eco-friendly corrugated cushioning.',
          imageIds: ['img-seed-diya'],
          status: 'Published',
          createdAt: '2026-10-19T10:00:00Z'
        }
      ];
      writeJSON('ann_products', products);
    }

    let requests = readJSON('ann_requests', null);
    if (!requests) {
      requests = [
        {
          id: 'REQ-2026-1001',
          businessId: 'biz-1',
          businessName: 'Sakhi Studio & Handcrafted Jewelry',
          sellerUserId: 'usr-seller-1',
          productId: 'prod-101',
          productName: 'Handcrafted Kundan & Pearl Jhumka Earrings',
          productPrice: 549,
          customerName: 'Anita Desai',
          customerEmail: 'anita@example.com',
          customerPhone: '+91 98765 99887',
          quantity: 2,
          estimatedTotal: 1098,
          contactPreference: 'WhatsApp',
          fulfillmentPreference: 'Local Delivery',
          deliveryAddress: 'Flat 401, Sapphire Heights, Jubilee Hills, Hyderabad',
          message: 'Hi Meera, looking forward to wearing these for my sister’s mehendi function on Sunday. Can you confirm if delivery by Friday is possible?',
          status: 'Accepted',
          sellerNote: 'Accepted! Will package and dispatch tomorrow via local courier. Tracking shared on WhatsApp.',
          createdAt: '2026-10-21T15:30:00Z',
          updatedAt: '2026-10-21T17:00:00Z'
        }
      ];
      writeJSON('ann_requests', requests);
    }

    let enquiries = readJSON('ann_enquiries', null);
    if (!enquiries) {
      enquiries = [
        {
          id: 'ENQ-2026-501',
          businessId: 'biz-1',
          businessName: 'Sakhi Studio & Handcrafted Jewelry',
          name: 'Pooja Hegde',
          contact: '+91 97000 11223',
          email: 'pooja.h@example.com',
          message: 'Do you take custom orders for matching bridal bridesmaid earring sets in bulk (10 pairs)?',
          status: 'Responded',
          sellerReply: 'Yes Pooja, we customize colors and motifs for bridesmaid sets! Please message on WhatsApp to see color samples.',
          createdAt: '2026-10-22T11:00:00Z'
        }
      ];
      writeJSON('ann_enquiries', enquiries);
    }

    let reports = readJSON('ann_reports', null);
    if (!reports) {
      writeJSON('ann_reports', []);
    }

    let auditLog = readJSON('ann_audit_log', null);
    if (!auditLog) {
      auditLog = [
        {
          id: 'AUDIT-1',
          action: 'APPROVE_BUSINESS',
          businessId: 'biz-1',
          businessName: 'Sakhi Studio & Handcrafted Jewelry',
          adminName: 'Platform Administrator',
          reason: 'Initial profile and handcrafted jewelry catalog verified and approved.',
          timestamp: '2026-10-16T14:20:00Z'
        }
      ];
      writeJSON('ann_audit_log', auditLog);
    }

    let branding = readJSON('ann_branding', null);
    if (!branding) {
      branding = {
        logoDataUrl: null, // null means use default SVG silhouette
        brandName: 'Aatmanirbhar Nari',
        brandTagline: 'Empowering Women-Led Home Businesses',
        updatedAt: '2026-10-01T10:00:00Z'
      };
      writeJSON('ann_branding', branding);
    }
  }

  function getSeedImageSVG(type) {
    return SEED_IMAGE_MAP['img-seed-' + type] || SEED_IMAGE_MAP['img-seed-jhumka'];
  }

  // Populate seed images into IndexedDB and localStorage on initialization
  async function initSeedImages() {
    await openIDB();
    for (const [id, b64] of Object.entries(SEED_IMAGE_MAP)) {
      await saveImage(id, b64, { name: id + '.svg', type: 'image/svg+xml' });
      try {
        localStorage.setItem('ann_img_' + id, b64);
      } catch (e) {}
    }
  }

  // --- PUBLIC API METHODS ---

  return {
    init: async function () {
      seedDatabaseIfEmpty();
      await initSeedImages();
    },

    // Image Store
    saveImage,
    getImage,
    deleteImage,

    // Session Management
    getCurrentSession: function () {
      return readJSON('ann_active_session', null);
    },

    setSession: function (role, user) {
      writeJSON('ann_active_session', {
        role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          businessId: user.businessId || null
        },
        token: 'demo-token-' + Date.now()
      });
    },

    clearSession: function () {
      localStorage.removeItem('ann_active_session');
    },

    // Authentication
    login: function (role, identifier, password) {
      seedDatabaseIfEmpty();
      const users = readJSON('ann_users', []);
      const user = users.find(
        (u) =>
          u.role === role &&
          (u.email.toLowerCase() === identifier.trim().toLowerCase() || (u.phone && u.phone === identifier.trim()))
      );

      if (!user) {
        return { success: false, message: `No ${role} account found with that email or phone number.` };
      }

      if (user.password !== password.trim()) {
        return { success: false, message: 'Incorrect password. (Use the quick demo fill credentials to test).' };
      }

      // Link businessId if entrepreneur
      if (user.role === 'entrepreneur') {
        const businesses = readJSON('ann_businesses', []);
        const b = businesses.find((bx) => bx.ownerId === user.id);
        if (b) user.businessId = b.id;
      }

      this.setSession(role, user);
      return { success: true, role, user };
    },

    registerSeller: function (data) {
      seedDatabaseIfEmpty();
      const users = readJSON('ann_users', []);
      const existing = users.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
      if (existing) {
        if (existing.role === 'entrepreneur') {
          // Live demonstration resilience: update entrepreneur profile & business smoothly
          existing.name = data.fullName.trim();
          existing.phone = data.phone.trim();
          existing.password = data.password.trim();
          writeJSON('ann_users', users);

          const businesses = readJSON('ann_businesses', []);
          let b = businesses.find((bx) => bx.ownerId === existing.id || bx.contactEmail.toLowerCase() === data.email.trim().toLowerCase());
          if (b) {
            b.name = data.businessName.trim();
            b.category = data.category;
            b.desc = data.description.trim();
            b.state = data.state.trim();
            b.city = data.city.trim();
            b.locality = data.locality.trim();
            b.pincode = data.pincode.trim();
            b.status = data.isDraft ? 'Draft' : 'Pending Review';
            b.submittedAt = new Date().toISOString();
            writeJSON('ann_businesses', businesses);
          } else {
            const bizId = 'biz-' + Date.now();
            let regCoverId = 'img-seed-biz-akshaya';
            if (data.coverDataUrl) {
              regCoverId = 'img-cover-' + Date.now();
              saveImage(regCoverId, data.coverDataUrl, { name: 'cover.jpg' });
              try { localStorage.setItem('ann_img_' + regCoverId, data.coverDataUrl); } catch (e) {}
            }
            b = {
              id: bizId,
              ownerId: existing.id,
              ownerName: data.fullName.trim(),
              name: data.businessName.trim(),
              category: data.category,
              categoryId: 'cat-jewel',
              desc: data.description.trim(),
              state: data.state.trim(),
              city: data.city.trim(),
              district: data.city.trim(),
              locality: data.locality.trim(),
              pincode: data.pincode.trim(),
              fullAddress: data.fullAddress || `${data.locality}, ${data.city}`,
              contactPhone: data.phone.trim(),
              contactEmail: data.email.trim(),
              operatingHours: '10:00 AM - 7:00 PM',
              serviceArea: data.serviceArea || `${data.city} and surrounding areas`,
              status: data.isDraft ? 'Draft' : 'Pending Review',
              coverImageId: regCoverId,
              logoImageId: null,
              submittedAt: new Date().toISOString(),
              reviewedAt: null,
              reviewNote: null,
              productCount: 0
            };
            businesses.push(b);
            writeJSON('ann_businesses', businesses);
          }
          existing.businessId = b.id;
          this.setSession('entrepreneur', existing);
          return { success: true, user: existing, business: b, isUpdated: true };
        }
        return { success: false, message: 'An account with this email address already exists.' };
      }

      const userId = 'usr-seller-' + Date.now();
      const newUser = {
        id: userId,
        name: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password.trim(),
        role: 'entrepreneur',
        profileImageId: data.profileImageId || null,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      writeJSON('ann_users', users);

      // Create Business Profile
      const businesses = readJSON('ann_businesses', []);
      const businessId = 'biz-' + Date.now();
      let newCoverId = data.coverImageId || null;
      if (!newCoverId && data.coverDataUrl) {
        newCoverId = 'img-cover-' + Date.now();
        saveImage(newCoverId, data.coverDataUrl, { name: 'cover.jpg' });
        try { localStorage.setItem('ann_img_' + newCoverId, data.coverDataUrl); } catch (e) {}
      }
      if (!newCoverId) {
        if (data.category && data.category.includes('Jewelry')) newCoverId = 'img-seed-biz-akshaya';
        else if (data.category && data.category.includes('Food')) newCoverId = 'img-seed-biz-ananya';
        else newCoverId = 'img-seed-biz-mitti';
      }
      const newBusiness = {
        id: businessId,
        ownerId: userId,
        ownerName: data.fullName.trim(),
        name: data.businessName.trim(),
        category: data.category,
        categoryId: data.categoryId || 'cat-jewel',
        desc: data.description.trim(),
        state: data.state.trim(),
        city: data.city.trim(),
        district: data.district ? data.district.trim() : data.city.trim(),
        locality: data.locality.trim(),
        pincode: data.pincode.trim(),
        fullAddress: data.fullAddress ? data.fullAddress.trim() : `${data.locality}, ${data.city}`,
        contactPhone: data.businessPhone ? data.businessPhone.trim() : data.phone.trim(),
        contactEmail: data.email.trim(),
        operatingHours: data.operatingHours || '10:00 AM - 7:00 PM',
        serviceArea: data.serviceArea || `${data.city} and surrounding areas`,
        status: data.isDraft ? 'Draft' : 'Pending Review',
        coverImageId: newCoverId,
        logoImageId: data.logoImageId || null,
        submittedAt: data.isDraft ? null : new Date().toISOString(),
        reviewedAt: null,
        reviewNote: null,
        productCount: 0
      };
      businesses.push(newBusiness);
      writeJSON('ann_businesses', businesses);

      newUser.businessId = businessId;
      this.setSession('entrepreneur', newUser);
      return { success: true, user: newUser, business: newBusiness };
    },

    registerCustomer: function (data) {
      seedDatabaseIfEmpty();
      const users = readJSON('ann_users', []);
      const existing = users.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
      if (existing) {
        return { success: false, message: 'An account with this email address already exists.' };
      }

      const userId = 'usr-cust-' + Date.now();
      const newUser = {
        id: userId,
        name: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password.trim(),
        role: 'customer',
        city: data.city || '',
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      writeJSON('ann_users', users);

      this.setSession('customer', newUser);
      return { success: true, user: newUser };
    },

    // Businesses
    getAllBusinesses: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_businesses', []);
    },

    getApprovedBusinesses: function () {
      return this.getAllBusinesses().filter((b) => b.status === 'Approved');
    },

    getBusinessById: function (id) {
      return this.getAllBusinesses().find((b) => b.id === id);
    },

    getBusinessByOwnerId: function (ownerId) {
      return this.getAllBusinesses().find((b) => b.ownerId === ownerId);
    },

    saveBusiness: function (businessData) {
      const businesses = this.getAllBusinesses();
      const idx = businesses.findIndex((b) => b.id === businessData.id);
      if (idx !== -1) {
        businesses[idx] = { ...businesses[idx], ...businessData, updatedAt: new Date().toISOString() };
      } else {
        businesses.push(businessData);
      }
      writeJSON('ann_businesses', businesses);
      return businessData;
    },

    submitBusinessForReview: function (businessId) {
      const businesses = this.getAllBusinesses();
      const b = businesses.find((x) => x.id === businessId);
      if (b) {
        b.status = 'Pending Review';
        b.submittedAt = new Date().toISOString();
        b.reviewNote = null;
        writeJSON('ann_businesses', businesses);
        return { success: true, business: b };
      }
      return { success: false, message: 'Business not found' };
    },

    reviewBusiness: function (businessId, decision, reason, adminName = 'Platform Administrator') {
      const businesses = this.getAllBusinesses();
      const b = businesses.find((x) => x.id === businessId);
      if (!b) return { success: false, message: 'Business not found' };

      b.status = decision; // 'Approved', 'Rejected', 'Changes Requested', 'Suspended'
      b.reviewedAt = new Date().toISOString();
      b.reviewNote = reason || '';
      writeJSON('ann_businesses', businesses);

      // Audit Log
      const auditLog = readJSON('ann_audit_log', []);
      auditLog.unshift({
        id: 'AUDIT-' + Date.now(),
        action: `DECISION_${decision.toUpperCase()}`,
        businessId: b.id,
        businessName: b.name,
        adminName,
        reason: reason || 'Review processed by administrator',
        timestamp: new Date().toISOString()
      });
      writeJSON('ann_audit_log', auditLog);

      return { success: true, business: b };
    },

    // Products
    getAllProducts: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_products', []);
    },

    getApprovedProducts: function () {
      const approvedBizIds = new Set(this.getApprovedBusinesses().map((b) => b.id));
      return this.getAllProducts().filter((p) => approvedBizIds.has(p.businessId) && p.status === 'Published');
    },

    getProductsByBusinessId: function (businessId) {
      return this.getAllProducts().filter((p) => p.businessId === businessId);
    },

    getProductById: function (id) {
      return this.getAllProducts().find((p) => p.id === id);
    },

    saveProduct: function (productData) {
      const products = this.getAllProducts();
      let prod;
      const idx = products.findIndex((p) => p.id === productData.id);
      if (idx !== -1) {
        prod = { ...products[idx], ...productData, updatedAt: new Date().toISOString() };
        products[idx] = prod;
      } else {
        prod = {
          id: 'prod-' + Date.now(),
          ...productData,
          status: productData.status || 'Published',
          createdAt: new Date().toISOString()
        };
        products.unshift(prod);
      }
      writeJSON('ann_products', products);

      // Update business product count
      const businesses = this.getAllBusinesses();
      const biz = businesses.find((b) => b.id === prod.businessId);
      if (biz) {
        biz.productCount = products.filter((p) => p.businessId === biz.id).length;
        writeJSON('ann_businesses', businesses);
      }

      return prod;
    },

    deleteProduct: function (productId) {
      let products = this.getAllProducts();
      const p = products.find((x) => x.id === productId);
      if (!p) return false;
      const businessId = p.businessId;

      products = products.filter((x) => x.id !== productId);
      writeJSON('ann_products', products);

      const businesses = this.getAllBusinesses();
      const biz = businesses.find((b) => b.id === businessId);
      if (biz) {
        biz.productCount = products.filter((x) => x.businessId === biz.id).length;
        writeJSON('ann_businesses', businesses);
      }
      return true;
    },

    // Purchase Requests (Workflow: Customer places request -> Seller accepts/declines -> Customer tracks status)
    createPurchaseRequest: function (data) {
      seedDatabaseIfEmpty();
      const requests = readJSON('ann_requests', []);
      const refId = 'REQ-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

      const newRequest = {
        id: refId,
        businessId: data.businessId,
        businessName: data.businessName,
        sellerUserId: data.sellerUserId || null,
        productId: data.productId,
        productName: data.productName,
        productPrice: Number(data.productPrice) || 0,
        customerName: data.customerName.trim(),
        customerEmail: data.customerEmail.trim(),
        customerPhone: data.customerPhone.trim(),
        quantity: Number(data.quantity) || 1,
        estimatedTotal: (Number(data.productPrice) || 0) * (Number(data.quantity) || 1),
        contactPreference: data.contactPreference || 'WhatsApp',
        fulfillmentPreference: data.fulfillmentPreference || 'Local Delivery',
        deliveryAddress: data.deliveryAddress ? data.deliveryAddress.trim() : '',
        message: data.message ? data.message.trim() : '',
        status: 'New Request', // New Request, Viewed, Accepted, Declined, Awaiting Customer Response, Completed, Cancelled
        sellerNote: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      requests.unshift(newRequest);
      writeJSON('ann_requests', requests);
      return newRequest;
    },

    getRequestsForSeller: function (businessId) {
      seedDatabaseIfEmpty();
      const reqs = readJSON('ann_requests', []);
      return reqs.filter((r) => r.businessId === businessId);
    },

    getRequestsForCustomer: function (emailOrName) {
      seedDatabaseIfEmpty();
      const reqs = readJSON('ann_requests', []);
      const search = (emailOrName || '').toLowerCase().trim();
      return reqs.filter(
        (r) =>
          (r.customerEmail && r.customerEmail.toLowerCase() === search) ||
          (r.customerName && r.customerName.toLowerCase() === search)
      );
    },

    getAllRequests: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_requests', []);
    },

    updateRequestStatus: function (requestId, newStatus, sellerNote = '') {
      const requests = readJSON('ann_requests', []);
      const req = requests.find((r) => r.id === requestId);
      if (!req) return { success: false, message: 'Request not found' };

      req.status = newStatus;
      if (sellerNote) req.sellerNote = sellerNote;
      req.updatedAt = new Date().toISOString();
      writeJSON('ann_requests', requests);
      return { success: true, request: req };
    },

    // Enquiries
    createEnquiry: function (data) {
      seedDatabaseIfEmpty();
      const enquiries = readJSON('ann_enquiries', []);
      const newEnquiry = {
        id: 'ENQ-' + Date.now(),
        businessId: data.businessId,
        businessName: data.businessName,
        productId: data.productId || null,
        productName: data.productName || null,
        name: data.name.trim(),
        contact: data.contact.trim(),
        email: data.email ? data.email.trim() : (data.contact.includes('@') ? data.contact.trim() : ''),
        message: data.message.trim(),
        status: 'Submitted', // Submitted, Viewed, Responded, Closed
        sellerReply: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      enquiries.unshift(newEnquiry);
      writeJSON('ann_enquiries', enquiries);
      return newEnquiry;
    },

    getEnquiriesForBusiness: function (businessId) {
      seedDatabaseIfEmpty();
      return readJSON('ann_enquiries', []).filter((e) => e.businessId === businessId);
    },

    getEnquiriesForCustomer: function (contactOrEmail) {
      seedDatabaseIfEmpty();
      const search = (contactOrEmail || '').toLowerCase().trim();
      return readJSON('ann_enquiries', []).filter(
        (e) =>
          (e.email && e.email.toLowerCase() === search) ||
          (e.contact && e.contact.toLowerCase().includes(search)) ||
          (e.name && e.name.toLowerCase() === search)
      );
    },

    getAllEnquiries: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_enquiries', []);
    },

    updateEnquiryReply: function (enquiryId, replyText) {
      const enquiries = readJSON('ann_enquiries', []);
      const enq = enquiries.find((e) => e.id === enquiryId);
      if (!enq) return false;
      enq.sellerReply = replyText;
      enq.status = 'Responded';
      enq.updatedAt = new Date().toISOString();
      writeJSON('ann_enquiries', enquiries);
      return true;
    },

    // Reports / Complaints
    createReport: function (data) {
      seedDatabaseIfEmpty();
      const reports = readJSON('ann_reports', []);
      const newReport = {
        id: 'REP-' + Date.now(),
        businessId: data.businessId,
        businessName: data.businessName,
        productId: data.productId || null,
        productName: data.productName || null,
        reason: data.reason,
        description: data.description.trim(),
        reporterContact: data.reporterContact ? data.reporterContact.trim() : 'Anonymous',
        status: 'Pending Review', // Pending Review, Investigated, Dismissed, Resolved
        actionTaken: '',
        createdAt: new Date().toISOString()
      };
      reports.unshift(newReport);
      writeJSON('ann_reports', reports);
      return newReport;
    },

    getAllReports: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_reports', []);
    },

    updateReportStatus: function (reportId, status, actionTaken = '') {
      const reports = readJSON('ann_reports', []);
      const r = reports.find((x) => x.id === reportId);
      if (!r) return false;
      r.status = status;
      if (actionTaken) r.actionTaken = actionTaken;
      r.updatedAt = new Date().toISOString();
      writeJSON('ann_reports', reports);
      return true;
    },

    // Categories
    getCategories: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_categories', DEFAULT_CATEGORIES);
    },

    addCategory: function (name, icon, desc) {
      const cats = this.getCategories();
      const id = 'cat-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newCat = { id, name: name.trim(), icon: icon || '✨', desc: desc || '' };
      cats.push(newCat);
      writeJSON('ann_categories', cats);
      return newCat;
    },

    // Audit Log
    getAuditLog: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_audit_log', []);
    },

    // Branding & Logo
    getBranding: function () {
      seedDatabaseIfEmpty();
      return readJSON('ann_branding', {
        logoDataUrl: null,
        brandName: 'Aatmanirbhar Nari',
        brandTagline: 'Empowering Women-Led Home Businesses'
      });
    },

    saveBranding: function (settings) {
      const branding = { ...this.getBranding(), ...settings, updatedAt: new Date().toISOString() };
      writeJSON('ann_branding', branding);
      return branding;
    },

    resetBranding: function () {
      const branding = {
        logoDataUrl: null,
        brandName: 'Aatmanirbhar Nari',
        brandTagline: 'Empowering Women-Led Home Businesses',
        updatedAt: new Date().toISOString()
      };
      writeJSON('ann_branding', branding);
      return branding;
    },

    // Favourites for Customer
    getFavourites: function () {
      return readJSON('ann_customer_favs', []);
    },

    toggleFavourite: function (businessId) {
      let favs = this.getFavourites();
      if (favs.includes(businessId)) {
        favs = favs.filter((id) => id !== businessId);
      } else {
        favs.push(businessId);
      }
      writeJSON('ann_customer_favs', favs);
      return favs;
    }
  };
})();
