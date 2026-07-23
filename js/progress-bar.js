/**
 * Progress Bar Module
 * Animated progress bar showing fundraising progress toward target.
 */

import { getTargetAmount, getDonationStats } from './supabase.js';
import { formatIndianNumber } from './counter.js';

export function formatCurrency(amount) {
  return '₹' + formatIndianNumber(Math.floor(amount));
}

export function animateProgress(current, target) {
  const progressBar = document.getElementById('progress-fill');
  const percentEl = document.getElementById('progress-percent');
  if (!progressBar) return;

  const percentage = Math.min((current / target) * 100, 100);

  // Start from 0 and animate
  progressBar.style.width = '0%';

  setTimeout(() => {
    progressBar.style.transition = 'width 2s cubic-bezier(0.4, 0, 0.2, 1)';
    progressBar.style.width = `${percentage}%`;
  }, 200);

  if (percentEl) {
    // Animate percentage number
    let startPercent = 0;
    const duration = 2000;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * percentage);
      percentEl.textContent = current + '%';

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        percentEl.textContent = Math.floor(percentage) + '%';
      }
    }

    requestAnimationFrame(tick);
  }
}

export function updateProgress(current, target) {
  const raisedEl = document.getElementById('progress-raised');
  const targetEl = document.getElementById('progress-target');

  if (raisedEl) raisedEl.textContent = formatCurrency(current);
  if (targetEl) targetEl.textContent = formatCurrency(target);

  animateProgress(current, target);
}

export async function initProgressBar() {
  const progressSection = document.getElementById('progress-section');
  if (!progressSection) return;

  try {
    const target = await getTargetAmount();
    const stats = await getDonationStats();
    const current = stats ? stats.total_amount : 0;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateProgress(current, target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(progressSection);

  } catch (error) {
    console.error('Error initializing progress bar:', error);
  }
}
