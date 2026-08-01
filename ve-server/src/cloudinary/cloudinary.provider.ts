import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'pnqpt3mg',
      api_key: process.env.CLOUDINARY_API_KEY || '387864712354181',
      api_secret:
        process.env.CLOUDINARY_API_SECRET || 'BsUELQxzvLZLQx4bv5chRnbGvuE',
    });
  },
};
