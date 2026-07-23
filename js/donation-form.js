/**
 * Donation Form Module
 * Handles the "I Have Donated" modal form, validation, submission, and success overlay.
 */

import { submitDonation, uploadScreenshot } from './supabase.js';

export function initDonationForm() {
  const donateBtn = document.getElementById('btn-donated');
  const modal = document.getElementById('donation-modal');
  const closeModalBtn = document.getElementById('modal-close');
  const modalBackdrop = modal?.querySelector('.modal-backdrop');
  const form = document.getElementById('donation-form');
  const anonCheckbox = document.getElementById('donor-anonymous');
  const nameInput = document.getElementById('donor-name');
  const screenshotInput = document.getElementById('donor-screenshot');
  const fileUpload = document.getElementById('file-upload');
  const fileUploadContent = document.getElementById('file-upload-content');
  const filePreview = document.getElementById('file-preview');
  const filePreviewImg = document.getElementById('file-preview-img');
  const fileRemoveBtn = document.getElementById('file-remove');

  // Open modal
  if (donateBtn && modal) {
    donateBtn.addEventListener('click', () => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (window.lucide) window.lucide.createIcons();
    });
  }

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Close on X button
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  // Close on backdrop click
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // Close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
      closeModal();
    }
  });

  // Anonymous toggle
  if (anonCheckbox && nameInput) {
    anonCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        nameInput.value = 'Anonymous';
        nameInput.disabled = true;
      } else {
        nameInput.value = '';
        nameInput.disabled = false;
        nameInput.focus();
      }
    });
  }

  // File upload - drag & drop
  if (fileUpload && screenshotInput) {
    ['dragenter', 'dragover'].forEach(event => {
      fileUpload.addEventListener(event, (e) => {
        e.preventDefault();
        fileUpload.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(event => {
      fileUpload.addEventListener(event, (e) => {
        e.preventDefault();
        fileUpload.classList.remove('dragover');
      });
    });

    fileUpload.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        screenshotInput.files = e.dataTransfer.files;
        showFilePreview(file);
      }
    });

    screenshotInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        showFilePreview(file);
      }
    });
  }

  function showFilePreview(file) {
    if (!filePreview || !filePreviewImg || !fileUploadContent) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreviewImg.src = e.target.result;
      filePreview.style.display = 'flex';
      fileUploadContent.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  // Remove file
  if (fileRemoveBtn) {
    fileRemoveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (screenshotInput) screenshotInput.value = '';
      if (filePreview) filePreview.style.display = 'none';
      if (fileUploadContent) fileUploadContent.style.display = 'flex';
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('btn-submit');
  const btnText = submitBtn?.querySelector('.btn-text');
  const btnLoading = submitBtn?.querySelector('.btn-loading');

  try {
    // Show loading state
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    if (submitBtn) submitBtn.disabled = true;

    // Gather form data
    const name = document.getElementById('donor-name').value.trim();
    const mobile = document.getElementById('donor-mobile').value.trim();
    const email = document.getElementById('donor-email')?.value.trim() || null;
    const amount = Number(document.getElementById('donor-amount').value);
    const city = document.getElementById('donor-city')?.value.trim() || null;
    const transactionId = document.getElementById('donor-txn').value.trim();
    const message = document.getElementById('donor-message')?.value.trim() || null;
    const isAnonymous = document.getElementById('donor-anonymous')?.checked || false;
    const screenshotFile = document.getElementById('donor-screenshot')?.files[0];

    // Validation
    if (!name) throw new Error('Please enter your name');
    if (!/^\d{10}$/.test(mobile)) throw new Error('Please enter a valid 10-digit mobile number');
    if (amount <= 0 || isNaN(amount)) throw new Error('Please enter a valid donation amount');
    if (!transactionId) throw new Error('Please enter the Transaction ID / UTR number');

    // Upload screenshot if provided
    let screenshotUrl = null;
    if (screenshotFile && screenshotFile.size > 0) {
      if (screenshotFile.size > 5 * 1024 * 1024) {
        throw new Error('Screenshot file must be less than 5MB');
      }
      screenshotUrl = await uploadScreenshot(screenshotFile);
    }

    // Submit donation
    const donationData = {
      donor_name: name,
      mobile,
      email,
      amount,
      transaction_id: transactionId,
      city,
      message,
      is_anonymous: isAnonymous,
      screenshot_url: screenshotUrl,
      is_verified: false,
      is_rejected: false,
    };

    const result = await submitDonation(donationData);

    if (result.success) {
      // Close modal
      const modal = document.getElementById('donation-modal');
      if (modal) modal.classList.remove('active');

      // Show success overlay
      showSuccessOverlay(isAnonymous ? 'Kind Soul' : name, amount);

      // Reset form
      form.reset();
      const filePreview = document.getElementById('file-preview');
      const fileUploadContent = document.getElementById('file-upload-content');
      if (filePreview) filePreview.style.display = 'none';
      if (fileUploadContent) fileUploadContent.style.display = 'flex';
    }
  } catch (error) {
    showFormError(error.message || 'Something went wrong. Please try again.');
  } finally {
    if (btnText) btnText.style.display = 'flex';
    if (btnLoading) btnLoading.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
  }
}

function showSuccessOverlay(name, amount) {
  const overlay = document.getElementById('success-overlay');
  const successName = document.getElementById('success-name');
  const successAmount = document.getElementById('success-amount');

  if (overlay) {
    if (successName) successName.textContent = name;
    if (successAmount) successAmount.textContent = '₹' + amount.toLocaleString('en-IN');

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Dispatch event for confetti and certificate
    const event = new CustomEvent('donationSuccess', {
      detail: { name, amount }
    });
    window.dispatchEvent(event);

    // Re-create Lucide icons in success overlay
    if (window.lucide) window.lucide.createIcons();
  }
}

function showFormError(message) {
  // Create or update error element
  let errorEl = document.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    const form = document.getElementById('donation-form');
    if (form) form.prepend(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}
