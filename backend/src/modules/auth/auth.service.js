import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { sanitizeUser } from "../users/user.service.js";

const signToken = (user) => {
  if (!env.JWT_SECRET) {
    throw new ApiError(500, "JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user.id,
      employeeId: user.employeeId,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

export const AuthService = {
  async login({
    employeeId,
    employeeID,
    employee_id: employeeIdSnake,
    idEmployee,
    email,
    username,
    password,
  } = {}) {
    const identifier = String(
      employeeId ?? employeeID ?? employeeIdSnake ?? idEmployee ?? email ?? username ?? "",
    ).trim();

    if (!identifier || !password) {
      throw new ApiError(400, "Employee ID and password are required");
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: { equals: identifier, mode: "insensitive" } },
          { email: { equals: identifier, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    return {
      user: sanitizeUser(user),
      token: signToken(user),
    };
  },

  me(user) {
    return user;
  },

  logout() {
    return { message: "Logged out successfully" };
  },
};
