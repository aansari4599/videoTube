import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return `Could not find the path ${localFilePath}`;
    // upload the file using localfilepath
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // added here as the code was running asynchronosly, the issue ws due to import syntax the apinkey ws not available at the time the config was getting set. config was getting loaded later on while uploading so decided to pass config at the time of uploading the file.
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // uploaded successfully
    fs.unlinkSync(localFilePath);
    console.log("file uploaded successfully...", response.url);
    return response;
  } catch (error) {
    //remove the locally saved temporary file as the upload operation  got failed
    fs.unlinkSync(localFilePath);
    console.log("==> ", process.env.CLOUDINARY_API_KEY);
    console.log("-->", error);
    return `file could not get uploaded...`;
  }
};
export { uploadOnCloudinary };
