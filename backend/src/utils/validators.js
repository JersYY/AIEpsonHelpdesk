import { ApiError } from "./apiError.js";

export const requireFields = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) {
    throw new ApiError(400, "Missing required fields", { missing });
  }
};

export const assertEnum = (value, allowed, fieldName) => {
  if (value !== undefined && value !== null && !allowed.includes(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`, { allowed });
  }
};

export const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};
