/**
 * UPI QR Generator — script.js
 * Pure vanilla JS, no dependencies beyond QRCode.js (loaded via CDN).
 * 
 * Features:
 *  - UPI URL construction & QR generation
 *  - Live preview while typing (debounced)
 *  - Input validation with graceful error messages
 *  - Download as PNG (with label canvas composition)
 *  - Web Share API integration
 *  - Copy UPI ID to clipboard
 *  - Dark mode (persisted to localStorage)
 *  - Toast notification system
 */

/* ─────────────────────────────────────────────────────────
   1. DOM References
   ───────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

const personNameInput = $('personName');
const upiIdInput      = $('upiId');
const amountInput     = $('amount');
const generateBtn     = $('generateBtn');
const resetBtn        = $('resetBtn');
const copyUpiBtn      = $('copyUpiBtn');
const copyLabel       = $('copyLabel');
const downloadBtn     = $('downloadBtn');
const shareBtn        = $('shareBtn');
const livePreviewChk  = $('livePreview');
const themeToggle     = $('themeToggle');
const toggleIcon      = $('toggleIcon');
const toast           = $('toast');

// Nav elements
const hamburger       = $('hamburger');
const navLinks        = $('navLinks');
const navDropdownItem = $('navDropdownItem');
const navDropdownBtn  = $('navDropdownBtn');
const navAbout        = $('navAbout');
const navHome         = $('navHome');
const ddHowToUse      = $('ddHowToUse');
const ddApps          = $('ddApps');

const placeholderState = $('placeholderState');
const qrOutput         = $('qrOutput');
const qrCanvas         = $('qrCanvas');
const displayName      = $('displayName');
const displayUpi       = $('displayUpi');
const displayAmount    = $('displayAmount');

const nameError   = $('nameError');
const upiError    = $('upiError');
const amountError = $('amountError');

/* ─────────────────────────────────────────────────────────
   2. State
   ───────────────────────────────────────────────────────── */
let qrInstance   = null;   // QRCode.js instance
let currentUpiUrl = '';    // last generated URL
let liveDebounce  = null;  // debounce timer

const UPI_REGEX = /^[\w.\-_+]+@[\w]+$/;

/* ─────────────────────────────────────────────────────────
   3. Theme (Dark / Light)
   ───────────────────────────────────────────────────────── */
(function initTheme() {
  const saved = localStorage.getItem('upi-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = saved ? saved === 'dark' : prefersDark;
  applyTheme(dark);
})();

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  toggleIcon.textContent = dark ? '🌙' : '☀️';
  localStorage.setItem('upi-theme', dark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
});

/* ─────────────────────────────────────────────────────────
   4. Validation Helpers
   ───────────────────────────────────────────────────────── */
/**
 * Validates all inputs.
 * @param {boolean} silent — if true, doesn't render error messages.
 * @returns {boolean} true if valid.
 */
function validateInputs(silent = false) {
  const name   = personNameInput.value.trim();
  const upi    = upiIdInput.value.trim();
  const amount = amountInput.value.trim();
  let valid = true;

  // Name
  if (!name) {
    if (!silent) setError(personNameInput, nameError, 'Please enter a name.');
    valid = false;
  } else {
    clearError(personNameInput, nameError);
  }

  // UPI ID
  if (!upi) {
    if (!silent) setError(upiIdInput, upiError, 'UPI ID is required.');
    valid = false;
  } else if (!UPI_REGEX.test(upi)) {
    if (!silent) setError(upiIdInput, upiError, 'Invalid UPI ID format (e.g. name@okaxis).');
    valid = false;
  } else {
    clearError(upiIdInput, upiError);
  }

  // Amount (optional but must be a valid positive number if provided)
  if (amount !== '') {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      if (!silent) setError(amountInput, amountError, 'Enter a valid positive amount.');
      valid = false;
    } else if (num > 100000) {
      if (!silent) setError(amountInput, amountError, 'Amount cannot exceed ₹1,00,000.');
      valid = false;
    } else {
      clearError(amountInput, amountError);
    }
  } else {
    clearError(amountInput, amountError);
  }

  return valid;
}

