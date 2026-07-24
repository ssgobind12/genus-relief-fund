const QRCode = require('qrcode');
const fs = require('fs');

const upiString = 'upi://pay?pa=8402050163@ptsbi&pn=Amlan%20Kashyap&cu=INR';

QRCode.toBuffer(upiString, {
  errorCorrectionLevel: 'H',
  type: 'png',
  margin: 2,
  width: 600,
  color: {
    dark: '#000000',
    light: '#ffffff'
  }
}, function (err, buffer) {
  if (err) throw err;
  fs.writeFileSync('public/qr-data-2.bin', buffer);
  console.log('Successfully generated public/qr-data-2.bin');
});
