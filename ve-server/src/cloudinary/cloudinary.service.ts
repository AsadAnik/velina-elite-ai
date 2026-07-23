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
}
