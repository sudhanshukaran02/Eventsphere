import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET &&
  process.env.USE_MOCK_CLOUDINARY !== 'true';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary service initialized successfully.');
} else {
  console.log('Cloudinary credentials missing or USE_MOCK_CLOUDINARY is true. Falling back to local file uploads.');
}

/**
 * Uploads a file buffer or path. If Cloudinary is not configured, returns a local asset URL.
 * @param {string} localFilePath - Path to temporary file
 * @returns {Promise<string>} URL of the uploaded image
 */
export const uploadImage = async (localFilePath) => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: 'eventsphere',
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw new Error('Image upload failed');
    }
  } else {
    // If local, return the relative static path (which will be served by express static middleware)
    // The caller is expected to move/rename the file if they want, but multer diskStorage already saves it.
    // We just return the filename part for frontend to query `/uploads/filename`
    const filename = localFilePath.replace(/\\/g, '/').split('/').pop();
    return `/uploads/${filename}`;
  }
};

export default cloudinary;
