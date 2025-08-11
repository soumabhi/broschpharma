import axios from "axios";
import { toast } from "react-toastify";

/**
 * Uploads a file to Cloudinary and returns the secure URL
 * @param {File} file - File object from input
 * @returns {Promise<string>} secure_url or throws error
 */
const uploadToCloudinary = async (file) => {
  if (!file) throw new Error("No file provided for upload");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await axios.post(import.meta.env.VITE_CLOUDINARY_UPLOAD_URL, formData);
    toast.success("Image uploaded successfully!");
    return response.data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    toast.error("Failed to upload image to Cloudinary");
    throw error;
  }
};

export default uploadToCloudinary;
