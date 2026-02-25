import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// ─── Configuration ──────────────────────────────────────────
// ⚠️  REPLACE THIS with your actual imgBB API key.
//     Get one free at: https://api.imgbb.com/
//     The free tier gives you 32 MB per upload, unlimited uploads.
const IMGBB_API_KEY = '8735d2bc4702ad7472ec8652f9b6901c';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const UPLOAD_TIMEOUT = 30_000; // 30 seconds — images can be large on slow networks

// Placeholder URL when upload fails — product cards/details will show this instead
const PLACEHOLDER_IMAGE = 'https://picsum.photos/400';

// ─── Types ──────────────────────────────────────────────────
interface ImgBBResponse {
  data: {
    id: string;
    url: string;
    display_url: string;
    delete_url: string;
    title: string;
    width: number;
    height: number;
    size: number;
    thumb: {
      url: string;
    };
    medium?: {
      url: string;
    };
  };
  success: boolean;
  status: number;
}

// ─── Single Image Upload ────────────────────────────────────
export async function uploadImageToImgBB(localUri: string): Promise<string> {
  try {
    // ── Step 1: Validate the URI ──────────────────────────────
    if (!localUri || !localUri.startsWith('file://')) {
      console.warn('[imgBB] Invalid URI, not a local file:', localUri);
      return PLACEHOLDER_IMAGE;
    }

    // ── Step 2: Check the API key ─────────────────────────────
    if (!IMGBB_API_KEY || IMGBB_API_KEY === '8735d2bc4702ad7472ec8652f9b6901c') {
      console.warn(
        '[imgBB] No API key configured! ' +
        'Get a free key at https://api.imgbb.com/ and set it in services/imgbbService.ts'
      );
      return localUri;
    }

    // ── Step 3: Read the file as base64 ───────────────────────
    // ⚠️  THE FIX: Use the string literal 'base64' instead of
    //     FileSystem.EncodingType.Base64.
    //
    //     In Expo SDK 54, the EncodingType enum is no longer exported
    //     as a static property on the namespace import. The enum object
    //     is undefined, so accessing .Base64 on it crashes.
    //
    //     The string literal 'base64' is the underlying value that the
    //     enum resolved to anyway — it works on ALL Expo SDK versions.
    console.log('[imgBB] Reading image as base64...');
    const base64Data = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',   // ← WAS: FileSystem.EncodingType.Base64
    });

    // ── Step 4: Build the form data ───────────────────────────
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);
    formData.append('name', `chainbazaar_${Date.now()}`);

    // ── Step 5: Upload to imgBB ───────────────────────────────
    console.log('[imgBB] Uploading image...');
    const response = await axios.post<ImgBBResponse>(
      IMGBB_UPLOAD_URL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: UPLOAD_TIMEOUT,
      }
    );

    // ── Step 6: Validate the response ─────────────────────────
    if (response.data.success && response.data.data?.url) {
      const imageUrl = response.data.data.display_url;
      console.log('[imgBB] Upload successful:', imageUrl);
      return imageUrl;
    }

    console.warn('[imgBB] Upload returned success=false:', response.data);
    return PLACEHOLDER_IMAGE;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const msg = error.response.data?.error?.message || 'Unknown error';

      if (status === 400) {
        console.error(`[imgBB] Bad request (400): ${msg}. Check your API key and image format.`);
      } else if (status === 401 || status === 403) {
        console.error(`[imgBB] Auth error (${status}): ${msg}. Your API key may be invalid.`);
      } else {
        console.error(`[imgBB] Server error (${status}): ${msg}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('[imgBB] Upload timed out. The image may be too large or the connection too slow.');
    } else {
      console.error('[imgBB] Network error:', error.message);
    }

    return PLACEHOLDER_IMAGE;
  }
}

// ─── Batch Upload ───────────────────────────────────────────
export async function uploadMultipleImages(
  localUris: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  if (localUris.length === 0) return [];

  let completed = 0;
  const total = localUris.length;

  const uploadPromises = localUris.map(async (uri) => {
    const result = await uploadImageToImgBB(uri);
    completed++;
    onProgress?.(completed, total);
    return result;
  });

  const results = await Promise.all(uploadPromises);
  return results;
}

// ─── Utility: Check if a URL is a local file ───────────────
export function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://');
}