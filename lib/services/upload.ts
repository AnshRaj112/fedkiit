import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { getEnv } from "@/lib/env";
import { IMAGE_SIZES, type ImageFolder } from "@/lib/config/images";

/**
 * Cloudinary uploads — port of utils/image/uploadImage.js.
 *
 * The Express version wrote the multipart file to disk with multer first and
 * uploaded from a path. Route handlers receive a `File` directly, so the bytes
 * go straight to Cloudinary and nothing touches the filesystem — which also
 * means this works on a read-only serverless filesystem, where the original
 * `uploads/` directory approach would fail.
 */

let configured = false;

function configure(): boolean {
  if (configured) return true;

  const env = getEnv();
  if (!env.CLOUDINARY_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_SECRET_KEY) {
    return false;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_SECRET_KEY,
    secure: true,
  });
  configured = true;
  return true;
}

export type UploadResult = { secure_url: string; public_id: string } | null;

/**
 * Uploads a file to a Cloudinary folder, resized to the bounds that folder
 * declares in `lib/config/images.ts`.
 *
 * Dimensions are deliberately *not* parameters. They used to be, and the two
 * form routes passed the same pair in opposite orders — `addForm` uploading QR
 * media at 150x400 while `editForm` used 400x150. Looking them up from the
 * folder removes the argument entirely, so there is nothing left to get
 * backwards, and `ImageFolder` makes an unknown folder a compile error.
 *
 * Returns null when Cloudinary is not configured or the upload fails, matching
 * the original's tolerance for a missing image.
 */
export async function uploadImage(
  file: File,
  folder: ImageFolder,
): Promise<UploadResult> {
  const { width, height } = IMAGE_SIZES[folder];

  if (!configure()) {
    console.error("[upload] Cloudinary is not configured");
    return null;
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const transformation =
      width && height
        ? [{ width, height, crop: "limit" as const }]
        : undefined;

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, transformation, resource_type: "image" },
          (error, uploaded) => {
            if (error || !uploaded) return reject(error);
            resolve({
              secure_url: uploaded.secure_url,
              public_id: uploaded.public_id,
            });
          },
        );
        stream.end(buffer);
      },
    );

    return result;
  } catch (error) {
    console.error("[upload] failed", error);
    return null;
  }
}

/** Port of utils/image/deleteImage.js. */
export async function deleteImage(publicId: string): Promise<void> {
  if (!configure() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("[upload] delete failed", error);
  }
}
