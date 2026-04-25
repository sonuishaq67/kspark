/**
 * Play base64-encoded MP3 audio in the browser.
 * Returns a promise that resolves when playback finishes.
 */
export function playBase64Audio(b64: string): Promise<void> {
  return new Promise((resolve) => {
    if (!b64) {
      resolve();
      return;
    }
    try {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}
