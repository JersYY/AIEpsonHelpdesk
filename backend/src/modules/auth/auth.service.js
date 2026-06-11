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
      accountStatus: user.accountStatus,
    },
    env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

export const AuthService = {
  async register({
    employeeId,
    employeeID,
    employee_id: employeeIdSnake,
    idEmployee,
    name,
    email,
    department,
    password,
  } = {}) {
    const cleanEmployeeId = String(
      employeeId ?? employeeID ?? employeeIdSnake ?? idEmployee ?? "",
    ).trim();
    const cleanName = String(name ?? "").replace(/\s+/g, " ").trim();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanDepartment = String(department ?? "").replace(/\s+/g, " ").trim();
    const cleanPassword = String(password ?? "");

    if (!cleanEmployeeId || !cleanName || !cleanEmail || !cleanPassword) {
      throw new ApiError(400, "Employee ID, name, email, and password are required");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new ApiError(400, "Invalid email format");
    }
    if (cleanPassword.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: { equals: cleanEmployeeId, mode: "insensitive" } },
          { email: { equals: cleanEmail, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      throw new ApiError(409, "Employee ID or email already registered");
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const user = await prisma.user.create({
      data: {
        employeeId: cleanEmployeeId,
        name: cleanName,
        email: cleanEmail,
        department: cleanDepartment || null,
        passwordHash,
        role: "USER",
        accountStatus: "PENDING",
      },
    });

    return {
      user: sanitizeUser(user),
      token: signToken(user),
    };
  },

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

  async changePassword(user, { currentPassword, newPassword, confirmPassword } = {}) {
    const cleanCurrentPassword = String(currentPassword ?? "");
    const cleanNewPassword = String(newPassword ?? "");
    const cleanConfirmPassword = String(confirmPassword ?? "");

    if (!cleanCurrentPassword || !cleanNewPassword || !cleanConfirmPassword) {
      throw new ApiError(400, "Current password, new password, and confirmation are required");
    }
    if (cleanNewPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters");
    }
    if (cleanNewPassword !== cleanConfirmPassword) {
      throw new ApiError(400, "New password confirmation does not match");
    }

    const account = await prisma.user.findUnique({ where: { id: user.id } });
    if (!account) {
      throw new ApiError(404, "User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(cleanCurrentPassword, account.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, "Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(cleanNewPassword, 10);
    await prisma.user.update({
      where: { id: account.id },
      data: { passwordHash },
    });

    return { message: "Password updated successfully" };
  },

  logout() {
    return { message: "Logged out successfully" };
  },
};
