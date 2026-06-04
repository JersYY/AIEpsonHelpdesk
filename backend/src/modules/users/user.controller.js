import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { sendSuccess } from "../../utils/response.js";

const THEMES = ["light", "dark", "system"];
const CHAT_MODES = ["normal", "temporary"];

const toPreferences = (user) => ({
  theme: user.theme,
  defaultChatMode: user.defaultChatMode,
  compactSidebar: user.compactSidebar,
});

export const getPreferences = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, "User not found");
  return sendSuccess(res, toPreferences(user));
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { theme, defaultChatMode, compactSidebar } = req.body || {};

  if (theme !== undefined && !THEMES.includes(theme)) {
    throw new ApiError(400, "Invalid theme", { allowed: THEMES });
  }
  if (defaultChatMode !== undefined && !CHAT_MODES.includes(defaultChatMode)) {
    throw new ApiError(400, "Invalid defaultChatMode", { allowed: CHAT_MODES });
  }
  if (compactSidebar !== undefined && typeof compactSidebar !== "boolean") {
    throw new ApiError(400, "compactSidebar must be boolean");
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(theme !== undefined ? { theme } : {}),
      ...(defaultChatMode !== undefined ? { defaultChatMode } : {}),
      ...(compactSidebar !== undefined ? { compactSidebar } : {}),
    },
  });

  return sendSuccess(res, toPreferences(user));
});
