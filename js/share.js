export function initShare() {
  const shareButtons = document.querySelectorAll('.share-btn');
  
  shareButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const platform = e.currentTarget.dataset.platform;
      const name = e.currentTarget.dataset.name || 'someone';
      const amount = e.currentTarget.dataset.amount || '';
      
      switch(platform) {
        case 'whatsapp':
          shareOnWhatsApp(name, amount);
          break;
        case 'twitter':
          shareOnTwitter(name, amount);
          break;
        case 'facebook':
          shareOnFacebook();
          break;
        case 'linkedin':
          shareOnLinkedIn();
          break;
        case 'copy':
          copyLink();
          break;
        case 'native':
          nativeShare(name, amount);
          break;
      }
    });
  });
}

function getShareText(amount = '') {
  const amountText = amount ? `₹${Number(amount).toLocaleString('en-IN')} ` : '';
  return `I just donated ${amountText}to the Genus Flood Relief Drive! Every contribution helps rebuild lives. Join me in making a difference. 🙏❤️ #FloodRelief #GenusRelief`;
}

export function shareOnWhatsApp(name, amount) {
  const text = encodeURIComponent(getShareText(amount) + ' ' + window.location.href);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

export function shareOnTwitter(name, amount) {
  const text = encodeURIComponent(getShareText(amount));
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

export function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

export function shareOnLinkedIn() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

export function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('Link copied to clipboard!');
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
}

export function nativeShare(name, amount) {
  if (navigator.share) {
    navigator.share({
      title: 'Genus Flood Relief Drive',
      text: getShareText(amount),
      url: window.location.href,
    }).catch(console.error);
  } else {
    copyLink();
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // Ensure basic styling for toast if not in CSS
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    zIndex: '10000',
    transition: 'opacity 0.3s'
  });

  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
