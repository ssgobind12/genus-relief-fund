import { checkDonationStatus } from './supabase.js';
import { downloadCertificate } from './certificate.js';

export function initCertificateCheck() {
  const getCertBtn = document.getElementById('nav-get-cert-btn');
  const certModal = document.getElementById('cert-modal');
  const closeModal = document.getElementById('cert-modal-close');
  const checkBtn = document.getElementById('btn-check-cert');
  const mobileInput = document.getElementById('cert-mobile');
  const statusMsg = document.getElementById('cert-status-msg');

  if (!getCertBtn || !certModal) return;

  // Open modal
  getCertBtn.addEventListener('click', (e) => {
    e.preventDefault();
    certModal.style.display = 'flex';
    mobileInput.value = '';
    statusMsg.innerHTML = '';
  });

  // Close modal
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      certModal.style.display = 'none';
    });
  }

  // Close on outside click
  certModal.addEventListener('click', (e) => {
    if (e.target === certModal || e.target.classList.contains('modal-backdrop')) {
      certModal.style.display = 'none';
    }
  });

  // Check and Download
  if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
      const mobile = mobileInput.value.trim();
      
      if (!/^\d{10}$/.test(mobile)) {
        statusMsg.innerHTML = '<span style="color: #ef4444;">Please enter a valid 10-digit mobile number.</span>';
        return;
      }

      checkBtn.disabled = true;
      checkBtn.innerHTML = '<div class="spinner-small" style="display:inline-block; margin-right:5px; border-top-color:#fff;"></div> Checking...';
      statusMsg.innerHTML = '';

      try {
        const donation = await checkDonationStatus(mobile);

        if (!donation) {
          statusMsg.innerHTML = '<span style="color: #ef4444;">No donation found with this mobile number. Ensure you submitted the donation form.</span>';
        } else if (donation.status === 'pending') {
          statusMsg.innerHTML = '<span style="color: #f59e0b;"><i data-lucide="clock"></i> Your payment is still pending verification by our team. Please check back later.</span>';
          if (window.lucide) window.lucide.createIcons({ nodes: [statusMsg] });
        } else if (donation.status === 'rejected') {
          statusMsg.innerHTML = '<span style="color: #ef4444;">Your donation was marked as rejected. Please contact support.</span>';
        } else if (donation.status === 'verified') {
          statusMsg.innerHTML = '<span style="color: #10b981;"><i data-lucide="check-circle"></i> Verification complete! Downloading certificate...</span>';
          if (window.lucide) window.lucide.createIcons({ nodes: [statusMsg] });
          
          // Trigger download
          await downloadCertificate(donation.donor_name, donation.amount);
          
          setTimeout(() => {
            certModal.style.display = 'none';
          }, 3000);
        }
      } catch (error) {
        statusMsg.innerHTML = '<span style="color: #ef4444;">An error occurred while checking status. Please try again.</span>';
      } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = 'Check & Download';
      }
    });
  }
}
