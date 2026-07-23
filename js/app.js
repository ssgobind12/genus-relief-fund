/**
 * Genus Flood Relief Drive – Main Application
 * Entry point that initializes all modules and handles global functionality.
 */

import { getDonationStats, getTargetAmount, subscribeToUpdates, DEMO_MODE } from './supabase.js';
import { initCounters, updateCounters } from './counter.js';
import { initDonationForm } from './donation-form.js';
import { initRecentDonations } from './recent-donations.js';
import { initProgressBar, updateProgress } from './progress-bar.js';
import { initShare } from './share.js';
import { initGallery } from './gallery.js';
import { downloadCertificate } from './certificate.js';
import { initCertificateCheck } from './certificate-check.js';
import { initSecurity } from './security.js';

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  // Setup UI interactions first (no async needed)
  setupDarkMode();
  setupSmoothScroll();
  setupMobileMenu();
  setupScrollAnimations();
  setupScrollToTop();
  setupCopyUPI();
  setupDownloadQR();
  setupImpactCards();
  
  // Security measures
  initSecurity();

  // Show demo banner if needed
  if (DEMO_MODE) {
    const banner = document.getElementById('demo-banner');
    if (banner) {
      banner.style.display = 'flex';
      const closeBtn = document.getElementById('demo-banner-close');
      if (closeBtn) closeBtn.addEventListener('click', () => {
        banner.style.display = 'none';
        const nav = document.getElementById('main-nav');
        if (nav) nav.style.top = '0';
      });
      // Push nav down
      const nav = document.getElementById('main-nav');
      if (nav) nav.style.top = '40px';
    }
  }

  // Initialize modules
  initCounters();
  initDonationForm();
  initRecentDonations();
  initShare();
  initGallery();
  initCertificateCheck();

  // Load data
  await refreshData();
  
  // Real-time updates
  subscribeToUpdates(refreshData);

  // Setup success overlay listeners
  setupSuccessListeners();

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Hide loading screen
  hideLoader();
}

// ==================== LOADING SCREEN ====================

function hideLoader() {
  const loader = document.getElementById('loading-screen');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 600);
  }
}

// ==================== DARK MODE ====================

function setupDarkMode() {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (!toggleBtn) return;

  const iconMoon = toggleBtn.querySelector('.icon-moon');
  const iconSun = toggleBtn.querySelector('.icon-sun');

  // Check saved preference or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateDarkModeIcons(currentTheme, iconMoon, iconSun);

  toggleBtn.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateDarkModeIcons(theme, iconMoon, iconSun);
  });
}

function updateDarkModeIcons(theme, moonIcon, sunIcon) {
  if (!moonIcon || !sunIcon) return;
  if (theme === 'dark') {
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
  } else {
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
  }
}

// ==================== SMOOTH SCROLL ====================

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) mobileMenu.classList.remove('active');
        
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (menuBtn) menuBtn.classList.remove('active');

        const headerOffset = DEMO_MODE ? 120 : 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });
}

// ==================== MOBILE MENU ====================

function setupMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Nav background on scroll
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }
}

// ==================== SCROLL ANIMATIONS ====================

function setupScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute('data-delay') || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, parseInt(delay));
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));

  // Active nav link based on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ==================== SCROLL TO TOP ====================

function setupScrollToTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==================== COPY UPI ID ====================

function setupCopyUPI() {
  const copyBtn = document.getElementById('copy-upi-btn');
  const upiId = document.getElementById('upi-id');

  if (copyBtn && upiId) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(upiId.textContent.trim()).then(() => {
        showToast('UPI ID copied to clipboard!', 'success');
      }).catch(() => {
        // Fallback
        const range = document.createRange();
        range.selectNode(upiId);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        showToast('UPI ID copied!', 'success');
      });
    });
  }
}

// ==================== DOWNLOAD QR ====================

function setupDownloadQR() {
  const downloadBtn = document.getElementById('download-qr-btn');
  const qrImage = document.getElementById('qr-image');

  if (downloadBtn && qrImage) {
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'Genus_Relief_UPI_QR.jpg';
      link.href = qrImage.src;
      link.click();
    });
  }
}

// ==================== IMPACT CARDS ====================

