// Ouvre le checkout CinetPay (Visa/Mastercard + Mobile Money) dans une fenêtre
// popup centrée, et résout quand la fenêtre se ferme (succès ou abandon).

export function openPaymentPopup(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const width = 480;
    const height = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      url,
      'elengi_payment',
      `width=${width},height=${height},left=${left},top=${top},noopener=no`,
    );

    if (!popup) {
      reject(new Error('Autorisez les fenêtres popup pour procéder au paiement.'));
      return;
    }

    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        resolve();
      }
    }, 800);
  });
}
