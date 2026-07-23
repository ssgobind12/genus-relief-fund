/**
 * Animated Counter Module
 * Handles the live donation statistics counters with smooth animations.
 */

export function formatIndianNumber(num) {
  const x = Math.floor(num).toString().split('.');
  let lastThree = x[0].substring(x[0].length - 3);
  const otherNumbers = x[0].substring(0, x[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
}

function easeOutQuart(x) {
  return 1 - Math.pow(1 - x, 4);
}

export function animateValue(element, start, end, duration, prefix = '', suffix = '') {
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const currentValue = Math.floor(easedProgress * (end - start) + start);

    element.textContent = prefix + formatIndianNumber(currentValue) + suffix;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = prefix + formatIndianNumber(end) + suffix;
    }
  };

  window.requestAnimationFrame(step);
}

export function initCounters() {
  const observerOptions = { threshold: 0.1 };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        if (!counter.classList.contains('counted')) {
          const targetValue = parseInt(counter.getAttribute('data-target') || '0', 10);
          const prefix = counter.getAttribute('data-prefix') || '';
          const suffix = counter.getAttribute('data-suffix') || '';
          animateValue(counter, 0, targetValue, 2000, prefix, suffix);
          counter.classList.add('counted');
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.counter-value').forEach(counter => {
    observer.observe(counter);
  });
}

export function updateCounters(stats) {
  if (!stats) return;

  // Map element IDs to stat values
  const mappings = {
    'stat-donors': { value: stats.total_donors, prefix: '', suffix: '' },
    'stat-amount': { value: stats.total_amount, prefix: '₹', suffix: '' },
    'stat-today': { value: stats.today_amount, prefix: '₹', suffix: '' },
    'stat-families': { value: stats.families_supported, prefix: '', suffix: '' },
  };

  for (const [id, config] of Object.entries(mappings)) {
    const el = document.getElementById(id);
    if (el) {
      const currentTarget = parseInt(el.getAttribute('data-target') || '0', 10);
      if (currentTarget !== config.value) {
        el.setAttribute('data-target', config.value);
        el.classList.remove('counted');

        if (isElementInViewport(el)) {
          animateValue(el, currentTarget, config.value, 1500, config.prefix, config.suffix);
          el.classList.add('counted');
        }
      }
    }
  }
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