function setError(input, errorEl, msg) {
  input.classList.add('error-state');
  errorEl.textContent = msg;
}

function clearError(input, errorEl) {
  input.classList.remove('error-state');
  errorEl.textContent = '';
}

function clearAllErrors() {
  clearError(personNameInput, nameError);
  clearError(upiIdInput, upiError);
  clearError(amountInput, amountError);
}

/* ─────────────────────────────────────────────────────────
   5. UPI URL Builder
   ───────────────────────────────────────────────────────── */
function buildUpiUrl(name, upiId, amount) {
  let url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR`;
  if (amount && parseFloat(amount) > 0) {
    url += `&am=${encodeURIComponent(parseFloat(amount).toFixed(2))}`;
  }
  return url;
}

/* ─────────────────────────────────────────────────────────
   6. QR Code Generation
   ───────────────────────────────────────────────────────── */
function generateQR(upiUrl) {
  // Clear previous
  qrCanvas.innerHTML = '';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const fgColor = isDark ? '#f0ecf8' : '#1a1523';
  const bgColor = isDark ? '#ffffff' : '#ffffff'; // always white for QR readability

  try {
    qrInstance = new QRCode(qrCanvas, {
      text: upiUrl,
      width: 200,
      height: 200,
      colorDark: '#1a1523',   // always dark for scanner compatibility
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    return true;
  } catch (e) {
    console.error('QR generation failed:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────
   7. Show / Hide Result
   ───────────────────────────────────────────────────────── */
function showResult(name, upiId, amount) {
  // Update info labels
  displayName.textContent   = name;
  displayUpi.textContent    = upiId;
  displayAmount.textContent = amount && parseFloat(amount) > 0
    ? `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : 'Any amount';

  // Toggle visibility
  placeholderState.hidden = true;
  qrOutput.hidden = false;
}

function showPlaceholder() {
  placeholderState.hidden = false;
  qrOutput.hidden = true;
}

/* ─────────────────────────────────────────────────────────
   8. Main Generate Action
   ───────────────────────────────────────────────────────── */
function doGenerate(silent = false) {
  if (!validateInputs(silent)) {
    if (!silent) showPlaceholder();
    return false;
  }

  const name   = personNameInput.value.trim();
  const upiId  = upiIdInput.value.trim();
  const amount = amountInput.value.trim();

  const upiUrl = buildUpiUrl(name, upiId, amount);

  // Skip regeneration if URL hasn't changed (perf optimization)
  if (upiUrl === currentUpiUrl) return true;
  currentUpiUrl = upiUrl;

  const ok = generateQR(upiUrl);
  if (!ok) {
    if (!silent) showToast('⚠️ Failed to generate QR code.');
    return false;
  }

  showResult(name, upiId, amount);
  return true;
}

/* ─────────────────────────────────────────────────────────
   9. Live Preview (debounced)
   ───────────────────────────────────────────────────────── */
function scheduleLivePreview() {
  if (!livePreviewChk.checked) return;
  clearTimeout(liveDebounce);
  liveDebounce = setTimeout(() => {
    doGenerate(true); // silent = don't flash errors while typing
  }, 450);
}

[personNameInput, upiIdInput, amountInput].forEach((el) => {
  el.addEventListener('input', scheduleLivePreview);
});

/* ─────────────────────────────────────────────────────────
   10. Button: Generate
   ───────────────────────────────────────────────────────── */
generateBtn.addEventListener('click', () => {
  doGenerate(false);
});

/* Allow Enter key in any field to generate */
[personNameInput, upiIdInput, amountInput].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doGenerate(false); }
  });
});

/* ─────────────────────────────────────────────────────────
   11. Button: Reset
   ───────────────────────────────────────────────────────── */
resetBtn.addEventListener('click', () => {
  personNameInput.value = '';
  upiIdInput.value      = '';
  amountInput.value     = '';
  clearAllErrors();
  currentUpiUrl = '';
  qrCanvas.innerHTML = '';
  qrInstance = null;
  showPlaceholder();
  showToast('🔄 Form cleared.');
  personNameInput.focus();
});

