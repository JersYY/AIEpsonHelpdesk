import { ApiError } from "../utils/apiError.js";

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to access this resource", { roles });
    }

    next();
  };
};
