/**
 * Recent Donations Module
 * Scrolling ticker showing recent verified donations.
 */

import { getRecentDonations } from './supabase.js';

export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 7) return days === 1 ? 'Yesterday' : `${days} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getInitials(name) {
  if (!name || name === 'Anonymous') return '🤝';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function maskName(name) {
  if (!name || name === 'Anonymous') return 'Anonymous';
  if (name.includes('*')) return name; // Already masked
  
  return name.trim().split(' ').map(part => {
    if (part.length <= 1) return part;
    return part.charAt(0) + '*'.repeat(Math.min(5, Math.max(3, part.length - 1)));
  }).join(' ');
}

export function getAvatarColor(name) {
  if (!name || name === 'Anonymous') return '#6b7280';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 45%)`;
}

export function createDonationItem(donation) {
  const div = document.createElement('div');
  div.className = 'donation-item';
  const initials = getInitials(donation.donor_name);
  const avatarColor = getAvatarColor(donation.donor_name);

  div.innerHTML = `
    <div class="donor-avatar" style="background-color: ${avatarColor}">
      ${initials}
    </div>
    <div class="donation-details">
      <div class="donation-header">
        <span class="donor-name">${maskName(donation.donor_name)}</span>
        <span class="donation-amount">₹${donation.amount.toLocaleString('en-IN')}</span>
      </div>
      <div class="donation-meta">
        <span class="donation-time">${timeAgo(donation.created_at)}</span>
        ${donation.city ? `<span class="donation-city">• ${donation.city}</span>` : ''}
      </div>
      ${donation.message ? `<p class="donation-message">"${donation.message}"</p>` : ''}
    </div>
  `;
  return div;
}

let scrollInterval;
let isPaused = false;

export function startAutoScroll() {
  const container = document.getElementById('donations-ticker');
  if (!container) return;

  container.addEventListener('mouseenter', () => isPaused = true);
  container.addEventListener('mouseleave', () => isPaused = false);

  clearInterval(scrollInterval);
  scrollInterval = setInterval(() => {
    if (!isPaused && container.children.length > 0) {
      container.scrollTop += 1;
      if (container.scrollTop >= (container.scrollHeight - container.clientHeight)) {
        container.scrollTop = 0;
      }
    }
  }, 40);
}

export async function initRecentDonations() {
  const container = document.getElementById('donations-ticker');
  if (!container) return;

  const loadDonations = async () => {
    try {
      const donations = await getRecentDonations(20);
      container.innerHTML = '';

      if (donations.length === 0) {
        container.innerHTML = '<div class="ticker-placeholder"><p>No donations yet. Be the first!</p></div>';
        return;
      }

      donations.forEach(donation => {
        container.appendChild(createDonationItem(donation));
      });

      // Clone items for infinite scroll effect
      if (container.scrollHeight <= container.clientHeight && donations.length > 0) {
        donations.forEach(donation => {
          container.appendChild(createDonationItem(donation));
        });
      }

      startAutoScroll();
    } catch (error) {
      console.error('Error loading recent donations:', error);
      container.innerHTML = '<div class="ticker-placeholder"><p>Unable to load donations</p></div>';
    }
  };

  await loadDonations();

  // Refresh every 60 seconds
  setInterval(loadDonations, 60000);
}
