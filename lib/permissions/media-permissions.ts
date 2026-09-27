/**
 * Between Us — Media Permissions Helper
 * Safely queries and requests Media Device permissions in lib layer
 */

export async function requestMediaPermissions(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !navigator.mediaDevices) {
    return { success: false, error: 'MediaDevices API not supported' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach((track) => track.stop());
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, error: error.message || 'Permissions denied' };
  }
}
