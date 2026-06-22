const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const IS_CONFIGURED = !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSIONS = { width: 1024, height: 1024 };

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed: JPEG, PNG, WebP, GIF";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large. Maximum size: 5MB";
  }
  return null;
}

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  if (!IS_CONFIGURED) return null;

  const validationError = validateImage(file);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "tictac_avatars");
  formData.append("public_id", `avatars/${userId}`);
  formData.append("folder", "tictac-arena/avatars");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  const result = await response.json();
  return result.secure_url;
}

export async function deleteAvatar(userId: string): Promise<void> {
  if (!IS_CONFIGURED) return;

  const timestamp = Math.round(Date.now() / 1000);
  const signature = await generateSignature(`public_id=avatars/${userId}&timestamp=${timestamp}`);

  const formData = new FormData();
  formData.append("public_id", `avatars/${userId}`);
  formData.append("api_key", CLOUDINARY_API_KEY!);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: "POST", body: formData },
  );
}

async function generateSignature(params: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(params + CLOUDINARY_API_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
