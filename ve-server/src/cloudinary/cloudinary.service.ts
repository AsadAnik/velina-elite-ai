import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
  uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'velina-elite',
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Unknown upload error'));
          }
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      // URLs are typically: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<format>
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1]; // e.g., "abc123.jpg"
      const publicId = `velina-elite/${filename.split('.')[0]}`; // Reconstruct with folder

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`Failed to delete image from Cloudinary: ${imageUrl}`, error);
      // Don't throw - log and continue to allow product deletion even if Cloudinary delete fails
    }
  }

  async deleteMultipleFiles(imageUrls: string[]): Promise<void> {
    await Promise.all(imageUrls.map((url) => this.deleteFile(url)));
  }
}
