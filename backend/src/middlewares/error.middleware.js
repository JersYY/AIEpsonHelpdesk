export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;
  const isProduction = process.env.NODE_ENV === "production";

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size must not exceed 5MB";
  }

  if (err.code === "P2002") {
    statusCode = 409;
    message = "Duplicate field value";
    details = err.meta || null;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: isProduction && statusCode >= 500 ? "Internal Server Error" : message,
      details,
    },
  });
};
