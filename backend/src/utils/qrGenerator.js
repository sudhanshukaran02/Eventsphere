import QRCode from 'qrcode';

/**
 * Generates a Base64 QR Code string from verification details
 * @param {object} bookingDetails - details to encode
 * @returns {Promise<string>} Base64 Data URL
 */
export const generateTicketQR = async (bookingDetails) => {
  try {
    const textToEncode = JSON.stringify({
      bookingId: bookingDetails.bookingId,
      attendeeName: bookingDetails.attendeeName,
      eventName: bookingDetails.eventName,
      ticketQuantity: bookingDetails.ticketQuantity,
      bookingDate: bookingDetails.bookingDate,
      verificationKey: `ES-${bookingDetails.bookingId.toString().substring(0, 8).toUpperCase()}`,
    });
    
    // Generate QR code data URL (image format base64)
    const qrCodeDataUrl = await QRCode.toDataURL(textToEncode, {
      color: {
        dark: '#1e293b',  // Slate-800
        light: '#ffffff', // White background
      },
      width: 300,
      margin: 2,
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR Code ticket');
  }
};
