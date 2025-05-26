import { cloudinary } from "../helpers/helper.js";

// Add interfaces for clarity
interface UploadedFile {
  tempFilePath: string;
}

interface UploadResult {
  url: string;
  public_id: string;
}

// Accept optional transformations
interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string;
  fetch_format?: string;
}

export const uploadImage = async (
  file: UploadedFile | null,
  transformationOptions: TransformationOptions = {}
): Promise<UploadResult | null> => {
  if (!file) return null;
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      upload_preset: process.env.UPLOAD_FOLDER,
      format: "webp",
    });

    // Merge defaults with user-provided transformation options
    const optimizedUrl = cloudinary.url(result.public_id, {
      transformation: [
        {
          width: transformationOptions.width ?? 900,
          height: transformationOptions.height ?? 900,
          crop: transformationOptions.crop ?? "fill",
          gravity: transformationOptions.gravity ?? "auto",
          quality: transformationOptions.quality ?? "auto",
          fetch_format: transformationOptions.fetch_format ?? "auto",
        },
      ],
    });

    return {
      url: optimizedUrl,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary image deleted:", publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};