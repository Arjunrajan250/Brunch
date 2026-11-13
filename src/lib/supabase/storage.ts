import { getSupabaseBrowserClient, isSupabaseConfigured } from './client';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

async function resizedImage(file: File, kind: 'icons' | 'shots'): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const maxWidth = kind === 'icons' ? 512 : 1280;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
    if (!blob) throw new Error('Could not process this image');
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
  } finally {
    bitmap.close();
  }
}

function localImage(file: File): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: String(reader.result), error: null });
    reader.onerror = () => resolve({ url: null, error: 'Failed to read the image on this device.' });
    reader.readAsDataURL(file);
  });
}

export async function uploadMedia(source: File, folder: 'icons' | 'shots'): Promise<UploadResult> {
  if (!MIME_TYPES.has(source.type)) return { url: null, error: 'Use a PNG, JPEG or WebP image.' };
  if (source.size > MAX_BYTES) return { url: null, error: 'Images must be 5 MB or smaller.' };
  if (source.size === 0) return { url: null, error: 'That image is empty.' };

  let file: File;
  try {
    file = await resizedImage(source, folder);
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : 'Could not read this image.' };
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { url: null, error: 'Cloud storage is unavailable.' };
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { url: null, error: 'Sign in before uploading images to cloud storage.' };
    const extension = file.type.split('/')[1] || 'webp';
    const fileName = `${authData.user.id}/${folder}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('brunch-media').upload(fileName, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    });
    // Do not silently put private/failed cloud uploads into a localStorage
    // snapshot: that both exceeds quota and hides the original failure.
    if (error) return { url: null, error: `Cloud upload failed: ${error.message}` };
    const { data } = supabase.storage.from('brunch-media').getPublicUrl(fileName);
    return data?.publicUrl ? { url: data.publicUrl, error: null } : { url: null, error: 'Cloud upload returned no URL.' };
  }

  return localImage(file);
}