/* ─────────────────────────────────────────────────────────
   12. Button: Copy UPI ID
   ───────────────────────────────────────────────────────── */
copyUpiBtn.addEventListener('click', async () => {
  const upi = upiIdInput.value.trim();
  if (!upi) { showToast('⚠️ No UPI ID to copy.'); return; }

  try {
    await navigator.clipboard.writeText(upi);
    copyLabel.textContent = 'Copied!';
    copyUpiBtn.classList.add('copied');
    showToast('✅ UPI ID copied!');
    setTimeout(() => {
      copyLabel.textContent = 'Copy';
      copyUpiBtn.classList.remove('copied');
    }, 2000);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = upi;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✅ UPI ID copied!');
  }
});

/* ─────────────────────────────────────────────────────────
   13. Button: Download PNG
   ───────────────────────────────────────────────────────── */
downloadBtn.addEventListener('click', () => {
  if (!currentUpiUrl) {
    showToast('⚠️ Generate a QR code first.');
    return;
  }

  // Get the QR canvas element rendered by QRCode.js
  const qrImg = qrCanvas.querySelector('canvas') || qrCanvas.querySelector('img');
  if (!qrImg) { showToast('⚠️ QR not ready yet.'); return; }

  const name   = displayName.textContent;
  const upiId  = displayUpi.textContent;
  const amount = displayAmount.textContent;

  // Compose a nice download canvas with label below
  const padding     = 28;
  const qrSize      = 200;
  const headerH     = 48;
  const infoH       = 80;
  const totalW      = qrSize + padding * 2;
  const totalH      = headerH + qrSize + infoH + padding * 1.5;

  const cvs = document.createElement('canvas');
  cvs.width  = totalW * 2;  // 2× for high DPI
  cvs.height = totalH * 2;
  const ctx  = cvs.getContext('2d');
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  // Top accent bar
  const grad = ctx.createLinearGradient(0, 0, totalW, 0);
  grad.addColorStop(0, '#3d2b8e');
  grad.addColorStop(1, '#f5761a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, totalW, 4);

  // Header text
  ctx.fillStyle = '#1a1523';
  ctx.font = '700 15px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UPI Payment QR', totalW / 2, 30);

  // Draw QR image
  const qrY = headerH;
  if (qrImg.tagName === 'CANVAS') {
    ctx.drawImage(qrImg, padding, qrY, qrSize, qrSize);
  } else {
    ctx.drawImage(qrImg, padding, qrY, qrSize, qrSize);
  }

  // Info section
  const infoY = qrY + qrSize + 16;
  ctx.fillStyle = '#1a1523';
  ctx.font = '600 13px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, totalW / 2, infoY);

  ctx.fillStyle = '#3d2b8e';
  ctx.font = '400 11px monospace';
  ctx.fillText(upiId, totalW / 2, infoY + 20);

  ctx.fillStyle = '#f5761a';
  ctx.font = '700 14px "DM Serif Display", serif';
  ctx.fillText(amount, totalW / 2, infoY + 42);

  // Footer note
  ctx.fillStyle = '#b8b2c3';
  ctx.font = '400 9px "DM Sans", sans-serif';
  ctx.fillText('Scan with any UPI app — PhonePe · GPay · Paytm · BHIM', totalW / 2, infoY + 62);

  // Bottom accent line
  ctx.fillStyle = grad;
  ctx.fillRect(0, totalH - 3, totalW, 3);

  // Trigger download
  const link = document.createElement('a');
  const safeName = (name || 'upi-qr').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  link.download = `upi-qr-${safeName}.png`;
  link.href = cvs.toDataURL('image/png');
  link.click();
  showToast('📥 QR saved as PNG!');
});

/* ─────────────────────────────────────────────────────────
   14. Button: Share
   Fix: upi:// is a deep-link scheme, NOT a valid web URL.
   Web Share API requires https:// URLs on most browsers.
   Solution: share as text (name + UPI ID + amount).
   Fallback: copy the share text to clipboard.
   ───────────────────────────────────────────────────────── */
