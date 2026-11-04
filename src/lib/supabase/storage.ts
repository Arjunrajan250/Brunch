import { getSupabaseBrowserClient, isSupabaseConfigured } from './client';

export interface UploadResult {
  url: string | null;
  error: string | null;
}

export async function uploadMedia(file: File, folder: 'icons' | 'shots'): Promise<UploadResult> {
  // If Supabase is configured, upload to Supabase Storage bucket 'brunch-media'
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const ext = cleanName.split('.').pop() || 'png';
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('brunch-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Supabase storage upload error, falling back to base64:', uploadError.message);
        } else {
          const { data: publicData } = supabase.storage
            .from('brunch-media')
            .getPublicUrl(fileName);

          if (publicData?.publicUrl) {
            return { url: publicData.publicUrl, error: null };
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        console.warn('Storage upload exception, falling back to base64:', message);
      }
    }
  }

  // Fallback: Read as Base64 data URL for local offline testing
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result as string, error: null });
    };
    reader.onerror = () => {
      resolve({ url: null, error: 'Failed to read file locally' });
    };
    reader.readAsDataURL(file);
  });
}
