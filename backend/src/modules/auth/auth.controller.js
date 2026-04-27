import { asyncHandler } from "../../utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // mock login dulu
  if (email !== "test@epson.com" || password !== "123456") {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid credentials" },
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: 1,
        email,
        role: "USER",
      },
      token: "mock-jwt-token",
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      email: "test@epson.com",
    },
  });
});
