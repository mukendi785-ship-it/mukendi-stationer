(function () {
  'use strict';

  const LS_PRODUCTS = 'cs_products_v1';
  const LS_SALES = 'cs_sales_v1';
  const CURRENCY = 'KSh';

  const state = {
    products: [],
    sales: [],
    cart: [],
    salesFilter: { from: null, to: null },
  };

  // ---------- Storage ----------
  function load() {
    try {
      state.products = JSON.parse(localStorage.getItem(LS_PRODUCTS) || '[]');
      state.sales = JSON.parse(localStorage.getItem(LS_SALES) || '[]');
    } catch (e) {
      state.products = [];
      state.sales = [];
    }
    if (state.products.length === 0) seedProducts();
  }
  function saveProducts() { localStorage.setItem(LS_PRODUCTS, JSON.stringify(state.products)); }
  function saveSales() { localStorage.setItem(LS_SALES, JSON.stringify(state.sales)); }

  function seedProducts() {
    state.products = [
      { id: uid(), name: 'Shati la Ofisi', category: 'Shati', size: 'M', color: 'Bluu', price: 1200, cost: 700, stock: 15 },
      { id: uid(), name: 'Shati la Ofisi', category: 'Shati', size: 'L', color: 'Nyeupe', price: 1200, cost: 700, stock: 10 },
      { id: uid(), name: 'Jeans', category: 'Suruali', size: '32', color: 'Bluu', price: 1800, cost: 1100, stock: 8 },
      { id: uid(), name: 'Jeans', category: 'Suruali', size: '34', color: 'Nyeusi', price: 1800, cost: 1100, stock: 6 },
      { id: uid(), name: 'Gauni la Rasmi', category: 'Gauni', size: 'M', color: 'Nyekundu', price: 2500, cost: 1400, stock: 5 },
      { id: uid(), name: 'T-Shirt', category: 'Shati', size: 'L', color: 'Kijani', price: 600, cost: 300, stock: 25 },
      { id: uid(), name: 'Koti la Baridi', category: 'Koti', size: 'XL', color: 'Kahawia', price: 3500, cost: 2000, stock: 4 },
      { id: uid(), name: 'Sketi', category: 'Sketi', size: 'S', color: 'Nyeusi', price: 1400, cost: 800, stock: 12 },
    ];
    saveProducts();
  }

  // ---------- Helpers ----------
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function money(n) { return CURRENCY + ' ' + Number(n || 0).toLocaleString('en-KE'); }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function toast(msg, type) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    setTimeout(() => t.classList.add('hidden'), 2200);
  }

  // ---------- Tabs ----------
  function initTabs() {
    $all('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $all('.tab').forEach(b => b.classList.remove('active'));
        $all('.panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        $('#' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'reports') renderReports();
        if (btn.dataset.tab === 'sales') renderSales();
        if (btn.dataset.tab === 'products') renderProducts();
      });
    });
  }

  // ---------- POS ----------
  function renderPOSProducts() {
    const q = ($('#posSearch').value || '').trim().toLowerCase();
    const cat = $('#posCategory').value;
    const wrap = $('#posProducts');
    wrap.innerHTML = '';

    const filtered = state.products.filter(p => {
      if (cat && p.category !== cat) return false;
      if (!q) return true;
      return (p.name + ' ' + p.category + ' ' + p.size + ' ' + p.color).toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      wrap.innerHTML = '<p style="color:var(--muted);padding:20px;grid-column:1/-1;text-align:center;">Hakuna bidhaa zinazolingana.</p>';
      return;
    }

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card' + (p.stock <= 0 ? ' out' : '');
      const stockClass = p.stock <= 0 ? 'zero' : (p.stock < 5 ? 'low' : '');
      card.innerHTML = `
        <div class="name">${escape(p.name)}</div>
        <div class="meta">${escape(p.category)} &middot; ${escape(p.size || '-')} &middot; ${escape(p.color || '-')}</div>
        <div class="price">${money(p.price)}</div>
        <div class="stock ${stockClass}">Stoo: ${p.stock}</div>
      `;
      if (p.stock > 0) card.addEventListener('click', () => addToCart(p.id));
      wrap.appendChild(card);
    });
  }

  function refreshCategoryOptions() {
    const cats = Array.from(new Set(state.products.map(p => p.category).filter(Boolean))).sort();
    const posSel = $('#posCategory');
    const current = posSel.value;
    posSel.innerHTML = '<option value="">Aina zote</option>' + cats.map(c => `<option value="${escape(c)}">${escape(c)}</option>`).join('');
    posSel.value = current;
    $('#categoryList').innerHTML = cats.map(c => `<option value="${escape(c)}"></option>`).join('');
  }

  function addToCart(pid) {
    const p = state.products.find(x => x.id === pid);
    if (!p || p.stock <= 0) return;
    const existing = state.cart.find(ci => ci.id === pid);
    if (existing) {
      if (existing.qty + 1 > p.stock) {
        toast('Stoo haitoshi', 'error');
        return;
      }
      existing.qty += 1;
    } else {
      state.cart.push({ id: p.id, name: p.name, size: p.size, color: p.color, price: p.price, cost: p.cost, qty: 1 });
    }
    renderCart();
  }

  function renderCart() {
    const wrap = $('#cartItems');
    wrap.innerHTML = '';
    if (state.cart.length === 0) {
      wrap.innerHTML = '<p style="color:var(--muted);padding:10px;text-align:center;">Kikapu ni tupu</p>';
    }
    state.cart.forEach(ci => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <div class="name">${escape(ci.name)}</div>
          <div class="meta">${escape(ci.size || '-')} / ${escape(ci.color || '-')} &middot; ${money(ci.price)}</div>
        </div>
        <div class="qty">
          <button type="button" data-act="dec" data-id="${ci.id}">&minus;</button>
          <input type="number" min="1" value="${ci.qty}" data-id="${ci.id}" />
          <button type="button" data-act="inc" data-id="${ci.id}">+</button>
        </div>
        <button class="remove" data-act="del" data-id="${ci.id}" title="Ondoa">&times;</button>
      `;
      wrap.appendChild(row);
    });

    wrap.querySelectorAll('button[data-act]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const act = b.dataset.act;
        const ci = state.cart.find(c => c.id === id);
        if (!ci) return;
        const prod = state.products.find(p => p.id === id);
        if (act === 'inc') {
          if (prod && ci.qty + 1 > prod.stock) return toast('Stoo haitoshi', 'error');
          ci.qty += 1;
        } else if (act === 'dec') {
          ci.qty = Math.max(1, ci.qty - 1);
        } else if (act === 'del') {
          state.cart = state.cart.filter(c => c.id !== id);
        }
        renderCart();
      });
    });
    wrap.querySelectorAll('input[type="number"][data-id]').forEach(inp => {
      inp.addEventListener('change', () => {
        const id = inp.dataset.id;
        const ci = state.cart.find(c => c.id === id);
        const prod = state.products.find(p => p.id === id);
        if (!ci) return;
        let v = parseInt(inp.value, 10) || 1;
        if (v < 1) v = 1;
        if (prod && v > prod.stock) { v = prod.stock; toast('Imewekwa kiwango cha juu cha stoo', 'error'); }
        ci.qty = v;
        renderCart();
      });
    });

    updateTotals();
  }

  function updateTotals() {
    const subtotal = state.cart.reduce((s, ci) => s + ci.price * ci.qty, 0);
    const disc = Math.min(100, Math.max(0, parseFloat($('#discount').value) || 0));
    const total = Math.round(subtotal * (1 - disc / 100));
    $('#subTotal').textContent = money(subtotal);
    $('#grandTotal').textContent = money(total);
  }

  function checkout() {
    if (state.cart.length === 0) return toast('Kikapu ni tupu', 'error');
    for (const ci of state.cart) {
      const p = state.products.find(x => x.id === ci.id);
      if (!p || p.stock < ci.qty) return toast('Stoo haitoshi kwa ' + ci.name, 'error');
    }
    const subtotal = state.cart.reduce((s, ci) => s + ci.price * ci.qty, 0);
    const disc = Math.min(100, Math.max(0, parseFloat($('#discount').value) || 0));
    const total = Math.round(subtotal * (1 - disc / 100));

    const sale = {
      id: uid(),
      receipt: 'R-' + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      customer: $('#customer').value.trim() || '',
      payMethod: $('#payMethod').value,
      discount: disc,
      subtotal,
      total,
      items: state.cart.map(ci => ({ id: ci.id, name: ci.name, size: ci.size, color: ci.color, price: ci.price, cost: ci.cost, qty: ci.qty })),
    };

    state.cart.forEach(ci => {
      const p = state.products.find(x => x.id === ci.id);
      if (p) p.stock -= ci.qty;
    });
    state.sales.unshift(sale);
    saveProducts(); saveSales();

    showReceipt(sale);

    state.cart = [];
    $('#discount').value = 0;
    $('#customer').value = '';
    renderCart();
    renderPOSProducts();
    toast('Mauzo yamehifadhiwa', 'success');
  }

  function showReceipt(sale) {
    const el = $('#receipt');
    const dt = new Date(sale.date);
    const lines = sale.items.map(i => `
      <div class="r-item"><span>${escape(i.name)} ${escape(i.size || '')} ${escape(i.color || '')} &times;${i.qty}</span><span>${money(i.price * i.qty)}</span></div>
    `).join('');
    el.innerHTML = `
      <h4>DUKA LA NGUO</h4>
      <div style="text-align:center;font-size:12px;">Risiti ya Mauzo</div>
      <div class="line"></div>
      <div class="r-row"><span>Risiti:</span><span>${escape(sale.receipt)}</span></div>
      <div class="r-row"><span>Tarehe:</span><span>${dt.toLocaleString('sw-KE')}</span></div>
      ${sale.customer ? `<div class="r-row"><span>Mteja:</span><span>${escape(sale.customer)}</span></div>` : ''}
      <div class="line"></div>
      ${lines}
      <div class="line"></div>
      <div class="r-row"><span>Jumla ndogo</span><span>${money(sale.subtotal)}</span></div>
      ${sale.discount ? `<div class="r-row"><span>Punguzo (${sale.discount}%)</span><span>-${money(sale.subtotal - sale.total)}</span></div>` : ''}
      <div class="r-row" style="font-weight:700;font-size:14px;"><span>JUMLA</span><span>${money(sale.total)}</span></div>
      <div class="r-row"><span>Malipo:</span><span>${escape(sale.payMethod)}</span></div>
      <div class="line"></div>
      <div style="text-align:center;font-size:11px;">Asante kwa kununua kwetu!</div>
    `;
    $('#receiptModal').classList.remove('hidden');
  }

  // ---------- Products CRUD ----------
  function renderProducts() {
    const q = ($('#prodSearch').value || '').trim().toLowerCase();
    const body = $('#productsBody');
    body.innerHTML = '';
    const filtered = state.products.filter(p => !q || (p.name + ' ' + p.category + ' ' + p.size + ' ' + p.color).toLowerCase().includes(q));
    if (filtered.length === 0) {
      body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);">Hakuna bidhaa.</td></tr>';
      return;
    }
    filtered.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escape(p.name)}</td>
        <td>${escape(p.category)}</td>
        <td>${escape(p.size || '-')}</td>
        <td>${escape(p.color || '-')}</td>
        <td>${money(p.price)}</td>
        <td>${money(p.cost)}</td>
        <td style="${p.stock < 5 ? 'color:var(--warn);font-weight:600;' : ''}${p.stock === 0 ? 'color:var(--danger);' : ''}">${p.stock}</td>
        <td class="row-actions">
          <button class="btn sm" data-edit="${p.id}">Hariri</button>
          <button class="btn sm danger" data-del="${p.id}">Futa</button>
        </td>
      `;
      body.appendChild(tr);
    });
    body.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openProductModal(b.dataset.edit)));
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteProduct(b.dataset.del)));
  }

  function openProductModal(id) {
    const p = id ? state.products.find(x => x.id === id) : null;
    $('#modalTitle').textContent = p ? 'Hariri Bidhaa' : 'Ongeza Bidhaa';
    $('#pId').value = p ? p.id : '';
    $('#pName').value = p ? p.name : '';
    $('#pCategory').value = p ? p.category : '';
    $('#pSize').value = p ? (p.size || '') : '';
    $('#pColor').value = p ? (p.color || '') : '';
    $('#pPrice').value = p ? p.price : '';
    $('#pCost').value = p ? p.cost : 0;
    $('#pStock').value = p ? p.stock : 0;
    $('#productModal').classList.remove('hidden');
    $('#pName').focus();
  }

  function saveProductForm(e) {
    e.preventDefault();
    const id = $('#pId').value;
    const data = {
      name: $('#pName').value.trim(),
      category: $('#pCategory').value.trim(),
      size: $('#pSize').value.trim(),
      color: $('#pColor').value.trim(),
      price: Math.max(0, parseInt($('#pPrice').value, 10) || 0),
      cost: Math.max(0, parseInt($('#pCost').value, 10) || 0),
      stock: Math.max(0, parseInt($('#pStock').value, 10) || 0),
    };
    if (!data.name || !data.category) return toast('Jaza jina na aina', 'error');
    if (id) {
      const p = state.products.find(x => x.id === id);
      Object.assign(p, data);
    } else {
      state.products.push(Object.assign({ id: uid() }, data));
    }
    saveProducts();
    $('#productModal').classList.add('hidden');
    refreshCategoryOptions();
    renderProducts();
    renderPOSProducts();
    toast('Bidhaa imehifadhiwa', 'success');
  }

  function deleteProduct(id) {
    if (!confirm('Uhakika unataka kufuta bidhaa hii?')) return;
    state.products = state.products.filter(p => p.id !== id);
    state.cart = state.cart.filter(c => c.id !== id);
    saveProducts();
    refreshCategoryOptions();
    renderProducts();
    renderPOSProducts();
    renderCart();
    toast('Bidhaa imefutwa', 'success');
  }

  // ---------- Sales History ----------
  function renderSales() {
    const body = $('#salesBody');
    body.innerHTML = '';
    let list = state.sales.slice();
    const { from, to } = state.salesFilter;
    if (from) list = list.filter(s => s.date.slice(0, 10) >= from);
    if (to) list = list.filter(s => s.date.slice(0, 10) <= to);
    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);">Hakuna mauzo.</td></tr>';
      return;
    }
    list.forEach(s => {
      const dt = new Date(s.date);
      const itemSummary = s.items.map(i => `${i.name} &times;${i.qty}`).join(', ');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dt.toLocaleString('sw-KE')}</td>
        <td>${escape(s.receipt)}</td>
        <td>${escape(s.customer || '-')}</td>
        <td style="max-width:280px;">${itemSummary}</td>
        <td>${escape(s.payMethod)}</td>
        <td><strong>${money(s.total)}</strong></td>
        <td class="row-actions">
          <button class="btn sm" data-view="${s.id}">Ona Risiti</button>
          <button class="btn sm danger" data-void="${s.id}">Batili</button>
        </td>
      `;
      body.appendChild(tr);
    });
    body.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      const s = state.sales.find(x => x.id === b.dataset.view);
      if (s) showReceipt(s);
    }));
    body.querySelectorAll('[data-void]').forEach(b => b.addEventListener('click', () => voidSale(b.dataset.void)));
  }

  function voidSale(id) {
    if (!confirm('Ubatilishe mauzo haya? Stoo itarudishwa.')) return;
    const s = state.sales.find(x => x.id === id);
    if (!s) return;
    s.items.forEach(i => {
      const p = state.products.find(pp => pp.id === i.id);
      if (p) p.stock += i.qty;
    });
    state.sales = state.sales.filter(x => x.id !== id);
    saveProducts(); saveSales();
    renderSales(); renderPOSProducts();
    toast('Mauzo yamebatilishwa', 'success');
  }

  // ---------- Reports ----------
  function renderReports() {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startWeek = startToday - 6 * 24 * 3600 * 1000;
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let today = 0, week = 0, month = 0, profit = 0;
    const perProduct = {};
    state.sales.forEach(s => {
      const t = new Date(s.date).getTime();
      if (t >= startToday) today += s.total;
      if (t >= startWeek) week += s.total;
      if (t >= startMonth) month += s.total;
      s.items.forEach(i => {
        profit += (i.price - (i.cost || 0)) * i.qty * (1 - (s.discount || 0) / 100);
        const key = i.id;
        if (!perProduct[key]) perProduct[key] = { name: i.name + ' ' + (i.size || '') + ' ' + (i.color || ''), qty: 0, revenue: 0 };
        perProduct[key].qty += i.qty;
        perProduct[key].revenue += i.price * i.qty * (1 - (s.discount || 0) / 100);
      });
    });

    $('#rToday').textContent = money(today);
    $('#rWeek').textContent = money(week);
    $('#rMonth').textContent = money(month);
    $('#rProfit').textContent = money(Math.round(profit));
    $('#rProducts').textContent = state.products.length;
    const lowStock = state.products.filter(p => p.stock < 5);
    $('#rLowStock').textContent = lowStock.length;

    const top = Object.values(perProduct).sort((a, b) => b.qty - a.qty).slice(0, 10);
    const topBody = $('#topProducts');
    topBody.innerHTML = top.length ? top.map(r => `<tr><td>${escape(r.name)}</td><td>${r.qty}</td><td>${money(Math.round(r.revenue))}</td></tr>`).join('')
      : '<tr><td colspan="3" style="text-align:center;color:var(--muted);">Hakuna mauzo bado.</td></tr>';

    const lsBody = $('#lowStockBody');
    lsBody.innerHTML = lowStock.length ? lowStock.map(p => `<tr><td>${escape(p.name)}</td><td>${escape(p.size || '-')}</td><td>${escape(p.color || '-')}</td><td style="color:var(--danger);font-weight:600;">${p.stock}</td></tr>`).join('')
      : '<tr><td colspan="4" style="text-align:center;color:var(--muted);">Stoo yako iko sawa.</td></tr>';
  }

  // ---------- Import/Export ----------
  function exportData() {
    const data = { products: state.products, sales: state.sales, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'duka-backup-' + todayISO() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Nakala imepakuliwa', 'success');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.products) || !Array.isArray(data.sales)) throw new Error('Muundo si sahihi');
        if (!confirm('Itabadilisha data ya sasa. Endelea?')) return;
        state.products = data.products;
        state.sales = data.sales;
        saveProducts(); saveSales();
        refreshCategoryOptions();
        renderPOSProducts(); renderProducts(); renderSales();
        toast('Nakala imeingizwa', 'success');
      } catch (e) {
        toast('Faili si sahihi', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ---------- Utils ----------
  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---------- Init ----------
  function init() {
    load();
    initTabs();
    refreshCategoryOptions();
    renderPOSProducts();
    renderCart();
    renderProducts();

    $('#posSearch').addEventListener('input', renderPOSProducts);
    $('#posCategory').addEventListener('change', renderPOSProducts);
    $('#discount').addEventListener('input', updateTotals);
    $('#clearCart').addEventListener('click', () => { state.cart = []; renderCart(); });
    $('#checkout').addEventListener('click', checkout);

    $('#prodSearch').addEventListener('input', renderProducts);
    $('#addProduct').addEventListener('click', () => openProductModal(null));
    $('#cancelProduct').addEventListener('click', () => $('#productModal').classList.add('hidden'));
    $('#productForm').addEventListener('submit', saveProductForm);

    $('#filterSales').addEventListener('click', () => {
      state.salesFilter.from = $('#fromDate').value || null;
      state.salesFilter.to = $('#toDate').value || null;
      renderSales();
    });

    $('#closeReceipt').addEventListener('click', () => $('#receiptModal').classList.add('hidden'));
    $('#printReceipt').addEventListener('click', () => window.print());

    $('#exportData').addEventListener('click', exportData);
    $('#importData').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = '';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $('#productModal').classList.add('hidden');
        $('#receiptModal').classList.add('hidden');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
