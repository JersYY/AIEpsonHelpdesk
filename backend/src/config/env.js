import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
