import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { CategoriesService } from "./categories.service.js";

export const listCategories = asyncHandler(async (req, res) => {
  return sendSuccess(res, await CategoriesService.list());
});

export const createCategory = asyncHandler(async (req, res) => {
  return sendSuccess(res, await CategoriesService.create(req.body), 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  return sendSuccess(res, await CategoriesService.update(req.params.id, req.body));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  return sendSuccess(res, await CategoriesService.remove(req.params.id));
});
