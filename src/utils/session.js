// WhatsApp credentials must remain inside their owner's private session directory.
// Legacy base64 session export/import is intentionally disabled because it exposes account keys.
export function encodeSession() {
  throw new Error('Session export is disabled. Keep credentials in the private auth directory.');
}
export function decodeSession() { return null; }
export function restoreSession() { return false; }
export function captureSessionId() { return ''; }
export async function sendSessionIdToOwner() {
  throw new Error('Sending WhatsApp credentials is disabled for security.');
}
