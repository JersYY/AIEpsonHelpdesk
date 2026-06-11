import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { deleteStoredFile, readStoredFile, storeUploadedImage } from "./storage.service.js";

const canAccessFile = (user, file) => user.role !== "USER" || file.userId === user.id;

export const FilesService = {
  async saveUploadedFile(userId, file) {
    if (!file) {
      throw new ApiError(400, "File is required");
    }

    const storedFile = await storeUploadedImage(userId, file);

    return prisma.uploadedFile.create({
      data: {
        userId,
        originalName: file.originalname,
        storedName: storedFile.storedName,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: storedFile.storagePath,
      },
    });
  },

  async getFile(user, id) {
    const file = await prisma.uploadedFile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, employeeId: true, name: true, email: true },
        },
      },
    });

    if (!file) throw new ApiError(404, "File not found");
    if (!canAccessFile(user, file)) {
      throw new ApiError(403, "You can only access your own files");
    }

    return file;
  },

  async getFileByStoredName(storedName) {
    const file = await prisma.uploadedFile.findUnique({
      where: { storedName },
    });

    if (!file) throw new ApiError(404, "File not found");

    const storedFile = await readStoredFile(file.storagePath);
    return {
      file,
      buffer: storedFile.buffer,
      contentType: file.mimeType || storedFile.contentType,
    };
  },

  async deleteFile(user, id) {
    const file = await this.getFile(user, id);

    await prisma.uploadedFile.delete({ where: { id } });
    await deleteStoredFile(file.storagePath);

    return { id, deleted: true };
  },
};
