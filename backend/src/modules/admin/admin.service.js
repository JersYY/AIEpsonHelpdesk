import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { toInt } from "../../utils/validators.js";
import { AiSettingsService } from "../ai/settings.service.js";

const ratio = (value, total) => (total ? Number((value / total).toFixed(4)) : 0);

const combineCategoryCounts = async (limit = 10) => {
  const [sessionGroups, ticketGroups] = await Promise.all([
    prisma.chatSession.groupBy({
      by: ["categoryId"],
      where: { categoryId: { not: null } },
      _count: { _all: true },
    }),
    prisma.escalationTicket.groupBy({
      by: ["categoryId"],
      where: { categoryId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const counts = new Map();
  for (const group of [...sessionGroups, ...ticketGroups]) {
    counts.set(group.categoryId, (counts.get(group.categoryId) || 0) + group._count._all);
  }

  if (!counts.size) {
    const categories = await prisma.issueCategory.findMany({
      orderBy: { name: "asc" },
      take: limit,
    });

    return categories.map((category) => ({
      categoryId: category.id,
      name: category.name,
      count: 0,
    }));
  }

  const categories = await prisma.issueCategory.findMany({
    where: { id: { in: [...counts.keys()] } },
  });

  return categories
    .map((category) => ({
      categoryId: category.id,
      name: category.name,
      count: counts.get(category.id) || 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
};

export const AdminService = {
  getAiSettings() {
    return AiSettingsService.getSettings({ force: true });
  },

  updateAiSettings(payload = {}) {
    return AiSettingsService.updateSettings(payload);
  },

  async getAccounts(query = {}) {
    const status = String(query.status || "PENDING").toUpperCase();
    const allowed = ["PENDING", "ACTIVE", "REJECTED", "ALL"];
    if (!allowed.includes(status)) {
      throw new ApiError(400, "Invalid account status", { allowed });
    }

    const where = {
      role: "USER",
      ...(status !== "ALL" ? { accountStatus: status } : {}),
    };

    return prisma.user.findMany({
      where,
      orderBy: [
        { accountStatus: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        department: true,
        approvedAt: true,
        rejectedAt: true,
        reviewNote: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateAccountStatus(id, payload = {}) {
    const status = String(payload.status || "").toUpperCase();
    if (!["ACTIVE", "REJECTED"].includes(status)) {
      throw new ApiError(400, "Status must be ACTIVE or REJECTED");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, "User not found");
    if (user.role !== "USER") {
      throw new ApiError(400, "Only operator accounts can be reviewed from this endpoint");
    }

    const reviewNote = payload.reviewNote !== undefined
      ? String(payload.reviewNote || "").trim() || null
      : user.reviewNote;

    return prisma.user.update({
      where: { id },
      data: {
        accountStatus: status,
        approvedAt: status === "ACTIVE" ? new Date() : null,
        rejectedAt: status === "REJECTED" ? new Date() : null,
        reviewNote,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        department: true,
        approvedAt: true,
        rejectedAt: true,
        reviewNote: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async getChatLogs(query = {}) {
    const page = Math.max(toInt(query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, employeeId: true, name: true, email: true, department: true } },
          category: true,
          _count: { select: { messages: true, escalationTickets: true } },
        },
      }),
      prisma.chatSession.count({ where }),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getChatLogById(id) {
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, employeeId: true, name: true, email: true, department: true } },
        category: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: { image: true },
        },
        escalationTickets: true,
      },
    });

    if (!session) throw new ApiError(404, "Chat log not found");
    return session;
  },

  async getAnalytics() {
    const [
      totalSessions,
      resolvedSessions,
      resolvedWithoutEscalation,
      avgResponseTime,
      totalQueries,
      totalEscalations,
    ] = await Promise.all([
      prisma.chatSession.count(),
      prisma.chatSession.count({ where: { status: "RESOLVED" } }),
      prisma.chatSession.count({
        where: {
          status: "RESOLVED",
          escalationTickets: { none: {} },
        },
      }),
      prisma.chatMessage.aggregate({
        where: { sender: "AI", responseTimeMs: { not: null } },
        _avg: { responseTimeMs: true },
      }),
      prisma.chatMessage.count({ where: { sender: "USER" } }),
      prisma.escalationTicket.count(),
    ]);

    return {
      deflectionRate: ratio(resolvedWithoutEscalation, totalSessions),
      avgResponseTime: Math.round(avgResponseTime._avg.responseTimeMs || 0),
      totalQueries,
      resolutionRate: ratio(resolvedSessions, totalSessions),
      totalEscalations,
      totalSessions,
    };
  },

  getTopIssues: combineCategoryCounts,
};
