// ============================================
// TOOLIEST.COM - Tool Renderers Invoice Generator
// ============================================

(function () {
  const INVOICE_STORAGE = {
    sender: 'tooliest_invoice_sender',
    recentClients: 'tooliest_invoice_clients_recent',
    lastNumber: 'tooliest_invoice_last_number',
    history: 'tooliest_invoice_history',
    liveState: 'tooliest_invoice_live_state',
    template: 'tooliest_invoice_template',
    accent: 'tooliest_invoice_accent',
    currency: 'tooliest_invoice_currency_last',
    draftsPrefix: 'tooliest_invoice_draft_',
    taxPrefs: 'tooliest_invoice_tax_prefs',
    coachSeen: 'tooliest_invoice_coach_seen',
  };

  const INVOICE_CURRENCIES = [
    { code: 'USD', symbol: '$', label: 'USD ($)' },
    { code: 'EUR', symbol: '\u20ac', label: 'EUR (\u20ac)' },
    { code: 'GBP', symbol: '\u00a3', label: 'GBP (\u00a3)' },
    { code: 'JPY', symbol: '\u00a5', label: 'JPY (\u00a5)' },
    { code: 'INR', symbol: '\u20b9', label: 'INR (\u20b9)' },
    { code: 'CAD', symbol: '$', label: 'CAD ($)' },
    { code: 'AUD', symbol: '$', label: 'AUD ($)' },
    { code: 'CHF', symbol: 'Fr', label: 'CHF (Fr)' },
    { code: 'SGD', symbol: '$', label: 'SGD ($)' },
    { code: 'HKD', symbol: '$', label: 'HKD ($)' },
    { code: 'NZD', symbol: '$', label: 'NZD ($)' },
    { code: 'MXN', symbol: '$', label: 'MXN ($)' },
    { code: 'BRL', symbol: 'R$', label: 'BRL (R$)' },
    { code: 'ZAR', symbol: 'R', label: 'ZAR (R)' },
    { code: 'AED', symbol: '\u062f.\u0625', label: 'AED (\u062f.\u0625)' },
    { code: 'SAR', symbol: '\ufdfc', label: 'SAR (\ufdfc)' },
    { code: 'KRW', symbol: '\u20a9', label: 'KRW (\u20a9)' },
    { code: 'CNY', symbol: '\u00a5', label: 'CNY (\u00a5)' },
    { code: 'TWD', symbol: 'NT$', label: 'TWD (NT$)' },
    { code: 'THB', symbol: '\u0e3f', label: 'THB (\u0e3f)' },
    { code: 'MYR', symbol: 'RM', label: 'MYR (RM)' },
    { code: 'IDR', symbol: 'Rp', label: 'IDR (Rp)' },
    { code: 'PHP', symbol: '\u20b1', label: 'PHP (\u20b1)' },
    { code: 'VND', symbol: '\u20ab', label: 'VND (\u20ab)' },
    { code: 'NPR', symbol: '\u0930\u0942', label: 'NPR (\u0930\u0942)' },
    { code: 'PKR', symbol: '\u20a8', label: 'PKR (\u20a8)' },
    { code: 'BDT', symbol: '\u09f3', label: 'BDT (\u09f3)' },
    { code: 'EGP', symbol: '\u00a3', label: 'EGP (\u00a3)' },
    { code: 'NGN', symbol: '\u20a6', label: 'NGN (\u20a6)' },
    { code: 'KES', symbol: 'KSh', label: 'KES (KSh)' },
  ];

  const DOWNLOAD_LINKS = [
    { href: '/pdf-compressor', title: 'Compress your invoice PDF', description: 'Reduce file size before emailing' },
    { href: '/pdf-protect', title: 'Add a password to your invoice', description: 'Protect sensitive client data' },
    { href: '/signature-maker', title: 'Sign your invoice', description: 'Create a transparent signature PNG for invoices and PDFs' },
    { href: '/pdf-merger', title: 'Merge with a contract PDF', description: 'Combine your invoice with related paperwork' },
  ];

  let invoicePdfModulePromise = null;

  const escapeHtml = (value) => ToolRenderers.escapeHtml(value);

  function invoiceReadJson(key, fallback) {
    return safeLocalGet(key, fallback);
  }

  function invoiceWriteJson(key, value) {
    safeLocalSet(key, JSON.stringify(value));
  }

  function invoiceUid() {
    return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDaysIsoDate(isoDate, days) {
    const base = new Date(`${isoDate}T00:00:00`);
    base.setDate(base.getDate() + days);
    return base.toISOString().slice(0, 10);
  }

  function parseSequenceFromInvoice(value) {
    const digits = String(value || '').match(/(\d+)/g);
    if (!digits || !digits.length) return 0;
    return Number(digits[digits.length - 1]) || 0;
  }

  function formatInvoiceNumber(sequence) {
    const safe = Math.max(1, Number(sequence) || 1);
    return `INV-${String(safe).padStart(4, '0')}`;
  }

  function getNextInvoiceNumber() {
    const storedValue = safeLocalRead(INVOICE_STORAGE.lastNumber, '') || '';
    const history = invoiceReadJson(INVOICE_STORAGE.history, []);
    const maxHistory = history.reduce((maxValue, entry) => Math.max(maxValue, parseSequenceFromInvoice(entry.invoiceNumber)), 0);
    const nextSequence = Math.max(parseSequenceFromInvoice(storedValue), maxHistory) + 1;
    return formatInvoiceNumber(nextSequence || 1);
  }

  function createBlankItem(seed = {}) {
    return {
      id: seed.id || invoiceUid(),
      description: String(seed.description || ''),
      quantity: seed.quantity === undefined || seed.quantity === null || seed.quantity === '' ? '1' : String(seed.quantity),
      unitPrice: seed.unitPrice === undefined || seed.unitPrice === null ? '' : String(seed.unitPrice),
      unit: String(seed.unit || ''),
    };
  }

  function createDefaultInvoiceState(overrides = {}) {
    const today = todayIsoDate();
    const savedCurrency = safeLocalRead(INVOICE_STORAGE.currency, 'USD') || 'USD';
    const savedTemplate = safeLocalRead(INVOICE_STORAGE.template, 'modern') || 'modern';
    const savedAccent = safeLocalRead(INVOICE_STORAGE.accent, '#7c3aed') || '#7c3aed';
    const savedTaxPrefs = invoiceReadJson(INVOICE_STORAGE.taxPrefs, {});
    const savedSender = invoiceReadJson(INVOICE_STORAGE.sender, {});
    return {
      sender: {
        name: '',
        logoData: '',
        logoName: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        ...savedSender,
        ...(overrides.sender || {}),
      },
      client: {
        name: '',
        company: '',
        email: '',
        address: '',
        ...(overrides.client || {}),
      },
      invoice: {
        number: getNextInvoiceNumber(),
        date: today,
        dueDate: addDaysIsoDate(today, 30),
        currency: savedCurrency,
        poNumber: '',
        notes: '',
        template: savedTemplate,
        accentColor: savedAccent,
        ...(overrides.invoice || {}),
      },
      items: [createBlankItem(), createBlankItem(), createBlankItem()],
      charges: {
        discountEnabled: false,
        discountType: 'percent',
        discountValue: '',
        tax1Enabled: false,
        tax1Label: savedTaxPrefs.tax1Label || 'Tax',
        tax1Rate: savedTaxPrefs.tax1Rate || '',
        tax2Enabled: false,
        tax2Label: savedTaxPrefs.tax2Label || 'Tax',
        tax2Rate: savedTaxPrefs.tax2Rate || '',
        shippingLabel: 'Shipping',
        shippingAmount: '',
        ...(overrides.charges || {}),
      },
    };
  }

  function normalizeInvoiceState(rawState) {
    const base = createDefaultInvoiceState();
    if (!rawState || typeof rawState !== 'object') return base;
    const merged = {
      sender: { ...base.sender, ...(rawState.sender || {}) },
      client: { ...base.client, ...(rawState.client || {}) },
      invoice: { ...base.invoice, ...(rawState.invoice || {}) },
      charges: { ...base.charges, ...(rawState.charges || {}) },
      items: Array.isArray(rawState.items) && rawState.items.length ? rawState.items.map((item) => createBlankItem(item)) : base.items,
    };
    while (merged.items.length < 3) merged.items.push(createBlankItem());
    return merged;
  }

  function currencyMeta(code) {
    return INVOICE_CURRENCIES.find((item) => item.code === code) || INVOICE_CURRENCIES[0];
  }

  function parsePositiveNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function hasCompleteLineItem(item) {
    return String(item.description || '').trim() && String(item.unitPrice || '').trim();
  }

  function calculateInvoiceTotals(state) {
    const items = state.items.map((item) => {
      const quantity = Math.max(0, parsePositiveNumber(item.quantity || 0));
      const unitPrice = Math.max(0, parsePositiveNumber(item.unitPrice || 0));
      return {
        ...item,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const rawDiscount = Math.max(0, parsePositiveNumber(state.charges.discountValue || 0));
    const discount = state.charges.discountEnabled
      ? (state.charges.discountType === 'percent' ? subtotal * (rawDiscount / 100) : rawDiscount)
      : 0;
    const safeDiscount = Math.min(subtotal, discount);
    const taxableBase = Math.max(0, subtotal - safeDiscount);
    const tax1 = state.charges.tax1Enabled ? taxableBase * (Math.max(0, parsePositiveNumber(state.charges.tax1Rate || 0)) / 100) : 0;
    const tax2 = state.charges.tax2Enabled ? taxableBase * (Math.max(0, parsePositiveNumber(state.charges.tax2Rate || 0)) / 100) : 0;
    const shipping = Math.max(0, parsePositiveNumber(state.charges.shippingAmount || 0));
    const total = taxableBase + tax1 + tax2 + shipping;
    return {
      items,
      subtotal,
      discount: safeDiscount,
      tax1,
      tax2,
      shipping,
      total,
    };
  }

  function invoiceFormatMoney(amount, currencyCode) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode || 'USD',
        maximumFractionDigits: 2,
      }).format(Number(amount || 0));
    } catch (_) {
      const meta = currencyMeta(currencyCode);
      return `${meta.symbol} ${Number(amount || 0).toFixed(2)}`;
    }
  }

  function invoiceDebounce(fn, wait) {
    let timeoutId = null;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function colorDistanceRgb(left, right) {
    return Math.sqrt(
      ((left.r || 0) - (right.r || 0)) ** 2 +
      ((left.g || 0) - (right.g || 0)) ** 2 +
      ((left.b || 0) - (right.b || 0)) ** 2
    );
  }

  function sampleImagePatch(data, width, height, startX, startY, size) {
    const endX = Math.min(width, startX + size);
    const endY = Math.min(height, startY + size);
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 0;
    let count = 0;
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const offset = (y * width + x) * 4;
        red += data[offset];
        green += data[offset + 1];
        blue += data[offset + 2];
        alpha += data[offset + 3];
        count += 1;
      }
    }
    if (!count) return { r: 255, g: 255, b: 255, a: 255 };
    return {
      r: red / count,
      g: green / count,
      b: blue / count,
      a: alpha / count,
    };
  }

  function tryRemoveLogoBackground(context, width, height) {
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] < 250) return false;
    }
    const inset = Math.max(1, Math.round(Math.min(width, height) * 0.03));
    const patchSize = Math.max(3, Math.round(Math.min(width, height) * 0.05));
    const samples = [
      sampleImagePatch(data, width, height, inset, inset, patchSize),
      sampleImagePatch(data, width, height, Math.max(0, width - inset - patchSize), inset, patchSize),
      sampleImagePatch(data, width, height, inset, Math.max(0, height - inset - patchSize), patchSize),
      sampleImagePatch(data, width, height, Math.max(0, width - inset - patchSize), Math.max(0, height - inset - patchSize), patchSize),
    ];
    const background = samples.reduce((accumulator, sample) => ({
      r: accumulator.r + sample.r,
      g: accumulator.g + sample.g,
      b: accumulator.b + sample.b,
    }), { r: 0, g: 0, b: 0 });
    background.r /= samples.length;
    background.g /= samples.length;
    background.b /= samples.length;
    const brightness = (background.r * 0.299) + (background.g * 0.587) + (background.b * 0.114);
    if (brightness < 214) return false;
    if (samples.some((sample) => colorDistanceRgb(sample, background) > 18)) return false;
    let changed = false;
    for (let index = 0; index < data.length; index += 4) {
      const pixel = { r: data[index], g: data[index + 1], b: data[index + 2] };
      const pixelBrightness = (pixel.r * 0.299) + (pixel.g * 0.587) + (pixel.b * 0.114);
      if (pixelBrightness < 180) continue;
      const distance = colorDistanceRgb(pixel, background);
      if (distance <= 24) {
        data[index + 3] = 0;
        changed = true;
      } else if (distance <= 58) {
        const alphaRatio = (distance - 24) / (58 - 24);
        data[index + 3] = Math.max(0, Math.min(255, Math.round(255 * alphaRatio)));
        changed = true;
      }
    }
    if (changed) context.putImageData(imageData, 0, 0);
    return changed;
  }

  function invoiceFileName(state) {
    const client = String(state.client.name || state.client.company || 'Client')
      .replace(/[^a-z0-9\-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'Client';
    return `Invoice-${state.invoice.number || 'INV-0001'}-${client}.pdf`;
  }

  function invoiceFieldValidity(fieldKey, state, itemId) {
    if (fieldKey === 'sender.name') {
      return state.sender.name.trim() ? '' : 'Enter your business or freelancer name.';
    }
    if (fieldKey === 'sender.email' && state.sender.email.trim()) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.sender.email.trim()) ? '' : 'Enter a valid email address.';
    }
    if (fieldKey === 'sender.website' && state.sender.website.trim()) {
      try {
        const value = state.sender.website.startsWith('http') ? state.sender.website : `https://${state.sender.website}`;
        const parsed = new URL(value);
        return ['http:', 'https:'].includes(parsed.protocol) ? '' : 'Enter a valid website URL.';
      } catch (_) {
        return 'Enter a valid website URL.';
      }
    }
    if (fieldKey === 'client.email' && state.client.email.trim()) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.client.email.trim()) ? '' : 'Enter a valid client email address.';
    }
    if (fieldKey === 'item.description' || fieldKey === 'item.unitPrice') {
      const item = state.items.find((entry) => entry.id === itemId);
      if (!item) return '';
      const hasDescription = Boolean(String(item.description || '').trim());
      const hasPrice = Boolean(String(item.unitPrice || '').trim());
      if (fieldKey === 'item.description' && hasPrice && !hasDescription) return 'Add a description or clear the price.';
      if (fieldKey === 'item.unitPrice' && hasDescription && !hasPrice) return 'Add a unit price or clear the line.';
    }
    return '';
  }

  function buildPortableInvoiceHtml(state, totals) {
    const businessAddress = escapeHtml(state.sender.address || '').replace(/\n/g, '<br>');
    const clientAddress = escapeHtml(state.client.address || '').replace(/\n/g, '<br>');
    const lineRows = totals.items
      .filter((item) => String(item.description || '').trim() || item.amount > 0)
      .map((item) => `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top">${escapeHtml(item.description || '-')}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${escapeHtml(String(item.quantity))}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${invoiceFormatMoney(item.unitPrice, state.invoice.currency)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${escapeHtml(item.unit || '')}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${invoiceFormatMoney(item.amount, state.invoice.currency)}</td>
        </tr>`).join('');
    const taxRows = [
      state.charges.tax1Enabled ? `<tr><td style="padding:6px 0;color:#4b5563">${escapeHtml(state.charges.tax1Label || 'Tax')}</td><td style="padding:6px 0;text-align:right;color:#111827">${invoiceFormatMoney(totals.tax1, state.invoice.currency)}</td></tr>` : '',
      state.charges.tax2Enabled ? `<tr><td style="padding:6px 0;color:#4b5563">${escapeHtml(state.charges.tax2Label || 'Tax')}</td><td style="padding:6px 0;text-align:right;color:#111827">${invoiceFormatMoney(totals.tax2, state.invoice.currency)}</td></tr>` : '',
    ].join('');
    return `
<div style="font-family:Inter,Arial,sans-serif;background:#ffffff;color:#111827;max-width:820px;margin:0 auto;padding:40px">
  <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:28px;border-bottom:4px solid ${escapeHtml(state.invoice.accentColor || '#7c3aed')}">
    <div style="max-width:60%">
      ${state.sender.logoData ? `<div style="width:180px;height:88px;display:flex;align-items:center;justify-content:flex-start;margin-bottom:16px"><img src="${escapeHtml(state.sender.logoData)}" alt="Business logo" style="width:100%;height:100%;object-fit:contain;object-position:left center;display:block"></div>` : ''}
      <div style="font-size:28px;font-weight:800;margin-bottom:10px">${escapeHtml(state.sender.name || 'Your business')}</div>
      <div style="font-size:14px;color:#4b5563;line-height:1.7">
        ${state.sender.email ? `${escapeHtml(state.sender.email)}<br>` : ''}
        ${state.sender.phone ? `${escapeHtml(state.sender.phone)}<br>` : ''}
        ${businessAddress ? `${businessAddress}<br>` : ''}
        ${state.sender.website ? escapeHtml(state.sender.website) : ''}
      </div>
    </div>
    <div style="min-width:220px;text-align:right">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.18em;color:#6b7280;text-transform:uppercase">Invoice</div>
      <div style="font-size:28px;font-weight:800;margin:8px 0 20px">${escapeHtml(state.invoice.number || 'INV-0001')}</div>
      <div style="font-size:14px;color:#4b5563;line-height:1.8">
        <div><strong style="color:#111827">Invoice Date:</strong> ${escapeHtml(state.invoice.date || '')}</div>
        <div><strong style="color:#111827">Due Date:</strong> ${escapeHtml(state.invoice.dueDate || '')}</div>
        ${state.invoice.poNumber ? `<div><strong style="color:#111827">PO Number:</strong> ${escapeHtml(state.invoice.poNumber)}</div>` : ''}
      </div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;gap:24px;margin-top:30px">
    <div style="max-width:360px">
      <div style="font-size:12px;font-weight:800;letter-spacing:0.18em;color:#6b7280;text-transform:uppercase;margin-bottom:10px">Bill To</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:10px">${escapeHtml(state.client.name || 'Client name')}</div>
      <div style="font-size:14px;color:#4b5563;line-height:1.7">
        ${state.client.company ? `${escapeHtml(state.client.company)}<br>` : ''}
        ${state.client.email ? `${escapeHtml(state.client.email)}<br>` : ''}
        ${clientAddress || '<span style="color:#9ca3af">Client address</span>'}
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-top:32px;font-size:14px">
    <thead>
      <tr>
        <th style="text-align:left;padding:12px 10px;background:#f3f4f6;color:#111827">Description</th>
        <th style="text-align:right;padding:12px 10px;background:#f3f4f6;color:#111827">Qty</th>
        <th style="text-align:right;padding:12px 10px;background:#f3f4f6;color:#111827">Unit Price</th>
        <th style="text-align:right;padding:12px 10px;background:#f3f4f6;color:#111827">Unit</th>
        <th style="text-align:right;padding:12px 10px;background:#f3f4f6;color:#111827">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows || `<tr><td colspan="5" style="padding:18px 10px;color:#9ca3af;text-align:center">Add your first line item to see it here.</td></tr>`}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-top:28px">
    <table style="width:320px;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#4b5563">Subtotal</td><td style="padding:6px 0;text-align:right;color:#111827">${invoiceFormatMoney(totals.subtotal, state.invoice.currency)}</td></tr>
      ${state.charges.discountEnabled ? `<tr><td style="padding:6px 0;color:#4b5563">Discount</td><td style="padding:6px 0;text-align:right;color:#111827">-${invoiceFormatMoney(totals.discount, state.invoice.currency)}</td></tr>` : ''}
      ${taxRows}
      ${parsePositiveNumber(state.charges.shippingAmount) > 0 ? `<tr><td style="padding:6px 0;color:#4b5563">${escapeHtml(state.charges.shippingLabel || 'Shipping')}</td><td style="padding:6px 0;text-align:right;color:#111827">${invoiceFormatMoney(totals.shipping, state.invoice.currency)}</td></tr>` : ''}
      <tr><td style="padding-top:12px;border-top:2px solid #111827;font-weight:800;font-size:18px;color:#111827">Total</td><td style="padding-top:12px;border-top:2px solid #111827;text-align:right;font-weight:800;font-size:18px;color:#111827">${invoiceFormatMoney(totals.total, state.invoice.currency)}</td></tr>
    </table>
  </div>
  ${state.invoice.notes ? `<div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb"><div style="font-size:12px;font-weight:800;letter-spacing:0.18em;color:#6b7280;text-transform:uppercase;margin-bottom:10px">Notes / Payment Terms</div><div style="font-size:14px;color:#4b5563;line-height:1.7">${escapeHtml(state.invoice.notes).replace(/\n/g, '<br>')}</div></div>` : ''}
  <div style="margin-top:32px;padding-top:18px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280">Generated with Tooliest.com</div>
</div>`;
  }

  function buildPreviewMarkup(state, totals) {
    const template = state.invoice.template || 'modern';
    const senderLines = [
      state.sender.email,
      state.sender.phone,
      state.sender.address,
      state.sender.website,
    ].filter(Boolean);
    const clientLines = [
      state.client.company,
      state.client.email,
      state.client.address,
    ].filter(Boolean);
    const visibleItems = totals.items.filter((item) => String(item.description || '').trim() || item.amount > 0);
    const itemRows = visibleItems.length
      ? visibleItems.map((item) => `<tr>
          <td>${escapeHtml(item.description || '-')}</td>
          <td class="inv-align-right">${escapeHtml(String(item.quantity))}</td>
          <td class="inv-align-right">${invoiceFormatMoney(item.unitPrice, state.invoice.currency)}</td>
          <td class="inv-align-right">${escapeHtml(item.unit || '')}</td>
          <td class="inv-align-right inv-preview-amount">${invoiceFormatMoney(item.amount, state.invoice.currency)}</td>
        </tr>`).join('')
      : `<tr><td colspan="5" class="inv-preview-empty">Describe the work, add a quantity, and set the price.</td></tr>`;
    const summaryRows = [
      `<div class="inv-preview-total-row"><span>Subtotal</span><strong>${invoiceFormatMoney(totals.subtotal, state.invoice.currency)}</strong></div>`,
      state.charges.discountEnabled ? `<div class="inv-preview-total-row"><span>Discount</span><strong>-${invoiceFormatMoney(totals.discount, state.invoice.currency)}</strong></div>` : '',
      state.charges.tax1Enabled ? `<div class="inv-preview-total-row"><span>${escapeHtml(state.charges.tax1Label || 'Tax')}</span><strong>${invoiceFormatMoney(totals.tax1, state.invoice.currency)}</strong></div>` : '',
      state.charges.tax2Enabled ? `<div class="inv-preview-total-row"><span>${escapeHtml(state.charges.tax2Label || 'Tax')}</span><strong>${invoiceFormatMoney(totals.tax2, state.invoice.currency)}</strong></div>` : '',
      parsePositiveNumber(state.charges.shippingAmount) > 0 ? `<div class="inv-preview-total-row"><span>${escapeHtml(state.charges.shippingLabel || 'Shipping')}</span><strong>${invoiceFormatMoney(totals.shipping, state.invoice.currency)}</strong></div>` : '',
    ].join('');
    return `
      <div class="inv-preview-shell">
        <div class="inv-preview-stage" id="inv-preview-stage">
          <div class="inv-preview-sheet inv-template-${escapeHtml(template)}" id="invoice-preview" style="--inv-accent:${escapeHtml(state.invoice.accentColor || '#7c3aed')}">
            <div class="inv-preview-accent"></div>
            <div class="inv-preview-header-row">
              <div class="inv-preview-brand">
                ${state.sender.logoData ? `<div class="inv-preview-logo-frame"><img class="inv-preview-logo" src="${escapeHtml(state.sender.logoData)}" alt="Business logo"></div>` : `<div class="inv-preview-logo-frame inv-preview-logo-frame-fallback"><div class="inv-preview-logo-placeholder">${escapeHtml((state.sender.name || 'T').trim().charAt(0).toUpperCase() || 'T')}</div></div>`}
                <div class="inv-preview-company">
                  <div class="inv-preview-company-name">${escapeHtml(state.sender.name || 'Your business name')}</div>
                  <div class="inv-preview-copy">${senderLines.length ? senderLines.map((line) => escapeHtml(line).replace(/\n/g, '<br>')).join('<br>') : 'Add your contact details and logo once - Tooliest remembers them locally.'}</div>
                </div>
              </div>
              <div class="inv-preview-doc">
                <div class="inv-preview-doc-label">Invoice</div>
                <div class="inv-preview-doc-number">${escapeHtml(state.invoice.number || 'INV-0001')}</div>
                <div class="inv-preview-meta-grid">
                  <div><span>Invoice date</span><strong>${escapeHtml(state.invoice.date || todayIsoDate())}</strong></div>
                  <div><span>Due date</span><strong>${escapeHtml(state.invoice.dueDate || addDaysIsoDate(todayIsoDate(), 30))}</strong></div>
                  ${state.invoice.poNumber ? `<div><span>PO number</span><strong>${escapeHtml(state.invoice.poNumber)}</strong></div>` : ''}
                </div>
              </div>
            </div>

            <div class="inv-preview-billto">
              <div class="inv-preview-kicker">Bill To</div>
              <div class="inv-preview-client-name">${escapeHtml(state.client.name || 'Client name')}</div>
              <div class="inv-preview-copy">${clientLines.length ? clientLines.map((line) => escapeHtml(line).replace(/\n/g, '<br>')).join('<br>') : 'Client company, email, and address appear here.'}</div>
            </div>

            <table class="inv-preview-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="inv-align-right">Quantity</th>
                  <th class="inv-align-right">Unit Price</th>
                  <th class="inv-align-right">Unit</th>
                  <th class="inv-align-right">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div class="inv-preview-summary">
              <div class="inv-preview-summary-card">
                ${summaryRows}
                <div class="inv-preview-total-row inv-preview-grand-total"><span>Total</span><strong>${invoiceFormatMoney(totals.total, state.invoice.currency)}</strong></div>
              </div>
            </div>

            ${state.invoice.notes ? `<div class="inv-preview-notes"><div class="inv-preview-kicker">Notes / Payment Terms</div><div class="inv-preview-copy">${escapeHtml(state.invoice.notes).replace(/\n/g, '<br>')}</div></div>` : ''}
            <div class="inv-preview-footer">Generated with Tooliest.com</div>
          </div>
        </div>
      </div>`;
  }

  async function compressInvoiceLogo(file) {
    if (!file) throw new Error('Choose an image first.');
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      throw new Error('Upload a PNG, JPG, or SVG logo.');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Logos must be 2 MB or smaller.');
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('The logo could not be read.'));
      reader.readAsDataURL(file);
    });
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('The logo preview could not be created.'));
      img.src = dataUrl;
    });
    const maxWidth = 520;
    const maxHeight = 180;
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const cleanedBackground = tryRemoveLogoBackground(context, width, height);
    const outputType = cleanedBackground || ['image/png', 'image/svg+xml'].includes(file.type) ? 'image/png' : 'image/jpeg';
    return {
      dataUrl: canvas.toDataURL(outputType, outputType === 'image/png' ? undefined : 0.7),
      fileName: file.name,
      width,
      height,
      bytes: file.size,
    };
  }

  async function loadInvoicePdfLibraries() {
    if (!invoicePdfModulePromise) {
      invoicePdfModulePromise = Promise.all([
        import('https://cdn.jsdelivr.net/npm/jspdf@3.0.2/+esm'),
        import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm'),
      ]).catch((error) => {
        invoicePdfModulePromise = null;
        throw error;
      });
    }
    const [jspdfModule, html2canvasModule] = await invoicePdfModulePromise;
    return {
      jsPDF: jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default,
      html2canvas: html2canvasModule.default || html2canvasModule,
    };
  }

  function createInvoicePdfRenderSurface(state, totals) {
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.position = 'fixed';
    host.style.left = '-10000px';
    host.style.top = '0';
    host.style.width = '820px';
    host.style.padding = '0';
    host.style.margin = '0';
    host.style.opacity = '0';
    host.style.pointerEvents = 'none';
    host.style.zIndex = '-1';
    host.innerHTML = buildPreviewMarkup(state, totals);
    document.body.appendChild(host);
    return {
      host,
      preview: host.querySelector('#invoice-preview'),
      cleanup() {
        host.remove();
      },
    };
  }

  async function downloadInvoicePreviewPdf(previewElement, fileName) {
    const { jsPDF, html2canvas } = await loadInvoicePdfLibraries();
    const canvas = await html2canvas(previewElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(previewElement.scrollWidth, previewElement.offsetWidth),
      windowHeight: Math.max(previewElement.scrollHeight, previewElement.offsetHeight),
      scrollX: 0,
      scrollY: -window.scrollY,
    });
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pageWidth = 210;
    const pageHeight = 297;
    const renderedHeight = canvas.height * pageWidth / canvas.width;
    if (renderedHeight <= pageHeight * 1.12) {
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, Math.min(pageHeight, renderedHeight), undefined, 'FAST');
      pdf.save(fileName);
      return;
    }
    const pageHeightPx = Math.floor(canvas.width * (pageHeight / pageWidth));
    let pageIndex = 0;
    for (let offsetY = 0; offsetY < canvas.height; offsetY += pageHeightPx) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      const sliceContext = sliceCanvas.getContext('2d');
      sliceContext.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      const imageData = sliceCanvas.toDataURL('image/jpeg', 0.95);
      const renderHeight = sliceHeight * pageWidth / canvas.width;
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, renderHeight, undefined, 'FAST');
      pageIndex += 1;
    }
    pdf.save(fileName);
  }

  function getDraftRecords() {
    const drafts = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(INVOICE_STORAGE.draftsPrefix)) continue;
        const payload = safeLocalGet(key, null);
        if (payload && payload.state) drafts.push({ key, ...payload });
      }
    } catch (_) {}
    return drafts.sort((left, right) => Date.parse(right.savedAt || 0) - Date.parse(left.savedAt || 0));
  }

  function saveInvoiceDraft(state, totals) {
    const key = `${INVOICE_STORAGE.draftsPrefix}${state.invoice.number || getNextInvoiceNumber()}`;
    invoiceWriteJson(key, {
      invoiceNumber: state.invoice.number,
      clientName: state.client.name || state.client.company || 'Untitled client',
      total: totals.total,
      currency: state.invoice.currency,
      savedAt: new Date().toISOString(),
      state,
    });
  }

  function recordInvoiceHistory(history, state, totals) {
    const entry = {
      id: invoiceUid(),
      invoiceNumber: state.invoice.number,
      clientName: state.client.name || state.client.company || 'Client',
      amount: totals.total,
      currency: state.invoice.currency,
      date: state.invoice.date,
      status: 'unpaid',
      savedAt: new Date().toISOString(),
      snapshot: {
        client: state.client,
        items: state.items,
        charges: state.charges,
        invoice: {
          currency: state.invoice.currency,
          poNumber: state.invoice.poNumber,
          notes: state.invoice.notes,
        },
      },
    };
    const filtered = history.filter((item) => item.invoiceNumber !== state.invoice.number);
    const nextHistory = [entry, ...filtered].slice(0, 20);
    invoiceWriteJson(INVOICE_STORAGE.history, nextHistory);
    safeLocalSet(INVOICE_STORAGE.lastNumber, state.invoice.number);
    return nextHistory;
  }

  function updateRecentInvoiceClients(client) {
    const label = client.name || client.company || '';
    if (!label.trim()) return;
    const recent = invoiceReadJson(INVOICE_STORAGE.recentClients, []);
    const nextRecent = [
      {
        name: client.name || '',
        company: client.company || '',
        email: client.email || '',
        address: client.address || '',
      },
      ...recent.filter((entry) => (entry.name || entry.company || '').toLowerCase() !== label.toLowerCase()),
    ].slice(0, 5);
    invoiceWriteJson(INVOICE_STORAGE.recentClients, nextRecent);
  }

  Object.assign(ToolRenderers.renderers, {
    'invoice-generator'(container) {
      let state = normalizeInvoiceState(invoiceReadJson(INVOICE_STORAGE.liveState, null));
      let history = invoiceReadJson(INVOICE_STORAGE.history, []);
      let touched = {};
      let logoError = '';
      let draggedItemId = null;
      let isGenerating = false;
      let lastSavedStamp = 0;

      container.innerHTML = `
<style>
  .inv-wrap { position: relative; }
  .inv-shell { display: grid; gap: 20px; }
  .inv-status-row { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
  .inv-pill, .inv-saved-chip {
    display:inline-flex; align-items:center; gap:8px; min-height:34px; padding:8px 12px;
    border:1px solid var(--border-color); border-radius:999px; background:var(--bg-glass); color:var(--text-secondary); font-size:0.82rem;
  }
  .inv-saved-chip { opacity:0; transform:translateY(-4px); transition:opacity .18s ease, transform .18s ease; }
  .inv-saved-chip.is-visible { opacity:1; transform:translateY(0); }
  .inv-layout { display:grid; grid-template-columns:minmax(0, 1fr); gap:20px; align-items:start; }
  .inv-editor, .inv-sidebar { min-width:0; }
  .inv-panel, .inv-actions, .inv-draft-panel, .inv-next-steps { border:1px solid var(--border-color); background:var(--bg-card); border-radius:14px; padding:18px; min-width:0; }
  .inv-panel + .inv-panel, .inv-editor details { margin-top:18px; }
  .inv-panel-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:16px; }
  .inv-panel-head h3, .inv-preview-head h3 { margin:0; font-size:1rem; }
  .inv-panel-subtle { color:var(--text-tertiary); font-size:0.84rem; }
  .inv-panel-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .inv-grid { display:grid; gap:14px; }
  .inv-grid-2 { grid-template-columns:repeat(2, minmax(0, 1fr)); }
  .inv-input-wrap { position:relative; }
  .inv-field-head { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
  .inv-input-wrap label { display:block; margin-bottom:8px; color:var(--text-secondary); font-size:0.85rem; font-weight:600; }
  .inv-field-head label { margin-bottom:0; }
  .inv-input-wrap input, .inv-input-wrap textarea, .inv-input-wrap select {
    width:100%; min-height:44px; padding:12px 14px; background:var(--bg-secondary); color:var(--text-primary);
    border:1px solid var(--border-color); border-radius:12px; font:inherit; outline:none; transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease;
  }
  .inv-input-wrap textarea { min-height:96px; resize:vertical; }
  .inv-input-wrap input:focus, .inv-input-wrap textarea:focus, .inv-input-wrap select:focus {
    border-color:var(--accent-primary); box-shadow:0 0 0 3px rgba(139, 92, 246, 0.18); transform:translateY(-1px);
  }
  .inv-input-wrap.is-error input, .inv-input-wrap.is-error textarea, .inv-input-wrap.is-error select { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.16); }
  .inv-field-error { min-height:18px; margin-top:6px; color:#fca5a5; font-size:0.8rem; }
  .inv-field-help { margin-top:6px; color:var(--text-tertiary); font-size:0.8rem; }
  .inv-privacy-note { margin:14px 0 0; color:var(--text-tertiary); font-size:0.82rem; }
  .inv-logo-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:12px; }
  .inv-logo-input { display:none; }
  .inv-inline-btn {
    display:inline-flex; align-items:center; justify-content:center; min-height:42px; padding:10px 14px;
    border-radius:12px; border:1px solid var(--border-color); background:var(--bg-glass); color:var(--text-primary); cursor:pointer; font:inherit; font-weight:600;
  }
  .inv-inline-btn:hover { border-color:var(--accent-primary); }
  .inv-inline-btn.is-danger:hover { border-color:#ef4444; color:#fecaca; }
  .inv-coachmark {
    display:inline-flex; align-items:center; min-height:28px; padding:4px 10px; border-radius:999px;
    background:linear-gradient(135deg, rgba(139,92,246,.88), rgba(6,182,212,.88)); color:#fff; font-size:0.76rem; font-weight:700;
    box-shadow:0 10px 22px rgba(15, 23, 42, 0.24); white-space:nowrap;
  }
  .inv-actions {
    position:sticky; top:84px; z-index:20; display:flex; flex-wrap:wrap; gap:10px; align-items:center;
  }
  .inv-actions .btn, .inv-actions .btn-secondary { min-height:44px; }
  .inv-actions .btn-primary { box-shadow:0 16px 26px rgba(139, 92, 246, 0.24); }
  .inv-actions-note { margin:10px 0 0; color:var(--text-tertiary); font-size:0.8rem; }
  .inv-badge { display:inline-flex; align-items:center; justify-content:center; min-width:26px; height:26px; padding:0 8px; border-radius:999px; background:rgba(139,92,246,.18); color:#ddd6fe; font-size:0.78rem; font-weight:700; }
  .inv-banner {
    display:none; margin-top:16px; padding:14px 16px; border-radius:14px; border:1px solid rgba(239,68,68,.32);
    background:rgba(239,68,68,.08); color:#fecaca; line-height:1.6;
  }
  .inv-banner.is-visible { display:block; }
  .inv-banner.inv-success { border-color:rgba(16,185,129,.28); background:rgba(16,185,129,.08); color:#bbf7d0; }
  .inv-template-switcher { display:flex; gap:8px; flex-wrap:wrap; }
  .inv-template-btn {
    min-height:40px; padding:8px 12px; border-radius:999px; border:1px solid var(--border-color); background:var(--bg-glass);
    color:var(--text-secondary); cursor:pointer; font:inherit; font-weight:600;
  }
  .inv-template-btn.is-active { border-color:transparent; background:var(--gradient-primary); color:#fff; }
  .inv-preview-controls { display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:14px; }
  .inv-color-wrap { display:flex; align-items:center; gap:10px; color:var(--text-secondary); font-size:0.85rem; }
  .inv-color-wrap input { width:44px; height:44px; padding:0; border:none; background:none; cursor:pointer; }
  .inv-sidebar { display:grid; gap:16px; }
  .inv-preview-card { position:static; }
  .inv-preview-frame {
    overflow:hidden; border-radius:14px; background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02)); border:1px solid var(--border-color);
    padding:24px; min-height:0; max-height:none;
  }
  .inv-preview-shell { position:relative; width:100%; display:flex; justify-content:center; align-items:flex-start; overflow:visible; }
  .inv-preview-stage { width:820px; transform-origin:top center; will-change:transform; }
  .inv-preview-sheet {
    width:820px; min-height:1120px; margin:0; background:#fff; color:#111827;
    border-radius:8px; box-shadow:0 24px 60px rgba(15, 23, 42, 0.25); padding:42px 46px 34px; font-family:Inter, Arial, sans-serif;
  }
  .inv-preview-accent { height:8px; margin:-42px -46px 26px; border-radius:8px 8px 0 0; background:var(--inv-accent); }
  .inv-template-classic { font-family:Georgia, "Times New Roman", serif; }
  .inv-template-classic .inv-preview-accent { background:#111827; }
  .inv-template-classic .inv-preview-doc-label,
  .inv-template-classic .inv-preview-kicker { letter-spacing:.16em; }
  .inv-template-minimal { padding:36px 40px 28px; }
  .inv-template-minimal .inv-preview-accent { display:none; }
  .inv-template-minimal .inv-preview-table th { border-bottom:1px solid #d1d5db; background:transparent; }
  .inv-template-minimal .inv-preview-table td { border-bottom:1px solid #eceff3; }
  .inv-preview-header-row { display:flex; justify-content:space-between; gap:32px; align-items:flex-start; }
  .inv-preview-brand { display:flex; gap:16px; align-items:flex-start; flex:1 1 auto; min-width:0; }
  .inv-preview-logo-frame { width:156px; height:82px; flex:0 0 156px; display:flex; align-items:center; justify-content:flex-start; }
  .inv-preview-logo-frame-fallback { width:72px; height:72px; flex-basis:72px; }
  .inv-preview-logo { width:100%; height:100%; object-fit:contain; object-position:left center; display:block; }
  .inv-preview-logo-placeholder {
    width:72px; height:72px; border-radius:20px; background:#f3f4f6; color:#111827; display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:800;
  }
  .inv-preview-company { min-width:0; }
  .inv-preview-company-name, .inv-preview-client-name { overflow-wrap:anywhere; }
  .inv-preview-company-name { font-size:1.7rem; font-weight:800; line-height:1.2; }
  .inv-preview-copy { color:#4b5563; font-size:0.95rem; line-height:1.7; margin-top:10px; }
  .inv-preview-doc { flex:0 0 220px; min-width:220px; text-align:right; }
  .inv-preview-doc-label, .inv-preview-kicker { color:#6b7280; font-size:0.76rem; text-transform:uppercase; letter-spacing:0.2em; font-weight:800; }
  .inv-preview-doc-number { margin:10px 0 18px; font-size:1.9rem; font-weight:800; }
  .inv-preview-meta-grid { display:grid; gap:10px; }
  .inv-preview-meta-grid span { display:block; color:#6b7280; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.14em; font-weight:700; }
  .inv-preview-meta-grid strong { display:block; margin-top:4px; font-size:0.95rem; }
  .inv-preview-billto { margin-top:34px; }
  .inv-preview-client-name { margin-top:10px; font-size:1.35rem; font-weight:700; }
  .inv-preview-table { width:100%; border-collapse:collapse; margin-top:30px; font-size:0.95rem; }
  .inv-preview-table th {
    text-align:left; padding:12px 10px; background:#f3f4f6; color:#111827; border-bottom:1px solid #d9dee7; font-size:0.8rem; text-transform:uppercase; letter-spacing:.12em;
  }
  .inv-preview-table td { padding:14px 10px; border-bottom:1px solid #e5e7eb; vertical-align:top; }
  .inv-align-right { text-align:right; }
  .inv-preview-amount { font-weight:700; }
  .inv-preview-empty { text-align:center; color:#9ca3af; padding:26px 10px; }
  .inv-preview-summary { display:flex; justify-content:flex-end; margin-top:28px; }
  .inv-preview-summary-card { width:min(100%, 320px); }
  .inv-preview-total-row { display:flex; justify-content:space-between; gap:14px; padding:6px 0; color:#4b5563; }
  .inv-preview-total-row strong { color:#111827; }
  .inv-preview-grand-total { margin-top:8px; padding-top:12px; border-top:2px solid #111827; font-size:1.18rem; font-weight:800; }
  .inv-preview-notes { margin-top:28px; padding-top:20px; border-top:1px solid #e5e7eb; }
  .inv-preview-footer { margin-top:28px; padding-top:18px; border-top:1px solid #e5e7eb; text-align:center; color:#6b7280; font-size:0.78rem; letter-spacing:0.16em; text-transform:uppercase; }
  .inv-items-wrap { overflow-x:auto; }
  .inv-items-table { width:100%; border-collapse:collapse; min-width:720px; }
  .inv-items-table th {
    text-align:left; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-tertiary);
    padding:0 8px 10px;
  }
  .inv-items-table td { padding:8px; vertical-align:top; }
  .inv-item-row { border-bottom:1px solid var(--border-color); }
  .inv-item-row.inv-dragging { opacity:0.55; }
  .inv-item-row textarea, .inv-item-row input { min-height:44px; }
  .inv-item-row textarea { min-height:52px; }
  .inv-item-actions { display:flex; gap:8px; }
  .inv-icon-btn {
    width:44px; height:44px; border-radius:12px; border:1px solid var(--border-color); background:var(--bg-glass); color:var(--text-secondary); cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:1rem;
  }
  .inv-icon-btn:hover { border-color:var(--accent-primary); color:var(--text-primary); }
  .inv-icon-btn.is-danger:hover { border-color:#ef4444; color:#fecaca; }
  .inv-row-amount { padding-top:12px; font-weight:700; color:var(--text-primary); white-space:nowrap; min-height:44px; display:flex; align-items:center; justify-content:flex-end; }
  .inv-summary-grid { display:grid; gap:16px; grid-template-columns:repeat(2, minmax(0, 1fr)); }
  .inv-summary-card {
    border:1px solid var(--border-color); border-radius:14px; background:var(--bg-glass); padding:16px;
  }
  .inv-summary-card h4 { margin:0 0 14px; font-size:0.92rem; }
  .inv-total-stack { display:grid; gap:8px; }
  .inv-total-line { display:flex; justify-content:space-between; gap:12px; color:var(--text-secondary); }
  .inv-total-line strong { color:var(--text-primary); }
  .inv-total-line.is-grand { margin-top:8px; padding-top:12px; border-top:1px solid var(--border-color); font-size:1.18rem; font-weight:800; }
  .inv-history details, .inv-history-list { margin-top:16px; }
  .inv-history { border:1px solid var(--border-color); border-radius:14px; background:var(--bg-card); overflow:hidden; }
  .inv-history summary {
    list-style:none; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:12px;
    padding:18px; font-weight:700;
  }
  .inv-history summary::-webkit-details-marker { display:none; }
  .inv-history-list { padding:0 18px 18px; display:grid; gap:12px; }
  .inv-history-item, .inv-draft-item {
    border:1px solid var(--border-color); border-radius:14px; background:var(--bg-glass); padding:14px;
    display:flex; justify-content:space-between; gap:14px; align-items:flex-start; flex-wrap:wrap;
  }
  .inv-history-item h4, .inv-draft-item h4 { margin:0 0 6px; font-size:0.94rem; }
  .inv-history-meta, .inv-draft-meta { color:var(--text-tertiary); font-size:0.82rem; line-height:1.6; }
  .inv-history-actions, .inv-draft-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .inv-toggle { display:inline-flex; align-items:center; gap:8px; color:var(--text-secondary); font-size:0.84rem; }
  .inv-toggle input { width:18px; height:18px; }
  .inv-draft-panel { display:none; margin-top:16px; }
  .inv-draft-panel.is-open { display:block; }
  .inv-next-steps { display:none; }
  .inv-next-steps.is-visible { display:block; }
  .inv-next-steps-list { display:grid; gap:10px; margin-top:12px; }
  .inv-next-link {
    display:flex; justify-content:space-between; gap:14px; padding:12px 14px; border-radius:12px; border:1px solid var(--border-color);
    background:var(--bg-glass); color:inherit;
  }
  .inv-next-link strong { display:block; font-size:0.92rem; color:var(--text-primary); }
  .inv-next-link span { display:block; margin-top:4px; color:var(--text-tertiary); font-size:0.82rem; }
  .inv-mobile-preview { display:none; position:sticky; bottom:14px; width:100%; margin-top:18px; box-shadow:0 18px 40px rgba(15, 23, 42, 0.28); }
  .inv-sr-only {
    position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden;
    clip:rect(0, 0, 0, 0); white-space:nowrap; border:0;
  }
  .inv-spinner {
    display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%;
    animation:invSpin .8s linear infinite;
  }
  @keyframes invSpin { to { transform:rotate(360deg); } }
  @media (max-width: 768px) {
    .inv-grid-2, .inv-summary-grid { grid-template-columns:1fr; }
    .inv-actions { top:64px; }
    .inv-preview-frame { min-height:320px; padding:14px; }
    .inv-mobile-preview { display:inline-flex; }
  }
</style>
<div class="tool-workspace-body inv-wrap">
  <div class="inv-status-row">
    <div class="inv-pill">Private, offline, and saved locally on this device only.</div>
    <div class="inv-saved-chip" id="inv-saved-chip" aria-live="polite" aria-atomic="true">Saved</div>
  </div>

  <div class="inv-layout">
    <section class="inv-editor">
      <div class="inv-actions">
        <button class="btn btn-primary" id="inv-download-btn" title="Your invoice is generated in your browser. Shortcut: Ctrl+Enter or Cmd+Enter.">Download PDF</button>
        <button class="btn btn-secondary" id="inv-copy-btn">Copy as HTML</button>
        <button class="btn btn-secondary" id="inv-print-btn">Print</button>
        <button class="btn btn-secondary" id="inv-reset-btn" type="button" title="Start a fresh invoice while keeping your saved business profile.">New Invoice</button>
        <button class="btn btn-secondary" id="inv-save-draft-btn">Save Draft</button>
        <button class="btn btn-secondary" id="inv-load-draft-btn">Load Draft <span class="inv-badge" id="inv-draft-count">0</span></button>
      </div>
      <div class="inv-actions-note">Your invoice is generated in your browser. Nothing is sent to our servers.</div>
      <div class="inv-banner" id="inv-error-summary"></div>
      <div class="inv-banner inv-success" id="inv-success-banner"></div>

      <div class="inv-draft-panel" id="inv-draft-panel">
        <div class="inv-panel-head">
          <div>
            <h3>Saved Drafts</h3>
            <span class="inv-panel-subtle">Restore or clear a locally saved invoice draft.</span>
          </div>
          <div class="inv-panel-actions">
            <button class="inv-inline-btn is-danger" id="inv-clear-drafts-btn" type="button">Delete All Drafts</button>
          </div>
        </div>
        <div id="inv-draft-list"></div>
      </div>

      <div class="inv-panel">
        <div class="inv-panel-head">
          <div>
            <h3>Your Business</h3>
            <div class="inv-panel-subtle">This becomes your reusable local invoicing profile.</div>
          </div>
        </div>
        ${ToolRenderers.buildUploadPreviewCard('inv-logo', 'Business logo')}
        <div class="inv-grid inv-grid-2">
          <div class="inv-input-wrap" id="field-sender-name">
            <div class="inv-field-head">
              <label for="inv-sender-name">Business / Freelancer Name</label>
              <span class="inv-coachmark" id="inv-coachmark">Start here -&gt;</span>
            </div>
            <input id="inv-sender-name" type="text" autocomplete="organization" required>
            <div class="inv-field-error" id="error-sender-name"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-logo-file">Logo</label>
            <input id="inv-logo-file" class="inv-logo-input" type="file" accept="image/png,image/jpeg,image/svg+xml">
            <div class="inv-logo-actions">
              <label class="inv-inline-btn" for="inv-logo-file">Upload Logo</label>
              <button class="inv-inline-btn is-danger" id="inv-clear-logo" type="button">Remove Logo</button>
              <span class="inv-panel-subtle">PNG, JPG, or SVG up to 2 MB. Light backgrounds are cleaned when possible.</span>
            </div>
            <div class="inv-field-error" id="error-logo"></div>
          </div>
          <div class="inv-input-wrap" id="field-sender-email">
            <label for="inv-sender-email">Email Address</label>
            <input id="inv-sender-email" type="email" autocomplete="email">
            <div class="inv-field-error" id="error-sender-email"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-sender-phone">Phone Number</label>
            <input id="inv-sender-phone" type="text" autocomplete="tel">
            <div class="inv-field-error" id="error-sender-phone"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-sender-address">Street Address</label>
            <textarea id="inv-sender-address" rows="4"></textarea>
            <div class="inv-field-error" id="error-sender-address"></div>
          </div>
          <div class="inv-input-wrap" id="field-sender-website">
            <label for="inv-sender-website">Website</label>
            <input id="inv-sender-website" type="url" inputmode="url" placeholder="https://your-site.com">
            <div class="inv-field-error" id="error-sender-website"></div>
          </div>
        </div>
        <p class="inv-privacy-note">Your info is saved locally on this device only.</p>
      </div>

      <div class="inv-panel">
        <div class="inv-panel-head">
          <div>
            <h3>Bill To</h3>
            <div class="inv-panel-subtle">Pick a recent client or start a new invoice instantly.</div>
          </div>
          <div class="inv-input-wrap" style="min-width:220px; margin:0">
            <label for="inv-recent-clients">Recent Clients</label>
            <select id="inv-recent-clients">
              <option value="">Select recent client</option>
            </select>
          </div>
        </div>
        <div class="inv-grid inv-grid-2">
          <div class="inv-input-wrap">
            <label for="inv-client-name">Client Name</label>
            <input id="inv-client-name" type="text" autocomplete="name">
            <div class="inv-field-error" id="error-client-name"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-client-company">Client Company</label>
            <input id="inv-client-company" type="text" autocomplete="organization">
            <div class="inv-field-error" id="error-client-company"></div>
          </div>
          <div class="inv-input-wrap" id="field-client-email">
            <label for="inv-client-email">Client Email</label>
            <input id="inv-client-email" type="email" autocomplete="email">
            <div class="inv-field-error" id="error-client-email"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-client-address">Client Street Address</label>
            <textarea id="inv-client-address" rows="4"></textarea>
            <div class="inv-field-error" id="error-client-address"></div>
          </div>
        </div>
      </div>

      <div class="inv-panel">
        <div class="inv-panel-head">
          <div>
            <h3>Invoice Details</h3>
            <div class="inv-panel-subtle">Template, numbering, dates, and payment terms.</div>
          </div>
        </div>
        <div class="inv-grid inv-grid-2">
          <div class="inv-input-wrap">
            <div class="inv-field-head">
              <label for="inv-number">Invoice Number</label>
              <button class="inv-inline-btn" id="inv-number-next-btn" type="button">Use Next</button>
            </div>
            <input id="inv-number" type="text">
            <div class="inv-field-error" id="error-inv-number"></div>
            <div class="inv-field-help">Type any custom invoice number, or use the next suggested sequence.</div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-currency">Currency</label>
            <select id="inv-currency"></select>
            <div class="inv-field-error" id="error-inv-currency"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-date">Invoice Date</label>
            <input id="inv-date" type="date">
            <div class="inv-field-error" id="error-inv-date"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-due-date">Due Date</label>
            <input id="inv-due-date" type="date">
            <div class="inv-field-error" id="error-inv-due-date"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-po-number">PO Number</label>
            <input id="inv-po-number" type="text">
            <div class="inv-field-error" id="error-inv-po-number"></div>
          </div>
          <div class="inv-input-wrap">
            <label for="inv-notes">Custom Notes / Payment Terms</label>
            <textarea id="inv-notes" rows="4"></textarea>
            <div class="inv-field-error" id="error-inv-notes"></div>
          </div>
        </div>
      </div>

      <div class="inv-panel">
        <div class="inv-panel-head">
          <div>
            <h3>Line Items</h3>
            <div class="inv-panel-subtle">Reorder rows by dragging the grip handle.</div>
          </div>
        </div>
        <div class="inv-items-wrap">
          <table class="inv-items-table">
            <thead>
              <tr>
                <th scope="col" style="width:116px">Actions</th>
                <th scope="col">Description</th>
                <th scope="col" style="width:110px">Quantity</th>
                <th scope="col" style="width:150px">Unit Price</th>
                <th scope="col" style="width:140px">Unit</th>
                <th scope="col" style="width:150px; text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody id="inv-items-body"></tbody>
          </table>
        </div>
        <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn btn-secondary" id="inv-add-item" aria-label="Add new line item">Add Item</button>
        </div>
      </div>

      <div class="inv-panel">
        <div class="inv-panel-head">
          <div>
            <h3>Totals</h3>
            <div class="inv-panel-subtle">Discounts, taxes, shipping, and the final total update instantly.</div>
          </div>
        </div>
        <div class="inv-summary-grid">
          <div class="inv-summary-card">
            <h4>Adjustments</h4>
            <div class="inv-grid">
              <label class="inv-toggle"><input id="inv-discount-enabled" type="checkbox"> Enable discount</label>
              <div class="inv-grid inv-grid-2">
                <div class="inv-input-wrap">
                  <label for="inv-discount-type">Discount Type</label>
                  <select id="inv-discount-type">
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                  <div class="inv-field-error"></div>
                </div>
                <div class="inv-input-wrap">
                  <label for="inv-discount-value">Discount Value</label>
                  <input id="inv-discount-value" type="number" min="0" step="0.01">
                  <div class="inv-field-error"></div>
                </div>
              </div>
              <label class="inv-toggle"><input id="inv-tax1-enabled" type="checkbox"> Enable first tax line</label>
              <div class="inv-grid inv-grid-2">
                <div class="inv-input-wrap">
                  <label for="inv-tax1-label">Tax Label</label>
                  <input id="inv-tax1-label" type="text">
                  <div class="inv-field-error"></div>
                </div>
                <div class="inv-input-wrap">
                  <label for="inv-tax1-rate">Tax Rate (%)</label>
                  <input id="inv-tax1-rate" type="number" min="0" step="0.01">
                  <div class="inv-field-error"></div>
                </div>
              </div>
              <label class="inv-toggle"><input id="inv-tax2-enabled" type="checkbox"> Enable second tax line</label>
              <div class="inv-grid inv-grid-2">
                <div class="inv-input-wrap">
                  <label for="inv-tax2-label">Tax Label</label>
                  <input id="inv-tax2-label" type="text">
                  <div class="inv-field-error"></div>
                </div>
                <div class="inv-input-wrap">
                  <label for="inv-tax2-rate">Tax Rate (%)</label>
                  <input id="inv-tax2-rate" type="number" min="0" step="0.01">
                  <div class="inv-field-error"></div>
                </div>
              </div>
              <div class="inv-grid inv-grid-2">
                <div class="inv-input-wrap">
                  <label for="inv-shipping-label">Shipping / Other Charges Label</label>
                  <input id="inv-shipping-label" type="text">
                  <div class="inv-field-error"></div>
                </div>
                <div class="inv-input-wrap">
                  <label for="inv-shipping-amount">Shipping / Other Charges Amount</label>
                  <input id="inv-shipping-amount" type="number" min="0" step="0.01">
                  <div class="inv-field-error"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="inv-summary-card">
            <h4>Live Totals</h4>
            <div class="inv-total-stack" id="inv-total-stack"></div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary inv-mobile-preview" id="inv-mobile-preview-btn" type="button">Preview Invoice</button>
    </section>

    <aside class="inv-sidebar">
      <div class="ad-space" aria-label="Advertisement"><span>Advertisement</span></div>
      <div class="inv-panel inv-preview-card">
        <div class="inv-preview-head" style="margin-bottom:14px">
          <h3>Live Preview</h3>
          <div class="inv-panel-subtle">A4-sized invoice preview with local-only PDF export.</div>
        </div>
        <div class="inv-preview-controls">
          <div class="inv-template-switcher" role="tablist" aria-label="Invoice template switcher">
            <button class="inv-template-btn" data-template="classic" type="button">Classic</button>
            <button class="inv-template-btn" data-template="modern" type="button">Modern</button>
            <button class="inv-template-btn" data-template="minimal" type="button">Minimal</button>
          </div>
          <label class="inv-color-wrap" for="inv-accent-color">
            Accent Color
            <input id="inv-accent-color" type="color" value="#7c3aed">
          </label>
        </div>
        <div class="inv-preview-frame" id="inv-preview-frame"></div>
        <div class="inv-sr-only" id="inv-live-region" aria-live="polite" aria-atomic="true"></div>
      </div>
      <div class="inv-next-steps" id="inv-next-steps">
        <h3 style="margin:0">Next Steps</h3>
        <p class="inv-panel-subtle" style="margin:8px 0 0">Keep the rest of the workflow moving in one tab.</p>
        <div class="inv-next-steps-list" id="inv-next-steps-list"></div>
      </div>
    </aside>

    <details class="inv-history" id="inv-history">
      <summary>
        <span>Invoice History</span>
        <span class="inv-badge" id="inv-history-count">0</span>
      </summary>
      <div class="inv-history-list" style="padding:18px 18px 0">
        <div class="inv-panel-actions">
          <button class="inv-inline-btn is-danger" id="inv-clear-history-btn" type="button">Clear History</button>
        </div>
      </div>
      <div class="inv-history-list" id="inv-history-list"></div>
    </details>
  </div>
</div>`;

      const nodes = {
        savedChip: container.querySelector('#inv-saved-chip'),
        errorSummary: container.querySelector('#inv-error-summary'),
        successBanner: container.querySelector('#inv-success-banner'),
        liveRegion: container.querySelector('#inv-live-region'),
        previewFrame: container.querySelector('#inv-preview-frame'),
        totalStack: container.querySelector('#inv-total-stack'),
        itemsBody: container.querySelector('#inv-items-body'),
        recentClients: container.querySelector('#inv-recent-clients'),
        historyList: container.querySelector('#inv-history-list'),
        historyCount: container.querySelector('#inv-history-count'),
        draftPanel: container.querySelector('#inv-draft-panel'),
        draftList: container.querySelector('#inv-draft-list'),
        draftCount: container.querySelector('#inv-draft-count'),
        downloadButton: container.querySelector('#inv-download-btn'),
        copyButton: container.querySelector('#inv-copy-btn'),
        printButton: container.querySelector('#inv-print-btn'),
        resetButton: container.querySelector('#inv-reset-btn'),
        saveDraftButton: container.querySelector('#inv-save-draft-btn'),
        loadDraftButton: container.querySelector('#inv-load-draft-btn'),
        clearDraftsButton: container.querySelector('#inv-clear-drafts-btn'),
        clearHistoryButton: container.querySelector('#inv-clear-history-btn'),
        nextInvoiceNumberButton: container.querySelector('#inv-number-next-btn'),
        nextSteps: container.querySelector('#inv-next-steps'),
        nextStepsList: container.querySelector('#inv-next-steps-list'),
        accentInput: container.querySelector('#inv-accent-color'),
        coachmark: container.querySelector('#inv-coachmark'),
      };

      const fieldMap = {
        'sender.name': container.querySelector('#inv-sender-name'),
        'sender.email': container.querySelector('#inv-sender-email'),
        'sender.phone': container.querySelector('#inv-sender-phone'),
        'sender.address': container.querySelector('#inv-sender-address'),
        'sender.website': container.querySelector('#inv-sender-website'),
        'client.name': container.querySelector('#inv-client-name'),
        'client.company': container.querySelector('#inv-client-company'),
        'client.email': container.querySelector('#inv-client-email'),
        'client.address': container.querySelector('#inv-client-address'),
        'invoice.number': container.querySelector('#inv-number'),
        'invoice.date': container.querySelector('#inv-date'),
        'invoice.dueDate': container.querySelector('#inv-due-date'),
        'invoice.currency': container.querySelector('#inv-currency'),
        'invoice.poNumber': container.querySelector('#inv-po-number'),
        'invoice.notes': container.querySelector('#inv-notes'),
        'invoice.accentColor': container.querySelector('#inv-accent-color'),
        'charges.discountType': container.querySelector('#inv-discount-type'),
        'charges.discountValue': container.querySelector('#inv-discount-value'),
        'charges.tax1Label': container.querySelector('#inv-tax1-label'),
        'charges.tax1Rate': container.querySelector('#inv-tax1-rate'),
        'charges.tax2Label': container.querySelector('#inv-tax2-label'),
        'charges.tax2Rate': container.querySelector('#inv-tax2-rate'),
        'charges.shippingLabel': container.querySelector('#inv-shipping-label'),
        'charges.shippingAmount': container.querySelector('#inv-shipping-amount'),
      };

      const checkboxMap = {
        'charges.discountEnabled': container.querySelector('#inv-discount-enabled'),
        'charges.tax1Enabled': container.querySelector('#inv-tax1-enabled'),
        'charges.tax2Enabled': container.querySelector('#inv-tax2-enabled'),
      };

      function flashSavedIndicator() {
        const now = Date.now();
        if (now - lastSavedStamp < 400) return;
        lastSavedStamp = now;
        nodes.savedChip.classList.add('is-visible');
        clearTimeout(nodes.savedChip.__hideTimer);
        nodes.savedChip.__hideTimer = setTimeout(() => nodes.savedChip.classList.remove('is-visible'), 1200);
      }

      function persistInvoiceState() {
        invoiceWriteJson(INVOICE_STORAGE.sender, state.sender);
        invoiceWriteJson(INVOICE_STORAGE.liveState, state);
        invoiceWriteJson(INVOICE_STORAGE.taxPrefs, {
          tax1Label: state.charges.tax1Label,
          tax1Rate: state.charges.tax1Rate,
          tax2Label: state.charges.tax2Label,
          tax2Rate: state.charges.tax2Rate,
        });
        safeLocalSet(INVOICE_STORAGE.lastNumber, state.invoice.number);
        safeLocalSet(INVOICE_STORAGE.template, state.invoice.template);
        safeLocalSet(INVOICE_STORAGE.accent, state.invoice.accentColor);
        safeLocalSet(INVOICE_STORAGE.currency, state.invoice.currency);
        updateRecentInvoiceClients(state.client);
        flashSavedIndicator();
      }

      const debouncedPersistInvoiceState = invoiceDebounce(persistInvoiceState, 500);

      function setFieldError(fieldKey, message) {
        const keyName = fieldKey.replace(/\./g, '-');
        const wrapper = container.querySelector(`#field-${keyName}`);
        const error = container.querySelector(`#error-${keyName}`);
        if (wrapper) wrapper.classList.toggle('is-error', Boolean(message));
        if (error) error.textContent = message || '';
      }

      function syncStaticFieldsToState() {
        state.sender.name = fieldMap['sender.name'].value.trimStart();
        state.sender.email = fieldMap['sender.email'].value.trim();
        state.sender.phone = fieldMap['sender.phone'].value.trim();
        state.sender.address = fieldMap['sender.address'].value.trim();
        state.sender.website = fieldMap['sender.website'].value.trim();
        state.client.name = fieldMap['client.name'].value.trimStart();
        state.client.company = fieldMap['client.company'].value.trimStart();
        state.client.email = fieldMap['client.email'].value.trim();
        state.client.address = fieldMap['client.address'].value.trim();
        state.invoice.number = fieldMap['invoice.number'].value.trim() || getNextInvoiceNumber();
        state.invoice.date = fieldMap['invoice.date'].value || todayIsoDate();
        state.invoice.dueDate = fieldMap['invoice.dueDate'].value || addDaysIsoDate(state.invoice.date, 30);
        state.invoice.currency = fieldMap['invoice.currency'].value || 'USD';
        state.invoice.poNumber = fieldMap['invoice.poNumber'].value.trim();
        state.invoice.notes = fieldMap['invoice.notes'].value.trim();
        state.invoice.accentColor = fieldMap['invoice.accentColor'].value || '#7c3aed';
        state.charges.discountEnabled = checkboxMap['charges.discountEnabled'].checked;
        state.charges.discountType = fieldMap['charges.discountType'].value || 'percent';
        state.charges.discountValue = fieldMap['charges.discountValue'].value;
        state.charges.tax1Enabled = checkboxMap['charges.tax1Enabled'].checked;
        state.charges.tax1Label = fieldMap['charges.tax1Label'].value.trim() || 'Tax';
        state.charges.tax1Rate = fieldMap['charges.tax1Rate'].value;
        state.charges.tax2Enabled = checkboxMap['charges.tax2Enabled'].checked;
        state.charges.tax2Label = fieldMap['charges.tax2Label'].value.trim() || 'Tax';
        state.charges.tax2Rate = fieldMap['charges.tax2Rate'].value;
        state.charges.shippingLabel = fieldMap['charges.shippingLabel'].value.trim() || 'Shipping';
        state.charges.shippingAmount = fieldMap['charges.shippingAmount'].value;
      }

      function fillStaticFieldsFromState() {
        fieldMap['sender.name'].value = state.sender.name || '';
        fieldMap['sender.email'].value = state.sender.email || '';
        fieldMap['sender.phone'].value = state.sender.phone || '';
        fieldMap['sender.address'].value = state.sender.address || '';
        fieldMap['sender.website'].value = state.sender.website || '';
        fieldMap['client.name'].value = state.client.name || '';
        fieldMap['client.company'].value = state.client.company || '';
        fieldMap['client.email'].value = state.client.email || '';
        fieldMap['client.address'].value = state.client.address || '';
        fieldMap['invoice.number'].value = state.invoice.number || getNextInvoiceNumber();
        fieldMap['invoice.date'].value = state.invoice.date || todayIsoDate();
        fieldMap['invoice.dueDate'].value = state.invoice.dueDate || addDaysIsoDate(fieldMap['invoice.date'].value, 30);
        fieldMap['invoice.currency'].value = state.invoice.currency || 'USD';
        fieldMap['invoice.poNumber'].value = state.invoice.poNumber || '';
        fieldMap['invoice.notes'].value = state.invoice.notes || '';
        fieldMap['invoice.accentColor'].value = state.invoice.accentColor || '#7c3aed';
        fieldMap['charges.discountType'].value = state.charges.discountType || 'percent';
        fieldMap['charges.discountValue'].value = state.charges.discountValue || '';
        fieldMap['charges.tax1Label'].value = state.charges.tax1Label || 'Tax';
        fieldMap['charges.tax1Rate'].value = state.charges.tax1Rate || '';
        fieldMap['charges.tax2Label'].value = state.charges.tax2Label || 'Tax';
        fieldMap['charges.tax2Rate'].value = state.charges.tax2Rate || '';
        fieldMap['charges.shippingLabel'].value = state.charges.shippingLabel || 'Shipping';
        fieldMap['charges.shippingAmount'].value = state.charges.shippingAmount || '';
        checkboxMap['charges.discountEnabled'].checked = Boolean(state.charges.discountEnabled);
        checkboxMap['charges.tax1Enabled'].checked = Boolean(state.charges.tax1Enabled);
        checkboxMap['charges.tax2Enabled'].checked = Boolean(state.charges.tax2Enabled);
        nodes.accentInput.disabled = (state.invoice.template || 'modern') !== 'modern';
        Object.keys(fieldMap).forEach((key) => {
          if (fieldMap[key] && fieldMap[key].tagName === 'TEXTAREA') {
            fieldMap[key].style.height = 'auto';
            fieldMap[key].style.height = `${Math.max(fieldMap[key].scrollHeight, 96)}px`;
          }
        });
      }

      function renderCurrencyOptions() {
        fieldMap['invoice.currency'].innerHTML = INVOICE_CURRENCIES.map((currency) => `<option value="${currency.code}">${currency.label}</option>`).join('');
      }

      function renderRecentClients() {
        const recent = invoiceReadJson(INVOICE_STORAGE.recentClients, []);
        nodes.recentClients.innerHTML = ['<option value="">Select recent client</option>', ...recent.map((client, index) => `<option value="${index}">${escapeHtml(client.name || client.company || `Client ${index + 1}`)}</option>`)].join('');
      }

      function renderLineItems() {
        nodes.itemsBody.innerHTML = state.items.map((item, index) => `
          <tr class="inv-item-row" data-item-id="${escapeHtml(item.id)}" draggable="true">
            <td>
              <div class="inv-item-actions">
                <button class="inv-icon-btn" type="button" data-action="drag" aria-label="Reorder line item ${index + 1}" title="Drag to reorder">#</button>
                <button class="inv-icon-btn is-danger" type="button" data-action="delete" aria-label="Remove line item ${index + 1}" title="Remove line item">&times;</button>
              </div>
            </td>
            <td>
              <textarea rows="2" data-field="description" aria-describedby="item-error-desc-${escapeHtml(item.id)}">${escapeHtml(item.description || '')}</textarea>
              <div class="inv-field-error" id="item-error-desc-${escapeHtml(item.id)}"></div>
            </td>
            <td>
              <input type="number" min="0" step="0.01" data-field="quantity" value="${escapeHtml(String(item.quantity ?? '1'))}">
            </td>
            <td>
              <input type="number" min="0" step="0.01" data-field="unitPrice" aria-describedby="item-error-price-${escapeHtml(item.id)}" value="${escapeHtml(String(item.unitPrice || ''))}">
              <div class="inv-field-error" id="item-error-price-${escapeHtml(item.id)}"></div>
            </td>
            <td>
              <input type="text" data-field="unit" value="${escapeHtml(item.unit || '')}">
            </td>
            <td>
              <div class="inv-row-amount" data-role="amount">${invoiceFormatMoney(parsePositiveNumber(item.quantity) * parsePositiveNumber(item.unitPrice), state.invoice.currency)}</div>
            </td>
          </tr>`).join('');
        nodes.itemsBody.querySelectorAll('textarea').forEach((textarea) => {
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.max(textarea.scrollHeight, 52)}px`;
        });
      }

      function updateLineItemAmounts(totals) {
        const amountMap = new Map(totals.items.map((item) => [item.id, item.amount]));
        nodes.itemsBody.querySelectorAll('tr[data-item-id]').forEach((row) => {
          const amountNode = row.querySelector('[data-role="amount"]');
          if (!amountNode) return;
          amountNode.textContent = invoiceFormatMoney(amountMap.get(row.dataset.itemId) || 0, state.invoice.currency);
        });
      }

      function syncLineItemsFromDom() {
        state.items = Array.from(nodes.itemsBody.querySelectorAll('tr[data-item-id]')).map((row) => ({
          id: row.dataset.itemId,
          description: row.querySelector('[data-field="description"]').value.trim(),
          quantity: row.querySelector('[data-field="quantity"]').value,
          unitPrice: row.querySelector('[data-field="unitPrice"]').value,
          unit: row.querySelector('[data-field="unit"]').value.trim(),
        }));
      }

      function updateLineItemRowErrors() {
        state.items.forEach((item) => {
          const descriptionError = touched[`item.description.${item.id}`] ? invoiceFieldValidity('item.description', state, item.id) : '';
          const priceError = touched[`item.unitPrice.${item.id}`] ? invoiceFieldValidity('item.unitPrice', state, item.id) : '';
          const descriptionNode = container.querySelector(`#item-error-desc-${item.id}`);
          const priceNode = container.querySelector(`#item-error-price-${item.id}`);
          if (descriptionNode) descriptionNode.textContent = descriptionError;
          if (priceNode) priceNode.textContent = priceError;
        });
      }

      function renderTotals(totals) {
        const lines = [
          `<div class="inv-total-line"><span>Subtotal</span><strong>${invoiceFormatMoney(totals.subtotal, state.invoice.currency)}</strong></div>`,
          state.charges.discountEnabled ? `<div class="inv-total-line"><span>Discount</span><strong>-${invoiceFormatMoney(totals.discount, state.invoice.currency)}</strong></div>` : '',
          state.charges.tax1Enabled ? `<div class="inv-total-line"><span>${escapeHtml(state.charges.tax1Label || 'Tax')}</span><strong>${invoiceFormatMoney(totals.tax1, state.invoice.currency)}</strong></div>` : '',
          state.charges.tax2Enabled ? `<div class="inv-total-line"><span>${escapeHtml(state.charges.tax2Label || 'Tax')}</span><strong>${invoiceFormatMoney(totals.tax2, state.invoice.currency)}</strong></div>` : '',
          parsePositiveNumber(state.charges.shippingAmount) > 0 ? `<div class="inv-total-line"><span>${escapeHtml(state.charges.shippingLabel || 'Shipping')}</span><strong>${invoiceFormatMoney(totals.shipping, state.invoice.currency)}</strong></div>` : '',
          `<div class="inv-total-line is-grand"><span>Total</span><strong>${invoiceFormatMoney(totals.total, state.invoice.currency)}</strong></div>`,
        ].join('');
        nodes.totalStack.innerHTML = lines;
      }

      const schedulePreviewFit = invoiceDebounce(() => {
        if (!container.isConnected) return;
        const preview = container.querySelector('#invoice-preview');
        const stage = container.querySelector('#inv-preview-stage');
        const shell = container.querySelector('.inv-preview-shell');
        if (!preview || !stage || !shell) return;
        const frameStyles = window.getComputedStyle(nodes.previewFrame);
        const availableWidth = nodes.previewFrame.clientWidth
          - parseFloat(frameStyles.paddingLeft || '0')
          - parseFloat(frameStyles.paddingRight || '0');
        const naturalWidth = preview.offsetWidth || 820;
        const naturalHeight = preview.offsetHeight || preview.scrollHeight || 1120;
        const scale = availableWidth > 0 ? Math.min(1, availableWidth / naturalWidth) : 1;
        stage.style.transform = `scale(${scale})`;
        shell.style.width = `${naturalWidth * scale}px`;
        shell.style.height = `${naturalHeight * scale}px`;
      }, 24);

      function renderPreview(totals) {
        nodes.previewFrame.innerHTML = buildPreviewMarkup(state, totals);
        requestAnimationFrame(() => schedulePreviewFit());
      }

      const debouncedRenderPreview = invoiceDebounce((totals) => renderPreview(totals), 100);

      function renderHistory() {
        nodes.historyCount.textContent = String(history.length);
        nodes.historyList.innerHTML = history.length ? history.map((entry) => `
          <article class="inv-history-item">
            <div>
              <h4>${escapeHtml(entry.invoiceNumber || 'Invoice')}</h4>
              <div class="inv-history-meta">
                ${escapeHtml(entry.clientName || 'Client')}<br>
                ${escapeHtml(entry.date || '')} - ${invoiceFormatMoney(entry.amount || 0, entry.currency || 'USD')}
              </div>
            </div>
            <div class="inv-history-actions">
              <button class="inv-inline-btn" type="button" data-history-action="reuse" data-history-id="${escapeHtml(entry.id)}">Re-use</button>
              <button class="inv-inline-btn is-danger" type="button" data-history-action="delete" data-history-id="${escapeHtml(entry.id)}">Delete</button>
              <label class="inv-toggle"><input type="checkbox" data-history-action="paid" data-history-id="${escapeHtml(entry.id)}"${entry.status === 'paid' ? ' checked' : ''}> Mark as Paid</label>
            </div>
          </article>`).join('') : '<div class="inv-panel-subtle">Downloaded invoices appear here for quick reuse.</div>';
        if (nodes.clearHistoryButton) nodes.clearHistoryButton.hidden = !history.length;
      }

      function renderDrafts() {
        const drafts = getDraftRecords();
        nodes.draftCount.textContent = String(drafts.length);
        nodes.draftList.innerHTML = drafts.length ? drafts.map((draft) => `
          <article class="inv-draft-item">
            <div>
              <h4>${escapeHtml(draft.invoiceNumber || draft.clientName || 'Saved draft')}</h4>
              <div class="inv-draft-meta">
                ${escapeHtml(draft.clientName || 'Client')}<br>
                ${new Date(draft.savedAt || Date.now()).toLocaleString()} - ${invoiceFormatMoney(draft.total || 0, draft.currency || 'USD')}
              </div>
            </div>
            <div class="inv-draft-actions">
              <button class="inv-inline-btn" type="button" data-draft-action="restore" data-draft-key="${escapeHtml(draft.key)}">Restore</button>
              <button class="inv-inline-btn is-danger" type="button" data-draft-action="delete" data-draft-key="${escapeHtml(draft.key)}">Delete</button>
            </div>
          </article>`).join('') : '<div class="inv-panel-subtle">No saved drafts yet.</div>';
        if (nodes.clearDraftsButton) nodes.clearDraftsButton.hidden = !drafts.length;
      }

      function renderNextSteps() {
        nodes.nextStepsList.innerHTML = DOWNLOAD_LINKS.map((link) => `
          <a class="inv-next-link" href="${escapeHtml(link.href)}">
            <div>
              <strong>${escapeHtml(link.title)}</strong>
              <span>${escapeHtml(link.description)}</span>
            </div>
            <span aria-hidden="true">&rsaquo;</span>
          </a>`).join('');
      }

      function showErrorSummary(messages) {
        const list = Array.isArray(messages) ? messages : [messages];
        nodes.errorSummary.innerHTML = `<strong>Before we generate the PDF:</strong><ul style="margin:10px 0 0 18px">${list.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul>`;
        nodes.errorSummary.classList.add('is-visible');
      }

      function hideErrorSummary() {
        nodes.errorSummary.classList.remove('is-visible');
        nodes.errorSummary.textContent = '';
      }

      function showSuccessBanner() {
        nodes.successBanner.innerHTML = `Invoice downloaded! Want to compress it? <a href="/pdf-compressor">Open PDF Compressor</a>`;
        nodes.successBanner.classList.add('is-visible');
        nodes.liveRegion.textContent = 'Invoice downloaded successfully.';
        nodes.nextSteps.classList.add('is-visible');
      }

      function hideSuccessBanner() {
        nodes.successBanner.classList.remove('is-visible');
        nodes.successBanner.textContent = '';
        nodes.liveRegion.textContent = '';
        nodes.nextSteps.classList.remove('is-visible');
      }

      function updateLogoPreview() {
        if (state.sender.logoData) {
          ToolRenderers.setUploadPreviewCard('inv-logo', {
            url: state.sender.logoData,
            title: state.sender.logoName || 'Logo ready',
            meta: state.sender.logoName ? 'Saved for future invoices on this device.' : '',
            alt: 'Business logo preview',
          });
        } else {
          ToolRenderers.hideUploadPreviewCard('inv-logo');
        }
        container.querySelector('#error-logo').textContent = logoError;
      }

      function updateTouchedField(fieldKey) {
        touched[fieldKey] = true;
        if (fieldKey === 'sender.name') safeLocalSet(INVOICE_STORAGE.coachSeen, '1');
        const itemMatch = fieldKey.match(/^item\.(description|unitPrice)\.(.+)$/);
        if (itemMatch) {
          updateLineItemRowErrors();
          return;
        }
        const message = invoiceFieldValidity(fieldKey, state);
        const normalized = fieldKey.replace('invoice.dueDate', 'invoice-due-date');
        if (fieldKey === 'sender.name') setFieldError('sender.name', message);
        if (fieldKey === 'sender.email') setFieldError('sender.email', message);
        if (fieldKey === 'sender.website') setFieldError('sender.website', message);
        if (fieldKey === 'client.email') setFieldError('client.email', message);
      }

      function validateForPdf() {
        const issues = [];
        if (!state.sender.name.trim()) issues.push('Add your business or freelancer name.');
        const hasAtLeastOneItem = state.items.some((item) => hasCompleteLineItem(item));
        if (!hasAtLeastOneItem) issues.push('Add at least one line item with a description and price.');
        const unfinishedLines = state.items.filter((item) => {
          const hasDescription = Boolean(String(item.description || '').trim());
          const hasPrice = Boolean(String(item.unitPrice || '').trim());
          return (hasDescription || hasPrice) && !hasCompleteLineItem(item);
        });
        if (unfinishedLines.length) issues.push('Finish or remove incomplete line items before downloading.');
        return issues;
      }

      function refreshInvoiceUi() {
        syncStaticFieldsToState();
        const totals = calculateInvoiceTotals(state);
        updateLineItemAmounts(totals);
        renderTotals(totals);
        debouncedRenderPreview(totals);
        updateLineItemRowErrors();
        debouncedPersistInvoiceState();
        return totals;
      }

      function replaceInvoiceState(nextState, options = {}) {
        state = normalizeInvoiceState(nextState);
        touched = {};
        logoError = '';
        hideErrorSummary();
        hideSuccessBanner();
        renderAll();
        refreshInvoiceUi();
        if (options.toast) App.toast(options.toast);
      }

      function buildFreshInvoiceState() {
        return createDefaultInvoiceState({
          sender: state.sender,
          invoice: {
            currency: state.invoice.currency || 'USD',
            template: state.invoice.template || 'modern',
            accentColor: state.invoice.accentColor || '#7c3aed',
          },
        });
      }

      function clearAllDrafts() {
        const drafts = getDraftRecords();
        drafts.forEach((draft) => localStorage.removeItem(draft.key));
        renderDrafts();
        if (!getDraftRecords().length) nodes.draftPanel.classList.remove('is-open');
      }

      function renderAll() {
        renderCurrencyOptions();
        renderRecentClients();
        fillStaticFieldsFromState();
        renderLineItems();
        renderHistory();
        renderDrafts();
        renderNextSteps();
        updateLogoPreview();
        const totals = calculateInvoiceTotals(state);
        renderTotals(totals);
        renderPreview(totals);
        const coachSeen = safeLocalRead(INVOICE_STORAGE.coachSeen, '') === '1';
        nodes.coachmark.style.display = coachSeen || state.sender.name.trim() ? 'none' : '';
      }

      renderAll();

      Object.keys(fieldMap).forEach((fieldKey) => {
        const input = fieldMap[fieldKey];
        if (!input) return;
        input.addEventListener('input', () => {
          if (fieldKey === 'sender.name' && input.value.trim()) nodes.coachmark.style.display = 'none';
          if (input.tagName === 'TEXTAREA') {
            input.style.height = 'auto';
            input.style.height = `${Math.max(input.scrollHeight, 96)}px`;
          }
          hideErrorSummary();
          refreshInvoiceUi();
        });
        input.addEventListener('blur', () => {
          syncStaticFieldsToState();
          updateTouchedField(fieldKey);
        });
      });

      Object.keys(checkboxMap).forEach((fieldKey) => {
        const checkbox = checkboxMap[fieldKey];
        checkbox.addEventListener('change', () => {
          hideErrorSummary();
          refreshInvoiceUi();
        });
      });

      container.querySelectorAll('[data-template]').forEach((button) => {
        const updateTemplateButtons = () => {
          container.querySelectorAll('[data-template]').forEach((candidate) => candidate.classList.toggle('is-active', candidate.dataset.template === state.invoice.template));
        };
        button.addEventListener('click', () => {
          state.invoice.template = button.dataset.template;
          updateTemplateButtons();
          nodes.accentInput.disabled = state.invoice.template !== 'modern';
          refreshInvoiceUi();
        });
        updateTemplateButtons();
      });

      nodes.itemsBody.addEventListener('input', (event) => {
        const field = event.target.closest('[data-field]');
        if (!field) return;
        if (field.tagName === 'TEXTAREA') {
          field.style.height = 'auto';
          field.style.height = `${Math.max(field.scrollHeight, 52)}px`;
        }
        syncLineItemsFromDom();
        refreshInvoiceUi();
      });

      nodes.itemsBody.addEventListener('blur', (event) => {
        const field = event.target.closest('[data-field]');
        if (!field) return;
        const row = event.target.closest('tr[data-item-id]');
        if (!row) return;
        touched[`item.${field.dataset.field}.${row.dataset.itemId}`] = true;
        syncLineItemsFromDom();
        updateLineItemRowErrors();
      }, true);

      nodes.itemsBody.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="delete"]');
        if (!button) return;
        const row = button.closest('tr[data-item-id]');
        if (!row) return;
        state.items = state.items.filter((item) => item.id !== row.dataset.itemId);
        if (!state.items.length) state.items.push(createBlankItem());
        renderLineItems();
        refreshInvoiceUi();
      });

      nodes.itemsBody.addEventListener('dragstart', (event) => {
        const row = event.target.closest('tr[data-item-id]');
        if (!row) return;
        draggedItemId = row.dataset.itemId;
        row.classList.add('inv-dragging');
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', draggedItemId);
        }
      });

      nodes.itemsBody.addEventListener('dragover', (event) => {
        event.preventDefault();
        const dragging = nodes.itemsBody.querySelector('.inv-dragging');
        if (!dragging) return;
        const rows = [...nodes.itemsBody.querySelectorAll('tr[data-item-id]:not(.inv-dragging)')];
        const afterElement = rows.find((row) => event.clientY <= row.getBoundingClientRect().top + (row.getBoundingClientRect().height / 2));
        if (afterElement) nodes.itemsBody.insertBefore(dragging, afterElement);
        else nodes.itemsBody.appendChild(dragging);
      });

      nodes.itemsBody.addEventListener('dragend', () => {
        nodes.itemsBody.querySelectorAll('.inv-dragging').forEach((row) => row.classList.remove('inv-dragging'));
        if (!draggedItemId) return;
        syncLineItemsFromDom();
        refreshInvoiceUi();
        draggedItemId = null;
      });

      container.querySelector('#inv-add-item').addEventListener('click', () => {
        state.items.push(createBlankItem());
        renderLineItems();
        refreshInvoiceUi();
      });

      container.querySelector('#inv-logo-file').addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
          const result = await compressInvoiceLogo(file);
          state.sender.logoData = result.dataUrl;
          state.sender.logoName = result.fileName;
          logoError = '';
          updateLogoPreview();
          refreshInvoiceUi();
        } catch (error) {
          logoError = String(error.message || error);
          updateLogoPreview();
        } finally {
          event.target.value = '';
        }
      });

      container.querySelector('#inv-clear-logo').addEventListener('click', () => {
        state.sender.logoData = '';
        state.sender.logoName = '';
        logoError = '';
        updateLogoPreview();
        refreshInvoiceUi();
      });

      nodes.recentClients.addEventListener('change', () => {
        const recent = invoiceReadJson(INVOICE_STORAGE.recentClients, []);
        const selected = recent[Number(nodes.recentClients.value)];
        if (!selected) return;
        state.client = {
          name: selected.name || '',
          company: selected.company || '',
          email: selected.email || '',
          address: selected.address || '',
        };
        fillStaticFieldsFromState();
        refreshInvoiceUi();
      });

      nodes.loadDraftButton.addEventListener('click', () => {
        nodes.draftPanel.classList.toggle('is-open');
      });

      nodes.resetButton.addEventListener('click', () => {
        if (!window.confirm('Start a fresh invoice? Your saved business profile stays, and the current invoice fields will be cleared.')) return;
        replaceInvoiceState(buildFreshInvoiceState(), { toast: 'Fresh invoice ready.' });
      });

      nodes.nextInvoiceNumberButton.addEventListener('click', () => {
        state.invoice.number = getNextInvoiceNumber();
        fieldMap['invoice.number'].value = state.invoice.number;
        refreshInvoiceUi();
        App.toast('Invoice number updated.');
      });

      nodes.clearDraftsButton.addEventListener('click', () => {
        const draftCount = getDraftRecords().length;
        if (!draftCount) return;
        if (!window.confirm(`Delete all ${draftCount} saved draft${draftCount === 1 ? '' : 's'} from this device?`)) return;
        clearAllDrafts();
        App.toast('Drafts deleted.');
      });

      nodes.draftList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-draft-action]');
        if (!button) return;
        const key = button.dataset.draftKey;
        if (!key) return;
        if (button.dataset.draftAction === 'delete') {
          if (!window.confirm('Delete this saved draft from this device?')) return;
          localStorage.removeItem(key);
          renderDrafts();
          if (!getDraftRecords().length) nodes.draftPanel.classList.remove('is-open');
          App.toast('Draft deleted.');
          return;
        }
        const draft = safeLocalGet(key, null);
        if (!draft || !draft.state) return;
        replaceInvoiceState(draft.state, { toast: 'Draft restored.' });
      });

      nodes.historyList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-history-action="reuse"]');
        const deleteButton = event.target.closest('[data-history-action="delete"]');
        if (deleteButton) {
          const historyId = deleteButton.dataset.historyId;
          if (!historyId) return;
          if (!window.confirm('Delete this invoice from local history?')) return;
          history = history.filter((item) => item.id !== historyId);
          invoiceWriteJson(INVOICE_STORAGE.history, history);
          renderHistory();
          App.toast('History entry deleted.');
          return;
        }
        if (!button) return;
        const entry = history.find((item) => item.id === button.dataset.historyId);
        if (!entry || !entry.snapshot) return;
        const nextState = createDefaultInvoiceState({
          sender: state.sender,
          client: entry.snapshot.client || {},
          invoice: {
            currency: entry.snapshot.invoice?.currency || state.invoice.currency,
            poNumber: entry.snapshot.invoice?.poNumber || '',
            notes: entry.snapshot.invoice?.notes || '',
            template: state.invoice.template,
            accentColor: state.invoice.accentColor,
          },
          charges: entry.snapshot.charges || {},
        });
        nextState.items = (entry.snapshot.items || []).map((item) => createBlankItem(item));
        while (nextState.items.length < 3) nextState.items.push(createBlankItem());
        replaceInvoiceState(nextState, { toast: 'Invoice loaded as a new starting point.' });
      });

      nodes.historyList.addEventListener('change', (event) => {
        const checkbox = event.target.closest('[data-history-action="paid"]');
        if (!checkbox) return;
        history = history.map((entry) => entry.id === checkbox.dataset.historyId ? { ...entry, status: checkbox.checked ? 'paid' : 'unpaid' } : entry);
        invoiceWriteJson(INVOICE_STORAGE.history, history);
        renderHistory();
      });

      nodes.clearHistoryButton.addEventListener('click', () => {
        if (!history.length) return;
        if (!window.confirm(`Clear all ${history.length} invoice history entr${history.length === 1 ? 'y' : 'ies'} from this device?`)) return;
        history = [];
        invoiceWriteJson(INVOICE_STORAGE.history, history);
        renderHistory();
        App.toast('Invoice history cleared.');
      });

      nodes.saveDraftButton.addEventListener('click', () => {
        hideErrorSummary();
        syncStaticFieldsToState();
        syncLineItemsFromDom();
        const totals = calculateInvoiceTotals(state);
        saveInvoiceDraft(state, totals);
        renderDrafts();
        App.toast('Draft saved locally.');
      });

      nodes.copyButton.addEventListener('click', async () => {
        syncStaticFieldsToState();
        syncLineItemsFromDom();
        const totals = calculateInvoiceTotals(state);
        await copyToClipboard(buildPortableInvoiceHtml(state, totals), nodes.copyButton);
      });

      nodes.printButton.addEventListener('click', () => {
        syncStaticFieldsToState();
        syncLineItemsFromDom();
        const totals = calculateInvoiceTotals(state);
        const printWindow = window.open('', '_blank', 'noopener,width=1100,height=900');
        if (!printWindow) {
          App.toast('Allow pop-ups to print the invoice.', 'error');
          return;
        }
        printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(state.invoice.number || 'Invoice')}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f3f4f6;padding:24px;font-family:Inter,Arial,sans-serif}@page{size:A4;margin:12mm} @media print{body{background:#fff;padding:0}}</style></head><body>${buildPortableInvoiceHtml(state, totals)}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      });

      async function handleDownloadPdf() {
        if (isGenerating) return;
        syncStaticFieldsToState();
        syncLineItemsFromDom();
        const issues = validateForPdf();
        if (issues.length) {
          touched['sender.name'] = true;
          state.items.forEach((item) => {
            touched[`item.description.${item.id}`] = true;
            touched[`item.unitPrice.${item.id}`] = true;
          });
          updateTouchedField('sender.name');
          updateLineItemRowErrors();
          showErrorSummary(issues);
          return;
        }
        hideErrorSummary();
        const totals = calculateInvoiceTotals(state);
        const originalHtml = nodes.downloadButton.innerHTML;
        isGenerating = true;
        nodes.downloadButton.disabled = true;
        nodes.downloadButton.innerHTML = '<span class="inv-spinner" aria-hidden="true"></span> Generating your invoice...';
        try {
          const exportSurface = createInvoicePdfRenderSurface(state, totals);
          try {
            await downloadInvoicePreviewPdf(exportSurface.preview, invoiceFileName(state));
          } finally {
            exportSurface.cleanup();
          }
          history = recordInvoiceHistory(history, state, totals);
          renderHistory();
          renderDrafts();
          updateRecentInvoiceClients(state.client);
          showSuccessBanner();
        } catch (error) {
          showErrorSummary([`The PDF could not be generated: ${String(error.message || error)}`]);
        } finally {
          nodes.downloadButton.disabled = false;
          nodes.downloadButton.innerHTML = originalHtml;
          isGenerating = false;
        }
      }

      nodes.downloadButton.addEventListener('click', handleDownloadPdf);

      container.querySelector('#inv-mobile-preview-btn').addEventListener('click', () => {
        container.querySelector('#inv-preview-frame').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      if (typeof ResizeObserver !== 'undefined') {
        const previewResizeObserver = new ResizeObserver(() => schedulePreviewFit());
        previewResizeObserver.observe(nodes.previewFrame);
      } else {
        window.addEventListener('resize', schedulePreviewFit);
      }

      document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && container.isConnected) {
          event.preventDefault();
          handleDownloadPdf();
        }
      });
    },
  });
})();
