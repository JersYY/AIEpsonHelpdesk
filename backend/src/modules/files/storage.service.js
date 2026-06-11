import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { createClient } from "@supabase/supabase-js";

import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";

const SUPABASE_PROTOCOL = "supabase://";

let supabaseClient = null;

export const localUploadDir = () => path.resolve(env.UPLOAD_DIR);

export const isSupabaseStorageConfigured = () =>
  Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET);

const getSupabaseClient = () => {
  if (!isSupabaseStorageConfigured()) {
    throw new ApiError(500, "Supabase storage is not configured");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
};

const extensionFromMimeType = (mimeType) => {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return "";
};

const mimeFromExtension = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
};

const uniqueStoredName = (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase() || extensionFromMimeType(file.mimetype);
  return `${Date.now()}-${randomUUID()}${ext}`;
};

const supabaseStoragePath = (bucket, objectPath) => `${SUPABASE_PROTOCOL}${bucket}/${objectPath}`;

const parseSupabaseStoragePath = (storagePath) => {
  if (!storagePath?.startsWith(SUPABASE_PROTOCOL)) return null;

  const withoutProtocol = storagePath.slice(SUPABASE_PROTOCOL.length);
  const slashIndex = withoutProtocol.indexOf("/");
  if (slashIndex < 1) {
    throw new ApiError(500, "Invalid Supabase storage path");
  }

  return {
    bucket: withoutProtocol.slice(0, slashIndex),
    objectPath: withoutProtocol.slice(slashIndex + 1),
  };
};

export const storeUploadedImage = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, "File is required");
  }

  if (!isSupabaseStorageConfigured()) {
    return {
      storedName: file.filename,
      storagePath: file.path,
    };
  }

  if (!file.buffer) {
    throw new ApiError(500, "Supabase uploads require memory storage");
  }

  const storedName = uniqueStoredName(file);
  const objectPath = `uploads/${userId}/${storedName}`;
  const { error } = await getSupabaseClient()
    .storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new ApiError(500, `Failed to upload file to Supabase Storage: ${error.message}`);
  }

  return {
    storedName,
    storagePath: supabaseStoragePath(env.SUPABASE_STORAGE_BUCKET, objectPath),
  };
};

export const readStoredFile = async (storagePath) => {
  const supabasePath = parseSupabaseStoragePath(storagePath);

  if (!supabasePath) {
    return {
      buffer: await fs.readFile(storagePath),
      contentType: mimeFromExtension(storagePath),
    };
  }

  const { data, error } = await getSupabaseClient()
    .storage
    .from(supabasePath.bucket)
    .download(supabasePath.objectPath);

  if (error) {
    throw new ApiError(404, `Failed to download file from Supabase Storage: ${error.message}`);
  }

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || mimeFromExtension(supabasePath.objectPath),
  };
};

export const deleteStoredFile = async (storagePath) => {
  const supabasePath = parseSupabaseStoragePath(storagePath);

  if (!supabasePath) {
    try {
      await fs.unlink(storagePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return;
  }

  const { error } = await getSupabaseClient()
    .storage
    .from(supabasePath.bucket)
    .remove([supabasePath.objectPath]);

  if (error) {
    throw new ApiError(500, `Failed to delete file from Supabase Storage: ${error.message}`);
  }
};
