import fs from "fs/promises";

import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const canAccessFile = (user, file) => user.role !== "USER" || file.userId === user.id;

export const FilesService = {
  async saveUploadedFile(userId, file) {
    if (!file) {
      throw new ApiError(400, "File is required");
    }

    return prisma.uploadedFile.create({
      data: {
        userId,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
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

  async deleteFile(user, id) {
    const file = await this.getFile(user, id);

    await prisma.uploadedFile.delete({ where: { id } });

    try {
      await fs.unlink(file.storagePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    return { id, deleted: true };
  },
};
