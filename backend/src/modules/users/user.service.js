export const sanitizeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
