import fs from "fs";

import multer from "multer";

import { ApiError } from "../../utils/apiError.js";
import { isSupabaseStorageConfigured, localUploadDir } from "./storage.service.js";

const uploadDir = localUploadDir();
const useSupabaseStorage = isSupabaseStorageConfigured();

if (!useSupabaseStorage) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const storage = useSupabaseStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const ext = file.originalname.includes(".")
          ? `.${file.originalname.split(".").pop().toLowerCase()}`
          : "";
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
      },
    });

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new ApiError(400, "Only image/jpeg, image/png, and image/webp files are allowed"));
    }

    return cb(null, true);
  },
});
