import webpush from 'web-push';

// Cached VAPID keys in memory for development if env variables are not specified
let cachedVapidKeys: { publicKey: string; privateKey: string } | null = null;

export function getVapidKeys() {
  const envPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (envPublicKey && envPrivateKey) {
    return {
      publicKey: envPublicKey,
      privateKey: envPrivateKey,
      subject: process.env.VAPID_SUBJECT || 'mailto:support@betweenus.app',
    };
  }

  if (!cachedVapidKeys) {
    cachedVapidKeys = webpush.generateVAPIDKeys();
  }

  return {
    publicKey: cachedVapidKeys.publicKey,
    privateKey: cachedVapidKeys.privateKey,
    subject: process.env.VAPID_SUBJECT || 'mailto:support@betweenus.app',
  };
}

export function configureWebPush() {
  const keys = getVapidKeys();
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  return keys;
}
