import { cloudinary } from "../helpers/helper.js";
export const uploadImage = async (file, transformationOptions = {}) => {
    if (!file)
        return null;
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
    }
    catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
export const deleteImage = async (publicId) => {
    if (!publicId)
        return;
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log("Cloudinary image deleted:", publicId);
    }
    catch (error) {
        console.error("Cloudinary delete error:", error);
    }
};
//# sourceMappingURL=imageUploader.js.map