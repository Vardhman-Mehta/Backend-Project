import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath){
            return null
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        // console.log('file uploaded successfully on cloudinary : ', response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export const deleteFromCloudinary = async (url) => {
    try {
        // https://res.cloudinary.com/<cloud_name>/image/upload/<public_id>.<extension>
        // Extract public ID from the URL
        const parts = url.split('/');
        const publicIdWithExtension = parts.slice(-1)[0]; // Get last part of the URL
        const publicId = publicIdWithExtension.split('.')[0]; // Remove file extension
        
        // Delete the file using the public ID
        const deleteResult = await cloudinary.uploader.destroy(publicId);

        console.log('File deleted successfully')

        return deleteResult;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        // throw error;
        return null;
    }
};


export default uploadOnCloudinary;