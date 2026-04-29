import express from "express";

import { deleteFile, getFile, uploadFile } from "./files.controller.js";
import { uploadImage } from "./files.middleware.js";

const router = express.Router();

router.post("/upload", uploadImage.single("file"), uploadFile);
router.get("/:id", getFile);
router.delete("/:id", deleteFile);

export default router;
