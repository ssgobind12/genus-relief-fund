/**
 * Certificate Module
 * Generates a beautiful thank-you certificate as a downloadable PNG.
 */

export async function generateCertificate(donorName, amount, date = new Date()) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // A4 Landscape dimensions (scaled for screen)
  canvas.width = 1123;
  canvas.height = 794;

  // ===== Background =====
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ===== Decorative Border =====
  // Outer border - blue
  ctx.strokeStyle = '#004B9B';
  ctx.lineWidth = 12;
  ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

  // Inner border - green
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

  // Corner decorations
  drawCornerDecoration(ctx, 15, 15, 1);
  drawCornerDecoration(ctx, canvas.width - 15, 15, 2);
  drawCornerDecoration(ctx, 15, canvas.height - 15, 3);
  drawCornerDecoration(ctx, canvas.width - 15, canvas.height - 15, 4);

  // ===== Header Text =====
  ctx.fillStyle = '#004B9B';
  ctx.font = 'bold 36px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Genus Power Infrastructure Limited', canvas.width / 2, 85);

  // Header Subtext
  ctx.fillStyle = '#555';
  ctx.font = '16px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sivsagar, Assam | Flood Relief Drive', canvas.width / 2, 115);

  // ===== Logo (Left Side) =====
  try {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Logo dimensions
        const logoWidth = 180;
        const logoHeight = (img.height / img.width) * logoWidth;
        const x = 60; // Padding from left
        const y = 45; // Align near top
        ctx.drawImage(img, x, y, logoWidth, logoHeight);
        resolve();
      };
      img.onerror = reject;
      img.src = './assets/logo.svg';
    });
  } catch (e) {
    console.error("Could not load logo for certificate", e);
  }

  // ===== Certificate Title =====
  ctx.fillStyle = '#2E7D32';
  ctx.font = 'bold 48px "Georgia", serif';
  ctx.fillText('Certificate of Appreciation', canvas.width / 2, 210);

  // Decorative line under title
  ctx.beginPath();
  ctx.moveTo(350, 225);
  ctx.lineTo(773, 225);
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ===== Presented to =====
  ctx.fillStyle = '#555555';
  ctx.font = '22px "Arial", sans-serif';
  ctx.fillText('This certificate is proudly presented to', canvas.width / 2, 280);

  // ===== Donor Name =====
  ctx.fillStyle = '#004B9B';
  ctx.font = 'italic bold 52px "Georgia", serif';
  ctx.fillText(donorName, canvas.width / 2, 350);

  // Line under name
  ctx.beginPath();
  ctx.moveTo(280, 370);
  ctx.lineTo(843, 370);
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ===== Recognition Message =====
  ctx.fillStyle = '#444444';
  ctx.font = '20px "Arial", sans-serif';
  ctx.fillText('in recognition of your generous contribution of', canvas.width / 2, 420);

  // ===== Amount =====
  ctx.fillStyle = '#2E7D32';
  ctx.font = 'bold 40px "Arial", sans-serif';
  ctx.fillText(`₹${amount.toLocaleString('en-IN')}`, canvas.width / 2, 475);

  // ===== Impact Message =====
  ctx.fillStyle = '#555555';
  ctx.font = 'italic 18px "Arial", sans-serif';
  ctx.fillText('Your generosity provides food, drinking water, medicines, clothes,', canvas.width / 2, 530);
  ctx.fillText('and essential relief to families affected by devastating floods in Assam.', canvas.width / 2, 555);

  // ===== Heart Symbol =====
  ctx.fillStyle = '#FF6B6B';
  ctx.font = '30px "Arial", sans-serif';
  ctx.fillText('❤', canvas.width / 2, 600);

  // ===== Date and Signature Area =====
  const dateString = date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Date (left)
  ctx.fillStyle = '#004B9B';
  ctx.font = '18px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dateString, 220, 680);
  ctx.beginPath();
  ctx.moveTo(120, 660);
  ctx.lineTo(320, 660);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '14px "Arial", sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('Date', 220, 700);

  // Signature (right)
  ctx.fillStyle = '#004B9B';
  ctx.font = 'italic 24px "Georgia", serif';
  ctx.fillText('Genus Relief Team', 903, 655);
  ctx.beginPath();
  ctx.moveTo(803, 660);
  ctx.lineTo(1003, 660);
  ctx.stroke();
  ctx.font = '14px "Arial", sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('Authorized Signatory', 903, 700);

  // ===== Footer Bar =====
  const footerGradient = ctx.createLinearGradient(0, canvas.height - 60, canvas.width, canvas.height - 60);
  footerGradient.addColorStop(0, '#2E7D32');
  footerGradient.addColorStop(1, '#1B5E20');
  ctx.fillStyle = footerGradient;
  ctx.fillRect(40, canvas.height - 60, canvas.width - 80, 20);

  // Footer text
  ctx.fillStyle = '#888';
  ctx.font = '12px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Together We Can Rebuild Lives | www.genus.in', canvas.width / 2, canvas.height - 25);

  return canvas;
}

function drawCornerDecoration(ctx, x, y, corner) {
  ctx.save();
  ctx.fillStyle = '#004B9B';
  const size = 8;

  switch (corner) {
    case 1: ctx.fillRect(x, y, size * 3, size); ctx.fillRect(x, y, size, size * 3); break;
    case 2: ctx.fillRect(x - size * 3, y, size * 3, size); ctx.fillRect(x - size, y, size, size * 3); break;
    case 3: ctx.fillRect(x, y - size, size * 3, size); ctx.fillRect(x, y - size * 3, size, size * 3); break;
    case 4: ctx.fillRect(x - size * 3, y - size, size * 3, size); ctx.fillRect(x - size, y - size * 3, size, size * 3); break;
  }

  ctx.restore();
}

export async function downloadCertificate(donorName, amount) {
  const canvas = await generateCertificate(donorName, amount);
  const dataUrl = canvas.toDataURL('image/png');

  const link = document.createElement('a');
  link.download = `Genus_Relief_Certificate_${donorName.replace(/\s+/g, '_')}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
