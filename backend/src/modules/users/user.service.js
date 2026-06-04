export const sanitizeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    theme: user.theme,
    defaultChatMode: user.defaultChatMode,
    compactSidebar: user.compactSidebar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
