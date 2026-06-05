import express from "express";

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "./categories.controller.js";

const router = express.Router();

router.get("/", listCategories);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
