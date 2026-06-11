import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { FilesService } from "./files.service.js";

export const uploadFile = asyncHandler(async (req, res) => {
  return sendSuccess(res, await FilesService.saveUploadedFile(req.user.id, req.file), 201);
});

export const getFile = asyncHandler(async (req, res) => {
  return sendSuccess(res, await FilesService.getFile(req.user, req.params.id));
});

export const serveUploadedFile = asyncHandler(async (req, res) => {
  const { file, buffer, contentType } = await FilesService.getFileByStoredName(req.params.storedName);

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.originalName)}"`);
  return res.send(buffer);
});

export const deleteFile = asyncHandler(async (req, res) => {
  return sendSuccess(res, await FilesService.deleteFile(req.user, req.params.id));
});