function setupImpactCards() {
  const impactCards = document.querySelectorAll('.impact-card');
  impactCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.title = 'Click to donate this amount via UPI';
    
    card.addEventListener('click', () => {
      const amountText = card.querySelector('.impact-amount')?.textContent || '';
      const amount = parseInt(amountText.replace(/\D/g, ''));
      
      if (amount) {
        // 1. Open UPI Intent with pre-filled amount and ID
        const upiId = 'ssgobind12@okaxis';
        const payeeName = 'Genus Relief Fund';
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&cu=INR&am=${amount}`;
        
        // Use a hidden iframe or direct location change to trigger app
        // Direct location change works best for mobile deep links
        window.location.href = upiLink;

        // 2. Also select the radio button in our form so it's ready when they return
        const radio = document.querySelector(`input[name="amount"][value="${amount}"]`);
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        } else {
          const customRadio = document.getElementById('amount-custom');
          const customInput = document.getElementById('custom-amount-input');
          if (customRadio && customInput) {
            customRadio.checked = true;
            customInput.value = amount;
            customRadio.dispatchEvent(new Event('change'));
          }
        }
      }
      
      // 3. Scroll to donation section so they can fill their details after paying
      const targetElement = document.getElementById('donation-section');
      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        // Small delay to allow UPI intent to fire first
        setTimeout(() => {
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }, 300);
      }
    });
  });
}

// ==================== REFRESH DATA ====================

async function refreshData() {
  try {
    const [stats, target] = await Promise.all([
      getDonationStats(),
      getTargetAmount()
    ]);

    if (stats) {
      updateCounters(stats);
      updateProgress(stats.total_amount, target);

      // Update hero stats
      const heroDonors = document.getElementById('hero-donors');
      const heroAmount = document.getElementById('hero-amount');
      const heroFamilies = document.getElementById('hero-families');

      if (heroDonors) heroDonors.textContent = stats.total_donors;
      if (heroAmount) heroAmount.textContent = '₹' + stats.total_amount.toLocaleString('en-IN');
      if (heroFamilies) heroFamilies.textContent = stats.families_supported;
    }
  } catch (error) {
    console.error('Failed to refresh data:', error);
  }
}

// ==================== SUCCESS OVERLAY ====================

function setupSuccessListeners() {
  // Listen for donation success event
  window.addEventListener('donationSuccess', (e) => {
    fireConfetti();

    // Share button
    const shareBtn = document.getElementById('btn-share-contribution');
    if (shareBtn) {
      const newShareBtn = shareBtn.cloneNode(true);
      shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
      newShareBtn.addEventListener('click', () => {
        const shareModal = document.getElementById('share-modal');
        if (shareModal) shareModal.style.display = 'flex';
      });
      if (window.lucide) window.lucide.createIcons({ nodes: [newShareBtn] });
    }
  });

  // Back to home from success
  const backBtn = document.getElementById('btn-back-home');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const overlay = document.getElementById('success-overlay');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Share modal close
  const shareModalClose = document.getElementById('share-modal-close');
  if (shareModalClose) {
    shareModalClose.addEventListener('click', () => {
      const shareModal = document.getElementById('share-modal');
      if (shareModal) shareModal.style.display = 'none';
    });
  }

  // Share buttons in share modal
  setupShareModalButtons();
}

function setupShareModalButtons() {
  const siteUrl = window.location.href;
  const shareText = 'I just donated to the Genus Flood Relief Drive! Every contribution helps rebuild lives. Join me in making a difference. 🙏❤️ #FloodRelief #GenusRelief';

  document.getElementById('share-wa')?.addEventListener('click', () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + siteUrl)}`, '_blank');
  });

  document.getElementById('share-tw')?.addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}`, '_blank');
  });

  document.getElementById('share-fb')?.addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`, '_blank');
  });

  document.getElementById('share-li')?.addEventListener('click', () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`, '_blank');
  });

  document.getElementById('share-copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(siteUrl).then(() => {
      showToast('Link copied to clipboard!', 'success');
    });
  });

  // Contact section share buttons
  document.getElementById('share-whatsapp')?.addEventListener('click', () => {
    window.open(`https://wa.me/?text=${encodeURIComponent('Support the Genus Flood Relief Drive! ' + siteUrl)}`, '_blank');
  });
  document.getElementById('share-twitter')?.addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Support the Genus Flood Relief Drive!')}&url=${encodeURIComponent(siteUrl)}`, '_blank');
  });
  document.getElementById('share-facebook')?.addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`, '_blank');
  });
  document.getElementById('share-linkedin')?.addEventListener('click', () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`, '_blank');
  });
}

// ==================== CONFETTI ====================

function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#004B9B', '#2E7D32', '#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#87CEEB', '#FFA07A'];
  const particles = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 6 - 3,
      speedY: Math.random() * 4 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  let frameCount = 0;
  const maxFrames = 180; // ~3 seconds at 60fps

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frameCount / maxFrames);

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.1; // gravity
      p.rotation += p.rotationSpeed;
    });

    frameCount++;
    if (frameCount < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

// ==================== TOAST NOTIFICATIONS ====================

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => toast.classList.add('show'));

  // Auto remove
  const timeout = setTimeout(() => removeToast(toast), 4000);

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timeout);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.classList.remove('show');
  toast.classList.add('hide');
  setTimeout(() => toast.remove(), 300);
}