shareBtn.addEventListener('click', async () => {
  if (!currentUpiUrl) {
    showToast('⚠️ Generate a QR code first.');
    return;
  }

  const name   = displayName.textContent;
  const upiId  = displayUpi.textContent;
  const amount = displayAmount.textContent;

  const shareText =
    `💳 Pay via UPI\n` +
    `Name: ${name}\n` +
    `UPI ID: ${upiId}\n` +
    `Amount: ${amount}\n\n` +
    `Open any UPI app → Scan QR or pay to ${upiId}`;

  // Web Share API (works on mobile browsers with HTTPS)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Pay ${name} via UPI`,
        text: shareText,
        // NOTE: upi:// cannot be used as a share URL — omit it
      });
      return; // success
    } catch (e) {
      if (e.name === 'AbortError') return; // user cancelled — do nothing
      // Fall through to clipboard fallback on other errors
    }
  }

  // Clipboard fallback for desktop / unsupported browsers
  try {
    await navigator.clipboard.writeText(shareText);
    showToast('🔗 Payment details copied to clipboard!');
  } catch {
    // Last-resort fallback for very old browsers
    const ta = document.createElement('textarea');
    ta.value = shareText;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('🔗 Payment details copied!');
  }
});

/* ─────────────────────────────────────────────────────────
   15. Toast Notifications
   ───────────────────────────────────────────────────────── */
let toastTimer = null;

function showToast(message, duration = 2600) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/* ─────────────────────────────────────────────────────────
   16. Navigation — Hamburger & Dropdown
   ───────────────────────────────────────────────────────── */

// Hamburger: toggle mobile nav
hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  hamburger.classList.toggle('is-open', open);
  hamburger.setAttribute('aria-expanded', open);
  navDropdownBtn.setAttribute('aria-expanded', 'false');
  navDropdownItem.classList.remove('mobile-dd-open');
});

// Mobile dropdown toggle (tap on "More" button)
navDropdownBtn.addEventListener('click', () => {
  const isMobile = window.innerWidth <= 600;
  if (!isMobile) return; // desktop: CSS handles hover
  const open = navDropdownItem.classList.toggle('mobile-dd-open');
  navDropdownBtn.setAttribute('aria-expanded', open);
});

// Close nav on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.top-nav')) {
    navLinks.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});

// Close mobile nav when a nav link is clicked
navLinks.querySelectorAll('a.nav-link, a.dropdown-item').forEach((el) => {
  el.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// "Home" nav link — scroll to top, set active state
navHome.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setActiveNav(navHome);
});

// "About App" nav link — smooth scroll to about section
navAbout.addEventListener('click', (e) => {
  e.preventDefault();
  const section = document.getElementById('aboutSection');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setActiveNav(navAbout);
});

// "How to Use" dropdown item — scroll to about section steps
if (ddHowToUse) {
  ddHowToUse.addEventListener('click', (e) => {
    e.preventDefault();
    const steps = document.querySelector('.about-steps');
    if (steps) steps.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else document.getElementById('aboutSection')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// "Supported UPI Apps" dropdown item — show toast with info
if (ddApps) {
  ddApps.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('📱 Works with PhonePe, GPay, Paytm, BHIM, Amazon Pay & all UPI apps!', 3500);
  });
}

// Update active nav link
function setActiveNav(activeEl) {
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('nav-link--active'));
  activeEl.classList.add('nav-link--active');
}

// Update active nav based on scroll position
const aboutSection = document.getElementById('aboutSection');
if (aboutSection && 'IntersectionObserver' in window) {
  const obs = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) setActiveNav(navAbout);
      else setActiveNav(navHome);
    },
    { threshold: 0.3 }
  );
  obs.observe(aboutSection);
}

/* ─────────────────────────────────────────────────────────
   17. Initial State
   ───────────────────────────────────────────────────────── */
showPlaceholder();
personNameInput.focus();
