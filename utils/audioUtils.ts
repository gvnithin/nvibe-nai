
import type { Blob } from '@google/genai';

/**
 * Encodes an array of bytes into a base64 string.
 * @param {Uint8Array} bytes The bytes to encode.
 * @returns {string} The base64 encoded string.
 */
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Creates a Gemini Blob object from raw audio data.
 * @param {Float32Array} data The raw PCM audio data from the microphone.
 * @returns {Blob} A Gemini Blob object ready to be sent to the API.
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  // Convert Float32 to Int16
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    // The required audio MIME type for the Live API.
    mimeType: 'audio/pcm;rate=16000',
  };
}
