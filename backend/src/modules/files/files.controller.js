import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { FilesService } from "./files.service.js";

export const uploadFile = asyncHandler(async (req, res) => {
  return sendSuccess(res, await FilesService.saveUploadedFile(req.user.id, req.file), 201);
});

export const getFile = asyncHandler(async (req, res) => {
  return sendSuccess(res, await FilesService.getFile(req.user, req.params.id));
});

export const deleteFile = asyncHandler(async (req, res) => {
  return sendSuccess(res, await FilesService.deleteFile(req.user, req.params.id));
});
