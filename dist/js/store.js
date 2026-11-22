/* FREZZE Store — Progressive Enhancement E-Commerce JS */
(() => {
  const CART_KEY = 'frezze_cart_v1';
  const FREE_SHIPPING = 6000;
  const SHIPPING_COST = 180;

  const fmt = (n) => new Intl.NumberFormat('pl-PL').format(Math.round(n)) + ' zł';

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCartUI();
  }

  function addToCart(item) {
    const cart = loadCart();
    const key = `${item.sku}::${item.finish || 'Noce Canaletto'}`;
    const existing = cart.find((x) => x.key === key);
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      cart.push({ ...item, key, qty: item.qty || 1 });
    }
    saveCart(cart);
    openDrawer();
  }

  function updateQty(key, delta) {
    let cart = loadCart();
    const item = cart.find((x) => x.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((x) => x.key !== key);
    saveCart(cart);
  }

  function openDrawer() {
    document.getElementById('fz-cart-backdrop')?.classList.add('is-open');
    document.getElementById('fz-cart-drawer')?.classList.add('is-open');
  }

  function closeDrawer() {
    document.getElementById('fz-cart-backdrop')?.classList.remove('is-open');
    document.getElementById('fz-cart-drawer')?.classList.remove('is-open');
  }

  function calcTotals(cart) {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const onlySamples = cart.length > 0 && cart.every((i) => i.sku === 'FZ-CMP-01');
    const shipping = cart.length === 0 ? 0 : (onlySamples || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST);
    return { subtotal, shipping, total: subtotal + shipping, count: cart.reduce((s, i) => s + i.qty, 0) };
  }

  function renderCartUI() {
    const cart = loadCart();
    const totals = calcTotals(cart);

    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(totals.count);
    });

    const drawerBody = document.getElementById('fz-drawer-items');
    const drawerSubtotal = document.getElementById('fz-drawer-subtotal');
    if (drawerBody) {
      if (!cart.length) {
        drawerBody.innerHTML = '<p style="color:var(--fz-ink-muted);margin-top:16px;">Koszyk jest pusty. Wybierz panele ze sklepu lub zamów zestaw próbek Noce Canaletto.</p>';
      } else {
        drawerBody.innerHTML = cart.map((item) => `
          <div class="fz-cart-item">
            <img src="${item.image}" alt="${item.name}" width="72" height="56">
            <div>
              <strong style="font-family:var(--fz-display);font-size:16px;display:block;">${item.name}</strong>
              <span class="fz-mono">${item.sku} · ${item.finish || 'Noce Canaletto'}</span>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                <span>${fmt(item.price * item.qty)}</span>
                <div style="display:inline-flex;gap:6px;align-items:center;">
                  <button type="button" class="fz-pill" data-qty-key="${item.key}" data-qty-delta="-1" aria-label="Zmniejsz ilość">−</button>
                  <span style="min-width:20px;text-align:center;">${item.qty}</span>
                  <button type="button" class="fz-pill" data-qty-key="${item.key}" data-qty-delta="1" aria-label="Zwiększ ilość">+</button>
                </div>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
    if (drawerSubtotal) {
      drawerSubtotal.textContent = fmt(totals.total);
    }

    // Full Cart Page
    const pageCart = document.getElementById('fz-cart-page-items');
    if (pageCart) {
      if (!cart.length) {
        pageCart.innerHTML = '<p>Twój koszyk jest pusty. <a href="/Stronapanele/sklep/" style="text-decoration:underline;color:var(--fz-ottone);">Przejdź do sklepu z panelami →</a></p>';
      } else {
        pageCart.innerHTML = cart.map((item) => `
          <div class="fz-cart-item">
            <img src="${item.image}" alt="${item.name}" width="72" height="56">
            <div>
              <strong style="font-family:var(--fz-display);font-size:18px;">${item.name}</strong>
              <div class="fz-mono">${item.sku} · ${item.finish || 'Noce Canaletto'} · ${fmt(item.price)} / szt.</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                <strong>${fmt(item.price * item.qty)}</strong>
                <div style="display:inline-flex;gap:6px;align-items:center;">
                  <button type="button" class="fz-pill" data-qty-key="${item.key}" data-qty-delta="-1">−</button>
                  <span>${item.qty}</span>
                  <button type="button" class="fz-pill" data-qty-key="${item.key}" data-qty-delta="1">+</button>
                </div>
              </div>
            </div>
          </div>
        `).join('');
      }
      const subEl = document.getElementById('fz-page-subtotal');
      const shipEl = document.getElementById('fz-page-shipping');
      const totEl = document.getElementById('fz-page-total');
      if (subEl) subEl.textContent = fmt(totals.subtotal);
      if (shipEl) shipEl.textContent = totals.shipping === 0 ? 'Gratis (0 zł)' : fmt(totals.shipping);
      if (totEl) totEl.textContent = fmt(totals.total);
    }
  }

  // Event delegation
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add-cart]');
    if (addBtn) {
      const qtyInput = document.getElementById('fz-pdp-qty');
      const qty = addBtn.dataset.usePdpQty && qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      const activeFinishBtn = document.querySelector('.fz-finish-option.is-active');
      const finishName = activeFinishBtn ? activeFinishBtn.dataset.finishName : 'Noce Canaletto';
      const priceDelta = activeFinishBtn ? parseInt(activeFinishBtn.dataset.finishDelta || '0', 10) : 0;
      const basePrice = parseInt(addBtn.dataset.price, 10);
      addToCart({
        sku: addBtn.dataset.sku,
        name: addBtn.dataset.name,
        price: basePrice + (addBtn.dataset.usePdpQty ? priceDelta : 0),
        image: addBtn.dataset.image,
        finish: finishName,
        qty
      });
      return;
    }

    const qtyBtn = e.target.closest('[data-qty-key]');
    if (qtyBtn) {
      updateQty(qtyBtn.dataset.qtyKey, parseInt(qtyBtn.dataset.qtyDelta, 10));
      return;
    }

    if (e.target.closest('[data-open-cart]')) { openDrawer(); return; }
    if (e.target.closest('[data-close-cart]') || e.target.id === 'fz-cart-backdrop') { closeDrawer(); return; }

    // Mobile menu
    if (e.target.closest('[data-menu-toggle]')) {
      document.getElementById('fz-main-nav')?.classList.toggle('is-open');
      return;
    }

    // PDP Gallery thumbs
    const thumb = e.target.closest('.fz-pdp__thumb');
    if (thumb) {
      const mainImg = document.getElementById('fz-pdp-main-img');
      if (mainImg) mainImg.src = thumb.dataset.src;
      document.querySelectorAll('.fz-pdp__thumb').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      return;
    }

    // PDP Finish picker
    const finishBtn = e.target.closest('.fz-finish-option');
    if (finishBtn) {
      document.querySelectorAll('.fz-finish-option').forEach((b) => b.classList.remove('is-active'));
      finishBtn.classList.add('is-active');
      updatePdpCalc();
      return;
    }

    // Shop collection filter pills
    const filterPill = e.target.closest('[data-filter-collection]');
    if (filterPill) {
      document.querySelectorAll('[data-filter-collection]').forEach((p) => p.classList.remove('is-active'));
      filterPill.classList.add('is-active');
      applyShopFilters();
    }
  });

  // PDP Wall Area Calculator
  function updatePdpCalc() {
    const calc = document.getElementById('fz-wall-calc');
    if (!calc) return;
    const basePrice = parseInt(calc.dataset.basePrice, 10);
    const panelArea = parseFloat(calc.dataset.panelArea);
    const activeFinish = document.querySelector('.fz-finish-option.is-active');
    const delta = activeFinish ? parseInt(activeFinish.dataset.finishDelta || '0', 10) : 0;
    const unitPrice = basePrice + delta;

    const priceDisplay = document.getElementById('fz-pdp-unit-price');
    const m2Display = document.getElementById('fz-pdp-m2-price');
    if (priceDisplay) priceDisplay.textContent = fmt(unitPrice);
    if (m2Display) m2Display.textContent = fmt(unitPrice / panelArea) + ' / m²';

    const w = parseFloat(document.getElementById('fz-wall-w')?.value || '3.6');
    const h = parseFloat(document.getElementById('fz-wall-h')?.value || '2.6');
    const wallArea = Math.max(0.5, w * h);
    const panelsNeeded = Math.max(1, Math.ceil((wallArea * 1.1) / panelArea));
    const totalCost = panelsNeeded * unitPrice;

    const resEl = document.getElementById('fz-calc-output');
    if (resEl) {
      resEl.innerHTML = `<span>Ściana <strong>${wallArea.toFixed(1)} m²</strong> (+10% zapas) → <strong>${panelsNeeded} szt.</strong></span><strong>${fmt(totalCost)}</strong>`;
    }
    const qtyInput = document.getElementById('fz-pdp-qty');
    if (qtyInput && calc.dataset.syncQty === 'true') {
      qtyInput.value = String(panelsNeeded);
    }
  }

  ['fz-wall-w', 'fz-wall-h'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      const calc = document.getElementById('fz-wall-calc');
      if (calc) calc.dataset.syncQty = 'true';
      updatePdpCalc();
    });
  });

  // Shop filtering & search
  function applyShopFilters() {
    const grid = document.getElementById('fz-shop-grid');
    if (!grid) return;
    const activeCol = document.querySelector('[data-filter-collection].is-active')?.dataset.filterCollection || 'all';
    const q = (document.getElementById('fz-shop-search')?.value || '').trim().toLowerCase();
    const sortVal = document.getElementById('fz-shop-sort')?.value || 'featured';
    const cards = Array.from(grid.querySelectorAll('.fz-product-card'));

    let visible = 0;
    cards.forEach((card) => {
      const matchCol = activeCol === 'all' || card.dataset.collection === activeCol;
      const matchQ = !q || card.dataset.search.toLowerCase().includes(q);
      const show = matchCol && matchQ;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (sortVal === 'price-asc') {
      cards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    } else if (sortVal === 'price-desc') {
      cards.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    }
    cards.forEach((c) => grid.appendChild(c));

    const countEl = document.getElementById('fz-shop-count');
    if (countEl) countEl.textContent = `Wyświetlono ${visible} z ${cards.length} modeli`;
  }

  document.getElementById('fz-shop-search')?.addEventListener('input', applyShopFilters);
  document.getElementById('fz-shop-sort')?.addEventListener('change', applyShopFilters);

  // Read ?q= on /sklep/ (from WebSite SearchAction)
  const urlQ = new URLSearchParams(window.location.search).get('q');
  const searchInput = document.getElementById('fz-shop-search');
  if (urlQ && searchInput) {
    searchInput.value = urlQ;
    applyShopFilters();
  }

  // Forms (checkout / contact)
  document.querySelectorAll('form[data-fz-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = form.querySelector('[data-form-status]');
      if (msg) {
        msg.hidden = false;
        msg.textContent = form.dataset.successMsg || 'Dziękujemy! Twoje zgłoszenie zostało przyjęte. Odpowiemy w ciągu 24h.';
      }
      if (form.dataset.clearCart === 'true') {
        saveCart([]);
      }
      form.reset();
    });
  });

  renderCartUI();
  updatePdpCalc();
})();
