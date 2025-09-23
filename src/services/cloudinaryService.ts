import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
});

// upload to cloudinary
export const uploadToCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) {
      return null;
    }

    //  upload to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //   delete from local after successful upload
    fs.unlinkSync(localFilePath);
    console.log("file upload successfully");
    return response;
  } catch (error) {
    console.log("file upload failed");
    // it remove the locally saved temporary file if the upload operation got failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

// extract the public id in case if we need to delete from the cloudinary
export const extractPublicId = async (url: string): Promise<string> => {
  try {
    console.log("url of image", url);
    if (!url || typeof url !== "string") {
      throw new Error("Url is missing or url is not a string");
    }

    // split the url
    const parts = url.split("/");
    console.log("parts of url", parts);
    // extract the last part
    const filename = parts[parts.length - 1]; // image-name.jpg
    console.log("filename", filename);
    if (!filename) {
      throw new Error("Filename is undefined. Can't extract public_id.");
    }
    // extract public id from filename (image-name is public id);
    const publicId = filename.split(".")[0]; // Remove extension
    return publicId;
  } catch (error) {
       throw new Error('failed to get the public id');
  }
};

// delete from cloudinary if already file present
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  try {
     const result = await cloudinary.uploader.destroy(publicId);
     return result;
  } catch (error) {
     console.log("cloudinary delete failed", error instanceof Error ? error.message : "Unknown error");
     throw error;
  }
};
