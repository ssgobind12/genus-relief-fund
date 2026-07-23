/**
 * Gallery Module
 * Image gallery with lightbox viewer.
 */

import { getGalleryImages } from './supabase.js';

let currentImageIndex = 0;
let imagesData = [];

export async function initGallery() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) return;

  try {
    const dbImages = await getGalleryImages();

    // Use poster as default + any DB images
    imagesData = [
      { id: 'poster', image_url: './assets/poster.jpg', caption: 'Genus Flood Relief Drive – Official Poster' },
    ];

    if (dbImages && dbImages.length > 0) {
      imagesData = [...imagesData, ...dbImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
        caption: img.caption || 'Relief Activity'
      }))];
    }

    // Render gallery
    galleryGrid.innerHTML = '';
    imagesData.forEach((imgData, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item animate-on-scroll';
      item.innerHTML = `
        <img src="${imgData.image_url}" alt="${imgData.caption}" loading="lazy" />
        <div class="gallery-caption">${imgData.caption}</div>
        <div class="gallery-overlay">
          <span>View</span>
        </div>
      `;
      item.addEventListener('click', () => openLightbox(index));
      galleryGrid.appendChild(item);
    });

    // Create lightbox if it doesn't exist
    createLightbox();

  } catch (error) {
    console.error('Error loading gallery:', error);
  }
}

function createLightbox() {
  // Remove existing lightbox if any
  const existing = document.getElementById('lightbox');
  if (existing) existing.remove();

  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <button class="lightbox-close" id="lightbox-close">&times;</button>
    <button class="lightbox-nav lightbox-prev" id="lightbox-prev">&#10094;</button>
    <div class="lightbox-content">
      <img id="lightbox-img" alt="Gallery image" />
      <p id="lightbox-caption" class="lightbox-caption"></p>
    </div>
    <button class="lightbox-nav lightbox-next" id="lightbox-next">&#10095;</button>
  `;
  document.body.appendChild(lightbox);

  // Event listeners
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });
  document.getElementById('lightbox-next').addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);

  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
}

export function openLightbox(index) {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');

  if (!lightbox || !img) return;

  currentImageIndex = index;
  const imageData = imagesData[currentImageIndex];

  img.src = imageData.image_url;
  if (caption) caption.textContent = imageData.caption || '';

  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

export function navigateLightbox(direction) {
  currentImageIndex += direction;
  if (currentImageIndex < 0) currentImageIndex = imagesData.length - 1;
  if (currentImageIndex >= imagesData.length) currentImageIndex = 0;

  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const imageData = imagesData[currentImageIndex];

  if (img) img.src = imageData.image_url;
  if (caption) caption.textContent = imageData.caption || '';
}
