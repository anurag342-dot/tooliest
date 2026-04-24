// ============================================
// TOOLIEST.COM - Tool Renderers Email Signature Generator
// ============================================

(function () {
  const STORAGE_KEY = 'tooliest_email_sig_data';
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const MAX_SOCIAL_LINKS = 4;
  const PREVIEW_DEBOUNCE = 150;
  const SAVE_DEBOUNCE = 500;

  const SAMPLE_VALUES = {
    fullName: 'Your Name',
    jobTitle: 'CEO',
    companyName: 'Acme Inc',
    department: '',
    email: 'you@acme.com',
    phone: '+1 (555) 123-4567',
    mobile: '',
    website: 'https://acme.com',
    address: '123 Market Street, San Francisco',
  };

  const FONT_OPTIONS = [
    { id: 'Arial', label: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
    { id: 'Georgia', label: 'Georgia', stack: 'Georgia, Times, serif' },
    { id: 'Trebuchet MS', label: 'Trebuchet MS', stack: '"Trebuchet MS", Tahoma, sans-serif' },
    { id: 'Verdana', label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
    { id: 'Tahoma', label: 'Tahoma', stack: 'Tahoma, Geneva, sans-serif' },
  ];

  const FONT_LOOKUP = FONT_OPTIONS.reduce((map, option) => {
    map[option.id] = option;
    return map;
  }, {});

  const SIZE_OPTIONS = {
    small: { id: 'small', label: 'Small', base: 12, name: 20, title: 13, subtle: 11, avatar: 64, logoWidth: 106, logoHeight: 34 },
    medium: { id: 'medium', label: 'Medium', base: 13, name: 22, title: 14, subtle: 11, avatar: 72, logoWidth: 112, logoHeight: 36 },
    large: { id: 'large', label: 'Large', base: 14, name: 24, title: 15, subtle: 12, avatar: 80, logoWidth: 118, logoHeight: 38 },
  };

  const WIDTH_OPTIONS = [400, 500, 600];

  const TEMPLATE_OPTIONS = [
    { id: 'professional', label: 'Professional' },
    { id: 'executive', label: 'Executive' },
    { id: 'creative', label: 'Creative' },
  ];

  const SOCIAL_OPTIONS = [
    { id: 'linkedin', label: 'LinkedIn', badge: 'in', placeholder: 'https://linkedin.com/in/yourname' },
    { id: 'twitter', label: 'Twitter / X', badge: 'X', placeholder: 'https://x.com/yourname' },
    { id: 'github', label: 'GitHub', badge: 'GH', placeholder: 'https://github.com/yourname' },
    { id: 'instagram', label: 'Instagram', badge: 'IG', placeholder: 'https://instagram.com/yourname' },
    { id: 'youtube', label: 'YouTube', badge: 'YT', placeholder: 'https://youtube.com/@yourchannel' },
    { id: 'custom', label: 'Custom Link', badge: 'Link', placeholder: 'https://example.com' },
  ];

  const escapeHtml = (value) => ToolRenderers.escapeHtml(value);
  const escapeAttr = (value) => ToolRenderers.escapeAttr(value);

  function debounce(fn, wait) {
    let timeoutId = null;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createDefaultState() {
    return {
      fullName: SAMPLE_VALUES.fullName,
      jobTitle: SAMPLE_VALUES.jobTitle,
      companyName: SAMPLE_VALUES.companyName,
      department: SAMPLE_VALUES.department,
      email: SAMPLE_VALUES.email,
      phone: SAMPLE_VALUES.phone,
      mobile: SAMPLE_VALUES.mobile,
      website: SAMPLE_VALUES.website,
      address: SAMPLE_VALUES.address,
      template: 'professional',
      accentColor: '#0066CC',
      font: 'Arial',
      fontSize: 'medium',
      width: 500,
      logoPosition: 'right',
      disclaimerEnabled: false,
      disclaimer: '',
      previewClient: 'gmail',
      mobilePreview: false,
      profilePhotoData: '',
      profilePhotoName: '',
      profilePhotoWidth: 96,
      profilePhotoHeight: 96,
      companyLogoData: '',
      companyLogoName: '',
      companyLogoWidth: 120,
      companyLogoHeight: 40,
      social: SOCIAL_OPTIONS.reduce((accumulator, option) => {
        accumulator[option.id] = {
          enabled: false,
          label: option.id === 'custom' ? 'Portfolio' : '',
          url: '',
        };
        return accumulator;
      }, {}),
    };
  }

  function normalizeHexColor(value, fallback = '#0066CC') {
    const raw = String(value || '').trim();
    const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(prefixed)) return prefixed.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(prefixed)) {
      const [red, green, blue] = prefixed.slice(1).split('');
      return `#${red}${red}${green}${green}${blue}${blue}`.toUpperCase();
    }
    return fallback.toUpperCase();
  }

  function normalizeState(rawValue) {
    const base = createDefaultState();
    if (!rawValue || typeof rawValue !== 'object') return base;

    const nextState = {
      ...base,
      ...rawValue,
    };

    nextState.template = TEMPLATE_OPTIONS.some((template) => template.id === String(nextState.template || '').toLowerCase())
      ? String(nextState.template).toLowerCase()
      : base.template;
    nextState.font = FONT_LOOKUP[nextState.font] ? nextState.font : base.font;
    nextState.fontSize = SIZE_OPTIONS[String(nextState.fontSize || '').toLowerCase()]
      ? String(nextState.fontSize).toLowerCase()
      : base.fontSize;
    nextState.width = WIDTH_OPTIONS.includes(Number(nextState.width)) ? Number(nextState.width) : base.width;
    nextState.logoPosition = String(nextState.logoPosition || '').toLowerCase() === 'left' ? 'left' : 'right';
    nextState.accentColor = normalizeHexColor(nextState.accentColor, base.accentColor);
    nextState.previewClient = String(nextState.previewClient || '').toLowerCase() === 'outlook' ? 'outlook' : 'gmail';
    nextState.mobilePreview = Boolean(nextState.mobilePreview);
    nextState.disclaimerEnabled = Boolean(nextState.disclaimerEnabled);
    nextState.profilePhotoData = String(nextState.profilePhotoData || '');
    nextState.profilePhotoName = String(nextState.profilePhotoName || '');
    nextState.profilePhotoWidth = Number(nextState.profilePhotoWidth) || base.profilePhotoWidth;
    nextState.profilePhotoHeight = Number(nextState.profilePhotoHeight) || base.profilePhotoHeight;
    nextState.companyLogoData = String(nextState.companyLogoData || '');
    nextState.companyLogoName = String(nextState.companyLogoName || '');
    nextState.companyLogoWidth = Number(nextState.companyLogoWidth) || base.companyLogoWidth;
    nextState.companyLogoHeight = Number(nextState.companyLogoHeight) || base.companyLogoHeight;

    nextState.social = SOCIAL_OPTIONS.reduce((accumulator, option) => {
      const saved = rawValue.social && typeof rawValue.social === 'object' ? rawValue.social[option.id] || {} : {};
      accumulator[option.id] = {
        enabled: Boolean(saved.enabled),
        label: String(saved.label || (option.id === 'custom' ? 'Portfolio' : '')),
        url: String(saved.url || ''),
      };
      return accumulator;
    }, {});

    return nextState;
  }

  function readStoredState() {
    return normalizeState(safeLocalGet(STORAGE_KEY, null));
  }

  function persistState(state) {
    safeLocalSet(STORAGE_KEY, JSON.stringify(state));
  }

  function toRgba(hex, alpha) {
    const safeHex = normalizeHexColor(hex).slice(1);
    const red = parseInt(safeHex.slice(0, 2), 16);
    const green = parseInt(safeHex.slice(2, 4), 16);
    const blue = parseInt(safeHex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function normalizeExternalUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) return '';
      return parsed.toString();
    } catch (_) {
      return '';
    }
  }

  function cleanDisplayDomain(value) {
    const normalized = normalizeExternalUrl(value);
    if (!normalized) return '';
    try {
      return new URL(normalized).hostname.replace(/^www\./i, '');
    } catch (_) {
      return '';
    }
  }

  function normalizePhoneHref(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const normalized = raw.replace(/[^+\d]/g, '');
    return normalized ? `tel:${normalized}` : '';
  }

  function buildInitials(value) {
    const parts = String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (!parts.length) return 'YN';
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('That image could not be read.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImageElement(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('That image could not be previewed.'));
      image.src = dataUrl;
    });
  }

  async function processProfilePhoto(file) {
    if (!file) throw new Error('Choose a PNG or JPG profile photo first.');
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      throw new Error('Profile photos must be PNG or JPG files.');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Profile photos must be 2 MB or smaller.');
    }
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImageElement(dataUrl);
    const canvas = document.createElement('canvas');
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const crop = Math.min(image.width, image.height);
    const sourceX = Math.round((image.width - crop) / 2);
    const sourceY = Math.round((image.height - crop) / 2);
    context.clearRect(0, 0, size, size);
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    context.drawImage(image, sourceX, sourceY, crop, crop, 0, 0, size, size);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      fileName: file.name,
      width: size,
      height: size,
    };
  }

  async function processCompanyLogo(file) {
    if (!file) throw new Error('Choose a logo image first.');
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      throw new Error('Company logos must be PNG, JPG, or SVG files.');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Company logos must be 2 MB or smaller.');
    }
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImageElement(dataUrl);
    const canvas = document.createElement('canvas');
    const width = 120;
    const height = 40;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const ratio = Math.min(width / image.width, height / image.height, 1);
    const drawWidth = Math.round(image.width * ratio);
    const drawHeight = Math.round(image.height * ratio);
    const offsetX = Math.round((width - drawWidth) / 2);
    const offsetY = Math.round((height - drawHeight) / 2);
    context.clearRect(0, 0, width, height);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    return {
      dataUrl: canvas.toDataURL(file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'image/jpeg' : 'image/png', 0.7),
      fileName: file.name,
      width,
      height,
    };
  }

  function buildBadge(text, accentColor, options = {}) {
    const fontSize = options.fontSize || 10;
    const paddingX = options.paddingX || 6;
    const paddingY = options.paddingY || 3;
    const useFilled = options.filled !== false;
    const background = useFilled ? toRgba(accentColor, 0.12) : '#ffffff';
    const border = useFilled ? 'transparent' : toRgba(accentColor, 0.3);
    return `<span style="display:inline-block;min-width:18px;padding:${paddingY}px ${paddingX}px;border-radius:999px;background:${background};border:1px solid ${border};color:${accentColor};font-size:${fontSize}px;font-weight:700;line-height:1;text-align:center">${escapeHtml(text)}</span>`;
  }

  function buildInlineItem(item, accentColor, fontStack, fontSize, textColor) {
    const content = `${buildBadge(item.badge, accentColor)}<span style="display:inline-block;margin-left:6px;font-family:${fontStack};font-size:${fontSize}px;line-height:1.45;color:${textColor};vertical-align:middle">${escapeHtml(item.label)}</span>`;
    const wrapperStart = item.href ? `<a href="${escapeAttr(item.href)}" style="text-decoration:none;color:${textColor}">` : '<span>';
    const wrapperEnd = item.href ? '</a>' : '</span>';
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;vertical-align:top;margin:0 8px 6px 0"><tr><td style="padding:0">${wrapperStart}${content}${wrapperEnd}</td></tr></table>`;
  }

  function buildStackedItem(item, accentColor, fontStack, fontSize, textColor) {
    const content = `${buildBadge(item.badge, accentColor)}<span style="display:inline-block;margin-left:8px;font-family:${fontStack};font-size:${fontSize}px;line-height:1.45;color:${textColor};vertical-align:middle">${escapeHtml(item.label)}</span>`;
    const wrapperStart = item.href ? `<a href="${escapeAttr(item.href)}" style="text-decoration:none;color:${textColor}">` : '<span>';
    const wrapperEnd = item.href ? '</a>' : '</span>';
    return `<tr><td style="padding:0 0 7px 0">${wrapperStart}${content}${wrapperEnd}</td></tr>`;
  }

  function buildImageCell(dataUrl, width, height, alt, rounded) {
    const radius = rounded ? Math.round(width / 2) : 0;
    return `<img src="${escapeAttr(dataUrl)}" width="${width}" height="${height}" alt="${escapeAttr(alt)}" style="display:block;width:${width}px;height:${height}px;border-radius:${radius}px;border:0;outline:none;text-decoration:none">`;
  }

  function buildAvatarMarkup(resolvedState) {
    const avatarSize = resolvedState.size.avatar;
    if (resolvedState.profilePhotoData) {
      return buildImageCell(
        resolvedState.profilePhotoData,
        resolvedState.profilePhotoWidth || avatarSize,
        resolvedState.profilePhotoHeight || avatarSize,
        `${resolvedState.fullName} profile photo`,
        true
      );
    }
    return `<span style="display:inline-block;width:${avatarSize}px;height:${avatarSize}px;line-height:${avatarSize}px;border-radius:${Math.round(avatarSize / 2)}px;background:${toRgba(resolvedState.accentColor, 0.14)};color:${resolvedState.accentColor};font-family:${resolvedState.font.stack};font-size:${Math.max(18, Math.round(avatarSize * 0.34))}px;font-weight:800;text-align:center">${escapeHtml(buildInitials(resolvedState.fullName))}</span>`;
  }

  function buildLogoMarkup(resolvedState) {
    if (!resolvedState.companyLogoData) return '';
    return buildImageCell(
      resolvedState.companyLogoData,
      resolvedState.companyLogoWidth || resolvedState.size.logoWidth,
      resolvedState.companyLogoHeight || resolvedState.size.logoHeight,
      `${resolvedState.companyName} logo`,
      false
    );
  }

  function getVisibleSocialLinks(state) {
    return SOCIAL_OPTIONS
      .map((option) => {
        const entry = state.social[option.id] || {};
        const href = normalizeExternalUrl(entry.url);
        if (!entry.enabled || !href) return null;
        return {
          id: option.id,
          badge: option.badge,
          label: String(entry.label || '').trim() || (option.id === 'custom' ? 'Portfolio' : option.label.replace(' / X', '')),
          href,
        };
      })
      .filter(Boolean)
      .slice(0, MAX_SOCIAL_LINKS);
  }

  function resolveSignatureState(state) {
    const font = FONT_LOOKUP[state.font] || FONT_OPTIONS[0];
    const size = SIZE_OPTIONS[state.fontSize] || SIZE_OPTIONS.medium;
    const websiteRaw = String(state.website || '').trim() || SAMPLE_VALUES.website;
    const websiteUrl = normalizeExternalUrl(websiteRaw);
    return {
      ...state,
      font,
      size,
      accentColor: normalizeHexColor(state.accentColor),
      width: Number(state.width) || 500,
      fullName: String(state.fullName || '').trim() || SAMPLE_VALUES.fullName,
      jobTitle: String(state.jobTitle || '').trim() || SAMPLE_VALUES.jobTitle,
      companyName: String(state.companyName || '').trim() || SAMPLE_VALUES.companyName,
      department: String(state.department || '').trim(),
      email: String(state.email || '').trim() || SAMPLE_VALUES.email,
      phone: String(state.phone || '').trim() || SAMPLE_VALUES.phone,
      mobile: String(state.mobile || '').trim(),
      websiteUrl,
      websiteLabel: cleanDisplayDomain(websiteRaw) || 'example.com',
      address: String(state.address || '').trim(),
      disclaimer: String(state.disclaimer || '').trim(),
      visibleSocialLinks: getVisibleSocialLinks(state),
    };
  }

  function buildContactItems(resolvedState) {
    const items = [];
    if (resolvedState.email) {
      items.push({ badge: '@', label: resolvedState.email, href: `mailto:${resolvedState.email}` });
    }
    if (resolvedState.phone) {
      items.push({ badge: 'P', label: resolvedState.phone, href: normalizePhoneHref(resolvedState.phone) });
    }
    if (resolvedState.mobile) {
      items.push({ badge: 'M', label: resolvedState.mobile, href: normalizePhoneHref(resolvedState.mobile) });
    }
    if (resolvedState.websiteUrl) {
      items.push({ badge: 'W', label: resolvedState.websiteLabel, href: resolvedState.websiteUrl });
    }
    if (resolvedState.address) {
      items.push({ badge: 'A', label: resolvedState.address, href: '' });
    }
    return items;
  }

  function buildProfessionalSignature(resolvedState, options) {
    const fontStack = resolvedState.font.stack;
    const textColor = '#0f172a';
    const subtleColor = '#475569';
    const contactItems = buildContactItems(resolvedState);
    const socialItems = resolvedState.visibleSocialLinks;
    const logoMarkup = buildLogoMarkup(resolvedState);
    const topColumns = logoMarkup ? 3 : 2;
    const widthStyle = options.preview
      ? `width:100%;max-width:${resolvedState.width}px;border-collapse:collapse;font-family:${fontStack};background:#ffffff;color:${textColor};`
      : `width:${resolvedState.width}px;border-collapse:collapse;font-family:${fontStack};background:#ffffff;color:${textColor};`;

    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${resolvedState.width}" style="${widthStyle}">
  <tr>
    <td style="padding:0">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
        <tr>
          <td width="${resolvedState.size.avatar}" valign="top" style="padding:0 16px 0 0">${buildAvatarMarkup(resolvedState)}</td>
          ${resolvedState.logoPosition === 'left' && logoMarkup ? `<td valign="top" style="padding:0 16px 0 0">${logoMarkup}</td>` : ''}
          <td valign="top" style="padding:0">
            <p style="margin:0;font-family:${fontStack};font-size:${resolvedState.size.name}px;line-height:1.15;font-weight:800;color:${textColor}">${escapeHtml(resolvedState.fullName)}</p>
            <p style="margin:4px 0 0 0;font-family:${fontStack};font-size:${resolvedState.size.title}px;line-height:1.4;color:${subtleColor}"><span style="font-weight:700;color:${textColor}">${escapeHtml(resolvedState.jobTitle)}</span>${resolvedState.companyName ? ` <span style="color:${subtleColor}">• ${escapeHtml(resolvedState.companyName)}</span>` : ''}</p>
            ${resolvedState.department ? `<p style="margin:4px 0 0 0;font-family:${fontStack};font-size:${resolvedState.size.base}px;line-height:1.4;color:${subtleColor}">${escapeHtml(resolvedState.department)}</p>` : ''}
          </td>
          ${resolvedState.logoPosition === 'right' && logoMarkup ? `<td valign="top" align="right" style="padding:0 0 0 16px">${logoMarkup}</td>` : ''}
        </tr>
        <tr>
          <td colspan="${topColumns}" style="padding:12px 0 0 0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
              <tr><td style="height:2px;font-size:0;line-height:0;background:${resolvedState.accentColor}">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        ${contactItems.length ? `<tr><td colspan="${topColumns}" style="padding:12px 0 0 0">${contactItems.map((item) => buildInlineItem(item, resolvedState.accentColor, fontStack, resolvedState.size.base, textColor)).join('')}</td></tr>` : ''}
        ${socialItems.length ? `<tr><td colspan="${topColumns}" style="padding:6px 0 0 0">${socialItems.map((item) => buildInlineItem(item, resolvedState.accentColor, fontStack, resolvedState.size.base, subtleColor)).join('')}</td></tr>` : ''}
        ${resolvedState.disclaimerEnabled && resolvedState.disclaimer ? `<tr><td colspan="${topColumns}" style="padding:10px 0 0 0"><p style="margin:0;font-family:${fontStack};font-size:${resolvedState.size.subtle}px;line-height:1.5;color:#6b7280;font-style:italic">${escapeHtml(resolvedState.disclaimer)}</p></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`.trim();
  }

  function buildExecutiveSignature(resolvedState, options) {
    const fontStack = resolvedState.font.stack;
    const textColor = '#0f172a';
    const subtleColor = '#475569';
    const contactItems = buildContactItems(resolvedState);
    const socialItems = resolvedState.visibleSocialLinks;
    const logoMarkup = buildLogoMarkup(resolvedState);
    const topColumns = logoMarkup ? 3 : 2;
    const widthStyle = options.preview
      ? `width:100%;max-width:${resolvedState.width}px;border-collapse:collapse;font-family:${fontStack};background:#ffffff;color:${textColor};`
      : `width:${resolvedState.width}px;border-collapse:collapse;font-family:${fontStack};background:#ffffff;color:${textColor};`;

    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${resolvedState.width}" style="${widthStyle}">
  <tr>
    <td width="6" style="width:6px;font-size:0;line-height:0;background:${resolvedState.accentColor}">&nbsp;</td>
    <td style="padding:0 0 0 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
        <tr>
          <td width="${resolvedState.size.avatar}" valign="top" style="padding:0 16px 0 0">${buildAvatarMarkup(resolvedState)}</td>
          ${resolvedState.logoPosition === 'left' && logoMarkup ? `<td valign="top" style="padding:0 16px 0 0">${logoMarkup}</td>` : ''}
          <td valign="top" style="padding:0">
            <p style="margin:0;font-family:${fontStack};font-size:${resolvedState.size.name}px;line-height:1.1;font-weight:800;color:${textColor}">${escapeHtml(resolvedState.fullName)}</p>
            <p style="margin:4px 0 0 0;font-family:${fontStack};font-size:${resolvedState.size.title}px;line-height:1.4;color:${subtleColor};font-style:italic">${escapeHtml(resolvedState.jobTitle)}</p>
            <p style="margin:4px 0 0 0;font-family:${fontStack};font-size:${resolvedState.size.base}px;line-height:1.4;color:${textColor};font-weight:700">${escapeHtml(resolvedState.companyName)}</p>
            ${resolvedState.department ? `<p style="margin:4px 0 0 0;font-family:${fontStack};font-size:${resolvedState.size.base}px;line-height:1.4;color:${subtleColor}">${escapeHtml(resolvedState.department)}</p>` : ''}
          </td>
          ${resolvedState.logoPosition === 'right' && logoMarkup ? `<td valign="top" align="right" style="padding:0 0 0 16px">${logoMarkup}</td>` : ''}
        </tr>
        ${contactItems.length ? `<tr><td colspan="${topColumns}" style="padding:14px 0 0 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">${contactItems.map((item) => buildStackedItem(item, resolvedState.accentColor, fontStack, resolvedState.size.base, textColor)).join('')}</table></td></tr>` : ''}
        ${socialItems.length ? `<tr><td colspan="${topColumns}" style="padding:6px 0 0 0">${socialItems.map((item) => buildInlineItem(item, resolvedState.accentColor, fontStack, resolvedState.size.base, subtleColor)).join('')}</td></tr>` : ''}
        ${resolvedState.disclaimerEnabled && resolvedState.disclaimer ? `<tr><td colspan="${topColumns}" style="padding:10px 0 0 0"><p style="margin:0;font-family:${fontStack};font-size:${resolvedState.size.subtle}px;line-height:1.5;color:#6b7280;font-style:italic">${escapeHtml(resolvedState.disclaimer)}</p></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`.trim();
  }

  function buildCreativeSignature(resolvedState, options) {
    const fontStack = resolvedState.font.stack;
    const textColor = '#0f172a';
    const subtleColor = '#475569';
    const contactItems = buildContactItems(resolvedState);
    const socialItems = resolvedState.visibleSocialLinks;
    const logoMarkup = buildLogoMarkup(resolvedState);
    const widthStyle = options.preview
      ? `width:100%;max-width:${resolvedState.width}px;border-collapse:collapse;font-family:${fontStack};background:#ffffff;color:${textColor};border:1px solid #dbe5f2;`
      : `width:${resolvedState.width}px;border-collapse:collapse;font-family:${fontStack};background:#ffffff;color:${textColor};border:1px solid #dbe5f2;`;

    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${resolvedState.width}" style="${widthStyle}">
  <tr>
    <td style="padding:14px 18px;background:${resolvedState.accentColor}">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
        <tr>
          ${resolvedState.logoPosition === 'left' && logoMarkup ? `<td valign="top" style="padding:0 16px 0 0">${logoMarkup}</td>` : ''}
          <td valign="top" style="padding:0">
            <p style="margin:0;font-family:${fontStack};font-size:${resolvedState.size.name}px;line-height:1.1;font-weight:800;color:#ffffff">${escapeHtml(resolvedState.fullName)}</p>
            <p style="margin:5px 0 0 0;font-family:${fontStack};font-size:${resolvedState.size.title}px;line-height:1.4;color:#e0f2fe">${escapeHtml(resolvedState.jobTitle)}${resolvedState.companyName ? ` • ${escapeHtml(resolvedState.companyName)}` : ''}</p>
          </td>
          ${resolvedState.logoPosition === 'right' && logoMarkup ? `<td valign="top" align="right" style="padding:0 0 0 16px">${logoMarkup}</td>` : ''}
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 18px;background:#ffffff">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
        <tr>
          <td width="${resolvedState.size.avatar}" valign="top" style="padding:0 16px 0 0">${buildAvatarMarkup(resolvedState)}</td>
          <td valign="top" style="padding:0">
            <p style="margin:0;font-family:${fontStack};font-size:${resolvedState.size.base}px;line-height:1.45;color:${textColor};font-weight:700">${escapeHtml(resolvedState.companyName)}</p>
            ${resolvedState.department ? `<p style="margin:4px 0 0 0;font-family:${fontStack};font-size:${resolvedState.size.base}px;line-height:1.45;color:${subtleColor}">${escapeHtml(resolvedState.department)}</p>` : ''}
            ${contactItems.length ? `<p style="margin:10px 0 0 0">${contactItems.map((item) => buildInlineItem(item, resolvedState.accentColor, fontStack, resolvedState.size.base, textColor)).join('')}</p>` : ''}
            ${socialItems.length ? `<p style="margin:6px 0 0 0">${socialItems.map((item) => buildInlineItem(item, resolvedState.accentColor, fontStack, resolvedState.size.base, subtleColor)).join('')}</p>` : ''}
          </td>
        </tr>
        ${resolvedState.disclaimerEnabled && resolvedState.disclaimer ? `<tr><td colspan="2" style="padding:12px 0 0 0"><p style="margin:0;font-family:${fontStack};font-size:${resolvedState.size.subtle}px;line-height:1.5;color:#6b7280;font-style:italic">${escapeHtml(resolvedState.disclaimer)}</p></td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`.trim();
  }

  function buildSignatureHtml(state, options = {}) {
    const resolvedState = resolveSignatureState(state);
    const template = resolvedState.template;
    let html = buildProfessionalSignature(resolvedState, options);
    if (template === 'executive') html = buildExecutiveSignature(resolvedState, options);
    if (template === 'creative') html = buildCreativeSignature(resolvedState, options);
    if (options.outlook) {
      html = `<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${resolvedState.width}"><tr><td><![endif]-->${html}<!--[if mso]></td></tr></table><![endif]-->`;
    }
    return html;
  }

  function buildHtmlDocument(signatureHtml) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Signature</title></head><body style="margin:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">${signatureHtml}</body></html>`;
  }

  function buildTemplateThumbnail(templateId) {
    if (templateId === 'executive') {
      return `<svg viewBox="0 0 116 68" aria-hidden="true"><rect x="4" y="4" width="108" height="60" rx="12" fill="#fff" stroke="#cbd5e1"/><rect x="12" y="12" width="6" height="44" rx="3" fill="#8b5cf6"/><circle cx="34" cy="24" r="8" fill="#dbeafe"/><rect x="48" y="18" width="34" height="6" rx="3" fill="#0f172a"/><rect x="48" y="30" width="24" height="5" rx="2.5" fill="#64748b"/><rect x="24" y="44" width="58" height="4" rx="2" fill="#cbd5e1"/><rect x="24" y="52" width="48" height="4" rx="2" fill="#cbd5e1"/></svg>`;
    }
    if (templateId === 'creative') {
      return `<svg viewBox="0 0 116 68" aria-hidden="true"><rect x="4" y="4" width="108" height="60" rx="12" fill="#fff" stroke="#cbd5e1"/><rect x="10" y="10" width="96" height="18" rx="6" fill="#8b5cf6"/><rect x="16" y="16" width="40" height="4" rx="2" fill="#fff"/><rect x="16" y="22" width="28" height="3" rx="1.5" fill="#e0f2fe"/><rect x="82" y="14" width="18" height="10" rx="2" fill="#fff" opacity="0.88"/><circle cx="24" cy="42" r="10" fill="#dbeafe"/><rect x="40" y="36" width="48" height="4" rx="2" fill="#0f172a"/><rect x="40" y="44" width="40" height="4" rx="2" fill="#64748b"/><rect x="40" y="52" width="30" height="4" rx="2" fill="#cbd5e1"/></svg>`;
    }
    return `<svg viewBox="0 0 116 68" aria-hidden="true"><rect x="4" y="4" width="108" height="60" rx="12" fill="#fff" stroke="#cbd5e1"/><circle cx="24" cy="28" r="12" fill="#dbeafe"/><rect x="42" y="18" width="44" height="6" rx="3" fill="#0f172a"/><rect x="42" y="29" width="34" height="5" rx="2.5" fill="#64748b"/><rect x="12" y="42" width="92" height="3" rx="1.5" fill="#8b5cf6"/><rect x="12" y="50" width="62" height="4" rx="2" fill="#cbd5e1"/><rect x="78" y="50" width="24" height="4" rx="2" fill="#e2e8f0"/></svg>`;
  }

  function createClientChrome(state, signatureHtml) {
    const previewWidth = state.mobilePreview ? 375 : state.width + 48;
    const chromeClass = state.previewClient === 'outlook' ? 'is-outlook' : 'is-gmail';
    return `
      <div class="es-client-shell ${chromeClass}" style="max-width:${previewWidth}px">
        <div class="es-client-toolbar">
          <span class="es-client-dot"></span>
          <span class="es-client-dot"></span>
          <span class="es-client-dot"></span>
          <span class="es-client-title">${state.previewClient === 'outlook' ? 'Outlook compose preview' : 'Gmail compose preview'}</span>
        </div>
        <div class="es-client-meta">
          <div><strong>From:</strong> ${escapeHtml(resolveSignatureState(state).fullName)}</div>
          <div><strong>Subject:</strong> Quick hello from ${escapeHtml(resolveSignatureState(state).companyName)}</div>
        </div>
        <div class="es-preview-body">
          ${signatureHtml}
        </div>
      </div>`;
  }

  async function copyMarkup(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) { /* fall through to legacy copy */ }
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      return copied;
    } catch (_) {
      return false;
    }
  }

  function downloadTextFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  Object.assign(ToolRenderers.renderers, {
    'email-signature-generator'(container) {
      let state = readStoredState();
      const hasStoredState = Boolean(safeLocalRead(STORAGE_KEY, ''));
      const sampleFields = {
        fullName: SAMPLE_VALUES.fullName,
        jobTitle: SAMPLE_VALUES.jobTitle,
        companyName: SAMPLE_VALUES.companyName,
        email: SAMPLE_VALUES.email,
        phone: SAMPLE_VALUES.phone,
        website: SAMPLE_VALUES.website,
        address: SAMPLE_VALUES.address,
      };
      const pristineSampleFields = new Set(hasStoredState ? [] : Object.keys(sampleFields));
      let noteTimeoutId = null;

      container.innerHTML = `
<style>
  .es-tool { display:grid; gap:24px; }
  .es-layout { display:grid; gap:24px; grid-template-columns:minmax(0, 1.05fr) minmax(320px, 0.95fr); align-items:start; }
  .es-editor,
  .es-preview-panel,
  .es-panel { border:1px solid var(--border-color); border-radius:16px; background:var(--bg-card); }
  .es-editor { padding:20px; display:grid; gap:18px; }
  .es-panel { padding:18px; }
  .es-panel h3,
  .es-preview-header h3 { margin:0 0 6px; font-size:1.05rem; }
  .es-panel p { margin:0; color:var(--text-secondary); }
  .es-actions { display:flex; flex-wrap:wrap; gap:12px; }
  .es-actions .btn { min-height:44px; }
  .es-storage-note,
  .es-output-note,
  .es-limit-note,
  .es-width-note,
  .es-disclaimer-count { color:var(--text-tertiary); font-size:0.85rem; }
  .es-output-note { border:1px solid var(--border-color); border-radius:12px; background:var(--bg-glass); padding:12px 14px; }
  .es-banner { border-radius:12px; padding:12px 14px; font-size:0.92rem; }
  .es-banner.is-error { background:rgba(244,63,94,0.09); border:1px solid rgba(244,63,94,0.28); color:#fecaca; }
  .es-banner.is-success { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.28); color:#bbf7d0; }
  .es-grid { display:grid; gap:14px; }
  .es-grid-2 { grid-template-columns:repeat(2, minmax(0, 1fr)); }
  .es-input { display:grid; gap:6px; min-width:0; }
  .es-input label,
  .es-toggle-title { font-size:0.9rem; font-weight:700; color:var(--text-primary); }
  .es-input input,
  .es-input select,
  .es-input textarea { width:100%; min-height:44px; padding:12px 14px; border-radius:14px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); font:inherit; outline:none; box-sizing:border-box; transition:border-color .18s ease, box-shadow .18s ease, background .18s ease; }
  .es-input textarea { min-height:88px; resize:vertical; }
  .es-input input:focus,
  .es-input select:focus,
  .es-input textarea:focus { border-color:var(--border-accent); box-shadow:0 0 0 3px rgba(139,92,246,0.16); }
  .es-row-inline { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .es-color-row { display:grid; grid-template-columns:64px minmax(0, 1fr); gap:10px; align-items:center; }
  .es-color-row input[type="color"] { min-height:44px; padding:4px; border-radius:12px; cursor:pointer; }
  .es-toggle-list { display:grid; gap:12px; }
  .es-toggle-item { border:1px solid var(--border-color); border-radius:14px; padding:12px; background:var(--bg-glass); }
  .es-toggle-control { display:flex; align-items:center; gap:10px; }
  .es-toggle-control input[type="checkbox"] { width:18px; height:18px; margin:0; accent-color:var(--accent-primary); }
  .es-social-fields { display:grid; gap:10px; margin-top:10px; opacity:0; max-height:0; overflow:hidden; transform:translateY(-4px); transition:opacity .15s ease, max-height .15s ease, transform .15s ease; }
  .es-social-fields.is-on { opacity:1; max-height:220px; transform:translateY(0); }
  .es-upload-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .es-upload-row input[type="file"] { display:none; }
  .es-template-picker,
  .es-preview-controls { display:flex; gap:10px; flex-wrap:wrap; }
  .es-template-btn,
  .es-chip-btn { border:1px solid var(--border-color); background:var(--bg-glass); color:var(--text-primary); border-radius:14px; cursor:pointer; padding:10px 12px; font:inherit; transition:border-color .18s ease, transform .18s ease, background .18s ease; min-height:44px; display:inline-flex; align-items:center; gap:10px; }
  .es-template-btn:hover,
  .es-chip-btn:hover { border-color:var(--border-accent); transform:translateY(-1px); }
  .es-template-btn.is-active,
  .es-chip-btn.is-active { border-color:transparent; background:var(--gradient-primary); color:#fff; }
  .es-template-thumb { width:72px; height:42px; display:block; }
  .es-template-thumb svg { width:100%; height:100%; display:block; }
  .es-preview-panel { padding:18px; position:sticky; top:92px; display:grid; gap:16px; }
  .es-preview-header { display:grid; gap:10px; }
  .es-preview-header p { margin:0; color:var(--text-secondary); }
  .es-preview-frame { border:1px solid rgba(148,163,184,0.18); border-radius:16px; background:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)); padding:14px; overflow:auto; min-height:280px; }
  .es-preview-surface { transition:opacity .2s ease; }
  .es-preview-surface.is-fading { opacity:0.45; }
  .es-client-shell { border:1px solid rgba(148,163,184,0.26); border-radius:14px; background:#f8fafc; margin:0 auto; overflow:hidden; min-width:0; }
  .es-client-shell.is-outlook { background:#eef4ff; }
  .es-client-toolbar { display:flex; align-items:center; gap:8px; padding:10px 14px; background:#eef2f7; border-bottom:1px solid #d7e0ea; font-size:0.82rem; color:#475569; }
  .es-client-shell.is-outlook .es-client-toolbar { background:#dbeafe; border-bottom-color:#bfdbfe; }
  .es-client-dot { width:8px; height:8px; border-radius:50%; background:#cbd5e1; display:inline-block; }
  .es-client-title { margin-left:8px; font-weight:700; }
  .es-client-meta { padding:12px 14px; display:grid; gap:6px; background:#ffffff; border-bottom:1px solid #e2e8f0; color:#475569; font-size:0.86rem; }
  .es-client-shell.is-outlook .es-client-meta { background:#f8fbff; }
  .es-preview-body { padding:18px 14px; background:#ffffff; }
  .es-accordions { display:grid; gap:10px; }
  .es-accordions details { border:1px solid var(--border-color); border-radius:14px; background:var(--bg-glass); padding:0 14px; }
  .es-accordions summary { cursor:pointer; list-style:none; padding:14px 0; font-weight:700; color:var(--text-primary); }
  .es-accordions summary::-webkit-details-marker { display:none; }
  .es-accordions p { margin:0 0 14px; color:var(--text-secondary); }
  .es-note-flash { opacity:0; transition:opacity .18s ease; }
  .es-note-flash.is-visible { opacity:1; }
  .es-sr-only { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
  @media (max-width: 1040px) {
    .es-layout { grid-template-columns:1fr; }
    .es-preview-panel { position:static; }
  }
  @media (max-width: 720px) {
    .es-editor { padding:16px; }
    .es-panel { padding:16px; }
    .es-grid-2 { grid-template-columns:1fr; }
    .es-color-row { grid-template-columns:1fr; }
  }
</style>
<div class="tool-workspace-body es-tool">
  <div class="es-layout">
    <section class="es-editor">
      <div class="es-actions">
        <button class="btn btn-primary" id="es-copy-btn" type="button">Copy HTML</button>
        <button class="btn btn-secondary" id="es-download-btn" type="button">Download HTML File</button>
        <button class="btn btn-secondary" id="es-copy-outlook-btn" type="button">Copy for Outlook</button>
      </div>
      <p class="es-storage-note">Your info is auto-saved in this browser. Everything stays on this device.</p>
      <div id="es-banner" class="es-banner" hidden></div>

      <section class="es-panel">
        <h3>Personal Details</h3>
        <p>Use sample values or replace them with your real signature details.</p>
        <div class="es-grid es-grid-2" style="margin-top:14px">
          <div class="es-input">
            <label for="es-full-name">Full Name</label>
            <input type="text" id="es-full-name" data-field="fullName" data-sample-field="fullName" required>
          </div>
          <div class="es-input">
            <label for="es-job-title">Job Title / Role</label>
            <input type="text" id="es-job-title" data-field="jobTitle" data-sample-field="jobTitle">
          </div>
          <div class="es-input">
            <label for="es-company-name">Company Name</label>
            <input type="text" id="es-company-name" data-field="companyName" data-sample-field="companyName">
          </div>
          <div class="es-input">
            <label for="es-department">Department</label>
            <input type="text" id="es-department" data-field="department" placeholder="Growth, Sales, Operations">
          </div>
        </div>
      </section>

      <section class="es-panel">
        <h3>Contact Details</h3>
        <p>These become the links and labels inside the signature.</p>
        <div class="es-grid es-grid-2" style="margin-top:14px">
          <div class="es-input">
            <label for="es-email">Email Address</label>
            <input type="email" id="es-email" data-field="email" data-sample-field="email">
          </div>
          <div class="es-input">
            <label for="es-phone">Phone Number</label>
            <input type="text" id="es-phone" data-field="phone" data-sample-field="phone">
          </div>
          <div class="es-input">
            <label for="es-mobile">Mobile Number</label>
            <input type="text" id="es-mobile" data-field="mobile" placeholder="+1 (555) 987-6543">
          </div>
          <div class="es-input">
            <label for="es-website">Website URL</label>
            <input type="url" id="es-website" data-field="website" data-sample-field="website">
          </div>
          <div class="es-input" style="grid-column:1 / -1">
            <label for="es-address">Physical Address</label>
            <input type="text" id="es-address" data-field="address" data-sample-field="address">
          </div>
        </div>
      </section>

      <section class="es-panel">
        <h3>Social / Profile Links</h3>
        <p>Turn on the profiles you actually use. Tooliest shows at most four links to keep signatures clean.</p>
        <div class="es-toggle-list" id="es-social-list" style="margin-top:14px"></div>
        <p class="es-limit-note" id="es-social-limit-note"></p>
      </section>

      <section class="es-panel">
        <h3>Branding</h3>
        <p>Upload a headshot and logo if you want them embedded directly into the copied HTML.</p>
        <div class="es-grid es-grid-2" style="margin-top:14px">
          <div class="es-input">
            <label>Profile Photo</label>
            <div class="es-upload-row">
              <label class="btn btn-secondary" for="es-profile-photo-input">Upload Photo</label>
              <button class="btn btn-secondary" type="button" id="es-remove-photo-btn">Remove Photo</button>
              <input type="file" id="es-profile-photo-input" accept="image/png,image/jpeg,image/jpg">
            </div>
            <span class="es-output-note">PNG or JPG up to 2 MB. The image is cropped into a circular avatar.</span>
          </div>
          <div class="es-input">
            <label>Company Logo</label>
            <div class="es-upload-row">
              <label class="btn btn-secondary" for="es-company-logo-input">Upload Logo</label>
              <button class="btn btn-secondary" type="button" id="es-remove-logo-btn">Remove Logo</button>
              <input type="file" id="es-company-logo-input" accept="image/png,image/jpeg,image/jpg,image/svg+xml">
            </div>
            <span class="es-output-note">PNG, JPG, or SVG up to 2 MB. Tooliest scales it into the signature slot without cropping.</span>
          </div>
        </div>
        <div style="margin-top:14px">${ToolRenderers.buildUploadPreviewCard('es-photo', 'Profile photo')}</div>
        <div style="margin-top:14px">${ToolRenderers.buildUploadPreviewCard('es-logo', 'Company logo')}</div>
      </section>

      <section class="es-panel">
        <h3>Customization</h3>
        <p>Stay inside email-safe fonts and widths so the copied signature keeps its shape.</p>
        <div class="es-grid es-grid-2" style="margin-top:14px">
          <div class="es-input">
            <label for="es-font">Font</label>
            <select id="es-font" data-field="font">${FONT_OPTIONS.map((option) => `<option value="${escapeAttr(option.id)}">${escapeHtml(option.label)}</option>`).join('')}</select>
          </div>
          <div class="es-input">
            <label for="es-font-size">Font Size</label>
            <select id="es-font-size" data-field="fontSize">${Object.values(SIZE_OPTIONS).map((size) => `<option value="${escapeAttr(size.id)}">${escapeHtml(size.label)}</option>`).join('')}</select>
          </div>
          <div class="es-input">
            <label for="es-signature-width">Signature Width</label>
            <select id="es-signature-width" data-field="width">${WIDTH_OPTIONS.map((width) => `<option value="${width}">${width}px</option>`).join('')}</select>
          </div>
          <div class="es-input">
            <label for="es-logo-position">Logo Position</label>
            <select id="es-logo-position" data-field="logoPosition">
              <option value="right">Right of name</option>
              <option value="left">Left of name</option>
            </select>
          </div>
          <div class="es-input" style="grid-column:1 / -1">
            <label for="es-accent-color">Accent Color</label>
            <div class="es-color-row">
              <input type="color" id="es-accent-color" aria-describedby="es-accent-help">
              <input type="text" id="es-accent-hex" inputmode="text" aria-describedby="es-accent-help" placeholder="#0066CC">
            </div>
            <span class="es-width-note" id="es-accent-help">Use a hex color like #0066CC if the native picker is hard to operate.</span>
            <span class="es-width-note" id="es-width-note"></span>
          </div>
        </div>
      </section>

      <section class="es-panel">
        <h3>Disclaimer / Legal</h3>
        <p>Optional small-print text for confidentiality or legal wording.</p>
        <div class="es-toggle-item" style="margin-top:14px">
          <label class="es-toggle-control" for="es-disclaimer-toggle">
            <input type="checkbox" id="es-disclaimer-toggle">
            <span class="es-toggle-title">Add disclaimer</span>
          </label>
          <div class="es-social-fields" id="es-disclaimer-fields">
            <div class="es-input">
              <label for="es-disclaimer-text">Disclaimer Text</label>
              <textarea id="es-disclaimer-text" data-field="disclaimer" maxlength="420" placeholder="This message may contain confidential information intended only for the recipient."></textarea>
              <span class="es-disclaimer-count" id="es-disclaimer-count">0 characters</span>
            </div>
          </div>
        </div>
      </section>

      <section class="es-panel">
        <h3>Paste Instructions</h3>
        <p>Copy the HTML above, then use the guide for the email client you are editing right now.</p>
        <div class="es-accordions" style="margin-top:14px">
          <details>
            <summary>Gmail</summary>
            <p>Open Settings, choose See all settings, stay on General, find the Signature section, create a new signature, click the source code icon in the editor, paste the HTML, then save changes.</p>
          </details>
          <details>
            <summary>Outlook</summary>
            <p>Open File, then Options, then Mail, then Signatures. Create or edit a signature, paste the Outlook-friendly HTML, and save the signature before closing the window.</p>
          </details>
          <details>
            <summary>Apple Mail</summary>
            <p>Open Mail, go to Settings, then Signatures. Create a new signature, paste the generated HTML, and close the settings window so Mail saves it.</p>
          </details>
        </div>
      </section>

      <p class="es-output-note" id="es-embed-note">Your photo is embedded as data. For best compatibility, host your photo online and replace the data URI with a URL.</p>
      <p class="es-storage-note es-note-flash" id="es-save-flash">Saved locally.</p>
      <div class="es-sr-only" id="es-copy-live" aria-live="polite"></div>
    </section>

    <aside class="es-preview-panel">
      <div class="es-preview-header">
        <h3>Live Preview</h3>
        <p>Switch templates, compare Gmail and Outlook chrome, and check a narrower mobile view before you copy.</p>
      </div>
      <div class="es-template-picker" id="es-template-picker"></div>
      <div class="es-preview-controls">
        <button class="es-chip-btn" type="button" data-preview-client="gmail">Gmail Look</button>
        <button class="es-chip-btn" type="button" data-preview-client="outlook">Outlook Look</button>
        <button class="es-chip-btn" type="button" data-preview-mobile="toggle">Mobile</button>
      </div>
      <div class="es-preview-frame" id="es-preview-region" aria-label="Live email signature preview" aria-live="polite">
        <div class="es-preview-surface" id="es-preview-surface"></div>
      </div>
    </aside>
  </div>
</div>`;

      const nodes = {
        banner: container.querySelector('#es-banner'),
        copyButton: container.querySelector('#es-copy-btn'),
        downloadButton: container.querySelector('#es-download-btn'),
        copyOutlookButton: container.querySelector('#es-copy-outlook-btn'),
        previewSurface: container.querySelector('#es-preview-surface'),
        previewRegion: container.querySelector('#es-preview-region'),
        templatePicker: container.querySelector('#es-template-picker'),
        socialList: container.querySelector('#es-social-list'),
        socialLimitNote: container.querySelector('#es-social-limit-note'),
        accentColor: container.querySelector('#es-accent-color'),
        accentHex: container.querySelector('#es-accent-hex'),
        disclaimerToggle: container.querySelector('#es-disclaimer-toggle'),
        disclaimerFields: container.querySelector('#es-disclaimer-fields'),
        disclaimerText: container.querySelector('#es-disclaimer-text'),
        disclaimerCount: container.querySelector('#es-disclaimer-count'),
        embedNote: container.querySelector('#es-embed-note'),
        widthNote: container.querySelector('#es-width-note'),
        saveFlash: container.querySelector('#es-save-flash'),
        copyLive: container.querySelector('#es-copy-live'),
        profileInput: container.querySelector('#es-profile-photo-input'),
        logoInput: container.querySelector('#es-company-logo-input'),
        removePhotoButton: container.querySelector('#es-remove-photo-btn'),
        removeLogoButton: container.querySelector('#es-remove-logo-btn'),
      };

      const formFields = {
        fullName: container.querySelector('#es-full-name'),
        jobTitle: container.querySelector('#es-job-title'),
        companyName: container.querySelector('#es-company-name'),
        department: container.querySelector('#es-department'),
        email: container.querySelector('#es-email'),
        phone: container.querySelector('#es-phone'),
        mobile: container.querySelector('#es-mobile'),
        website: container.querySelector('#es-website'),
        address: container.querySelector('#es-address'),
        font: container.querySelector('#es-font'),
        fontSize: container.querySelector('#es-font-size'),
        width: container.querySelector('#es-signature-width'),
        logoPosition: container.querySelector('#es-logo-position'),
      };

      SOCIAL_OPTIONS.forEach((option) => {
        nodes.socialList.insertAdjacentHTML('beforeend', `
          <div class="es-toggle-item">
            <label class="es-toggle-control" for="es-social-${escapeAttr(option.id)}-enabled">
              <input type="checkbox" id="es-social-${escapeAttr(option.id)}-enabled" data-social-enabled="${escapeAttr(option.id)}">
              <span class="es-toggle-title">${escapeHtml(option.label)}</span>
            </label>
            <div class="es-social-fields" id="es-social-${escapeAttr(option.id)}-fields">
              <div class="es-grid es-grid-2">
                <div class="es-input">
                  <label for="es-social-${escapeAttr(option.id)}-url">${escapeHtml(option.label)} URL</label>
                  <input type="url" id="es-social-${escapeAttr(option.id)}-url" data-social-url="${escapeAttr(option.id)}" placeholder="${escapeAttr(option.placeholder)}">
                </div>
                <div class="es-input">
                  <label for="es-social-${escapeAttr(option.id)}-label">${escapeHtml(option.label)} Label</label>
                  <input type="text" id="es-social-${escapeAttr(option.id)}-label" data-social-label="${escapeAttr(option.id)}" placeholder="${escapeAttr(option.id === 'custom' ? 'Portfolio' : option.label.replace(' / X', ''))}">
                </div>
              </div>
            </div>
          </div>`);
      });

      TEMPLATE_OPTIONS.forEach((template) => {
        nodes.templatePicker.insertAdjacentHTML('beforeend', `
          <button class="es-template-btn" type="button" data-template="${escapeAttr(template.id)}">
            <span class="es-template-thumb">${buildTemplateThumbnail(template.id)}</span>
            <span>${escapeHtml(template.label)}</span>
          </button>`);
      });

      function readFormState() {
        const nextState = cloneState(state);
        Object.keys(formFields).forEach((key) => {
          const field = formFields[key];
          if (!field) return;
          nextState[key] = key === 'width' ? Number(field.value) || 500 : field.value;
        });
        nextState.accentColor = normalizeHexColor(nodes.accentHex.value || nodes.accentColor.value || state.accentColor, state.accentColor);
        nextState.disclaimerEnabled = nodes.disclaimerToggle.checked;
        nextState.disclaimer = nodes.disclaimerText.value;
        nextState.social = SOCIAL_OPTIONS.reduce((accumulator, option) => {
          accumulator[option.id] = {
            enabled: container.querySelector(`#es-social-${option.id}-enabled`).checked,
            url: container.querySelector(`#es-social-${option.id}-url`).value,
            label: container.querySelector(`#es-social-${option.id}-label`).value,
          };
          return accumulator;
        }, {});
        return normalizeState(nextState);
      }

      function populateForm() {
        Object.keys(formFields).forEach((key) => {
          if (!formFields[key]) return;
          formFields[key].value = key === 'width' ? String(state[key]) : state[key];
        });
        nodes.accentColor.value = normalizeHexColor(state.accentColor);
        nodes.accentHex.value = normalizeHexColor(state.accentColor);
        nodes.disclaimerToggle.checked = Boolean(state.disclaimerEnabled);
        nodes.disclaimerText.value = state.disclaimer || '';
        SOCIAL_OPTIONS.forEach((option) => {
          container.querySelector(`#es-social-${option.id}-enabled`).checked = Boolean(state.social[option.id].enabled);
          container.querySelector(`#es-social-${option.id}-url`).value = state.social[option.id].url || '';
          container.querySelector(`#es-social-${option.id}-label`).value = state.social[option.id].label || (option.id === 'custom' ? 'Portfolio' : '');
        });
      }

      function showBanner(message, kind) {
        nodes.banner.hidden = false;
        nodes.banner.className = `es-banner ${kind === 'success' ? 'is-success' : 'is-error'}`;
        nodes.banner.textContent = message;
      }

      function hideBanner() {
        nodes.banner.hidden = true;
        nodes.banner.textContent = '';
        nodes.banner.className = 'es-banner';
      }

      function flashSaved() {
        nodes.saveFlash.classList.add('is-visible');
        clearTimeout(noteTimeoutId);
        noteTimeoutId = setTimeout(() => {
          nodes.saveFlash.classList.remove('is-visible');
        }, 1400);
      }

      function updateUploadPreviews() {
        if (state.profilePhotoData) {
          ToolRenderers.setUploadPreviewCard('es-photo', {
            url: state.profilePhotoData,
            title: state.profilePhotoName || 'Profile photo ready',
            meta: 'Embedded directly into the signature HTML.',
            note: 'Stored locally in this browser.',
            alt: 'Profile photo preview',
          });
        } else {
          ToolRenderers.hideUploadPreviewCard('es-photo');
        }

        if (state.companyLogoData) {
          ToolRenderers.setUploadPreviewCard('es-logo', {
            url: state.companyLogoData,
            title: state.companyLogoName || 'Company logo ready',
            meta: 'Scaled into the signature logo slot.',
            note: 'Stored locally in this browser.',
            alt: 'Company logo preview',
          });
        } else {
          ToolRenderers.hideUploadPreviewCard('es-logo');
        }
      }

      function updateToggleVisibility() {
        SOCIAL_OPTIONS.forEach((option) => {
          const enabled = container.querySelector(`#es-social-${option.id}-enabled`).checked;
          container.querySelector(`#es-social-${option.id}-fields`).classList.toggle('is-on', enabled);
        });
        nodes.disclaimerFields.classList.toggle('is-on', nodes.disclaimerToggle.checked);
      }

      function updateCountsAndWarnings() {
        const disclaimerLength = nodes.disclaimerText.value.trim().length;
        nodes.disclaimerCount.textContent = `${disclaimerLength} character${disclaimerLength === 1 ? '' : 's'}`;
        const enabledSocials = SOCIAL_OPTIONS.filter((option) => {
          const entry = state.social[option.id];
          return entry && entry.enabled && normalizeExternalUrl(entry.url);
        }).length;
        nodes.socialLimitNote.textContent = enabledSocials > MAX_SOCIAL_LINKS
          ? `Only the first ${MAX_SOCIAL_LINKS} enabled social links are shown to keep the signature tidy.`
          : 'You can enable up to four links before the signature starts feeling crowded.';
        nodes.widthNote.textContent = Number(state.width) > 600
          ? 'Some email clients may display this wider than their reading pane.'
          : '';
        nodes.embedNote.hidden = !(state.profilePhotoData || state.companyLogoData);
      }

      function updateTemplateButtons() {
        container.querySelectorAll('[data-template]').forEach((button) => {
          button.classList.toggle('is-active', button.dataset.template === state.template);
        });
        container.querySelectorAll('[data-preview-client]').forEach((button) => {
          button.classList.toggle('is-active', button.dataset.previewClient === state.previewClient);
        });
        container.querySelector('[data-preview-mobile="toggle"]')?.classList.toggle('is-active', Boolean(state.mobilePreview));
      }

      function renderPreview(fade) {
        const signatureHtml = buildSignatureHtml(state, { preview: true, outlook: false });
        if (fade) nodes.previewSurface.classList.add('is-fading');
        nodes.previewSurface.innerHTML = createClientChrome(state, signatureHtml);
        updateTemplateButtons();
        if (fade) {
          setTimeout(() => {
            nodes.previewSurface.classList.remove('is-fading');
          }, 220);
        }
      }

      const debouncedRenderPreview = debounce(() => renderPreview(false), PREVIEW_DEBOUNCE);
      const debouncedPersist = debounce(() => {
        persistState(state);
        flashSaved();
      }, SAVE_DEBOUNCE);

      function syncStateFromInputs() {
        state = readFormState();
        updateToggleVisibility();
        updateCountsAndWarnings();
      }

      function validateBeforeExport() {
        const issues = [];
        const nameValue = String(formFields.fullName.value || '').trim();
        if (!nameValue) issues.push('Add your full name before copying the signature HTML.');
        return issues;
      }

      async function handleCopy(button, outlookMode) {
        syncStateFromInputs();
        hideBanner();
        const issues = validateBeforeExport();
        if (issues.length) {
          showBanner(issues.join(' '), 'error');
          nodes.copyLive.textContent = issues.join(' ');
          return;
        }
        const markup = buildSignatureHtml(state, { preview: false, outlook: outlookMode });
        const copied = await copyMarkup(markup);
        if (!copied) {
          showBanner('Copy failed. Please select and copy manually.', 'error');
          nodes.copyLive.textContent = 'Copy failed. Please select and copy manually.';
          return;
        }
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        App.toast(outlookMode ? 'Outlook HTML copied!' : 'Signature HTML copied!');
        nodes.copyLive.textContent = outlookMode ? 'Outlook signature HTML copied.' : 'Signature HTML copied.';
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      }

      function handleDownload() {
        syncStateFromInputs();
        hideBanner();
        const issues = validateBeforeExport();
        if (issues.length) {
          showBanner(issues.join(' '), 'error');
          nodes.copyLive.textContent = issues.join(' ');
          return;
        }
        const markup = buildSignatureHtml(state, { preview: false, outlook: false });
        downloadTextFile('signature.html', buildHtmlDocument(markup));
        App.toast('HTML file downloaded.');
        nodes.copyLive.textContent = 'Signature HTML file downloaded.';
      }

      function scheduleStandardRefresh() {
        syncStateFromInputs();
        debouncedRenderPreview();
        debouncedPersist();
      }

      function immediateRefresh(options = {}) {
        syncStateFromInputs();
        renderPreview(Boolean(options.fade));
        debouncedPersist();
      }

      function clearSampleValueIfNeeded(target) {
        const fieldKey = target.dataset.sampleField;
        if (!fieldKey || !pristineSampleFields.has(fieldKey)) return;
        if (target.value === sampleFields[fieldKey]) {
          target.value = '';
        }
        pristineSampleFields.delete(fieldKey);
      }

      container.addEventListener('focusin', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        clearSampleValueIfNeeded(target);
      });

      container.addEventListener('input', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.dataset.sampleField) pristineSampleFields.delete(target.dataset.sampleField);

        if (target === nodes.accentColor) {
          nodes.accentHex.value = normalizeHexColor(nodes.accentColor.value, state.accentColor);
          immediateRefresh();
          return;
        }
        if (target === nodes.accentHex) {
          const normalized = normalizeHexColor(nodes.accentHex.value, state.accentColor);
          if (/^#[0-9A-F]{6}$/i.test(normalized)) {
            nodes.accentColor.value = normalized;
            immediateRefresh();
          } else {
            scheduleStandardRefresh();
          }
          return;
        }
        if (target === nodes.disclaimerText) {
          scheduleStandardRefresh();
          return;
        }
        if (target.matches('[data-social-url], [data-social-label], [data-field], [data-social-enabled]')) {
          scheduleStandardRefresh();
        }
      });

      container.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target === nodes.disclaimerToggle) {
          immediateRefresh();
          return;
        }
        if (target.matches('[data-template]')) return;
        if (target.matches('[data-social-enabled], [data-social-url], [data-social-label], [data-field]')) {
          scheduleStandardRefresh();
        }
      });

      container.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.dataset.template) {
          state.template = button.dataset.template;
          renderPreview(true);
          debouncedPersist();
          return;
        }
        if (button.dataset.previewClient) {
          state.previewClient = button.dataset.previewClient;
          renderPreview(false);
          debouncedPersist();
          return;
        }
        if (button.dataset.previewMobile === 'toggle') {
          state.mobilePreview = !state.mobilePreview;
          renderPreview(false);
          debouncedPersist();
        }
      });

      nodes.profileInput.addEventListener('change', () => {
        const file = nodes.profileInput.files && nodes.profileInput.files[0];
        if (!file) return;
        setTimeout(async () => {
          try {
            const result = await processProfilePhoto(file);
            state.profilePhotoData = result.dataUrl;
            state.profilePhotoName = result.fileName;
            state.profilePhotoWidth = result.width;
            state.profilePhotoHeight = result.height;
            updateUploadPreviews();
            renderPreview(false);
            debouncedPersist();
            hideBanner();
          } catch (error) {
            showBanner(String(error.message || error), 'error');
          }
        }, 0);
      });

      nodes.logoInput.addEventListener('change', () => {
        const file = nodes.logoInput.files && nodes.logoInput.files[0];
        if (!file) return;
        setTimeout(async () => {
          try {
            const result = await processCompanyLogo(file);
            state.companyLogoData = result.dataUrl;
            state.companyLogoName = result.fileName;
            state.companyLogoWidth = result.width;
            state.companyLogoHeight = result.height;
            updateUploadPreviews();
            renderPreview(false);
            debouncedPersist();
            hideBanner();
          } catch (error) {
            showBanner(String(error.message || error), 'error');
          }
        }, 0);
      });

      nodes.removePhotoButton.addEventListener('click', () => {
        state.profilePhotoData = '';
        state.profilePhotoName = '';
        nodes.profileInput.value = '';
        updateUploadPreviews();
        renderPreview(false);
        debouncedPersist();
      });

      nodes.removeLogoButton.addEventListener('click', () => {
        state.companyLogoData = '';
        state.companyLogoName = '';
        nodes.logoInput.value = '';
        updateUploadPreviews();
        renderPreview(false);
        debouncedPersist();
      });

      nodes.copyButton.addEventListener('click', () => handleCopy(nodes.copyButton, false));
      nodes.copyOutlookButton.addEventListener('click', () => handleCopy(nodes.copyOutlookButton, true));
      nodes.downloadButton.addEventListener('click', handleDownload);

      populateForm();
      updateToggleVisibility();
      updateUploadPreviews();
      updateCountsAndWarnings();
      renderPreview(false);
    },
  });
})();
