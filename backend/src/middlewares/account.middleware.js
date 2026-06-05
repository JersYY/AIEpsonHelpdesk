import { ApiError } from "../utils/apiError.js";

export const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication token is required");
  }

  if (req.user.accountStatus !== "ACTIVE") {
    throw new ApiError(403, "Account is waiting for admin approval", {
      accountStatus: req.user.accountStatus,
    });
  }

  next();
};
