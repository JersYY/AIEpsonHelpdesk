import { prisma } from "../../config/prisma.js";

const mapCategoryCounts = async (limit = 6) => {
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
      id: category.id,
      name: category.name,
      description: category.description,
      count: 0,
    }));
  }

  const categories = await prisma.issueCategory.findMany({
    where: { id: { in: [...counts.keys()] } },
  });

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      count: counts.get(category.id) || 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
};

const getRecentActivity = async (userId, limit = 5) => {
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      category: true,
      _count: { select: { messages: true, escalationTickets: true } },
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    status: session.status,
    category: session.category,
    messageCount: session._count.messages,
    escalationCount: session._count.escalationTickets,
    updatedAt: session.updatedAt,
  }));
};

export const DashboardService = {
  async getUserDashboard(user) {
    const [popularIssues, recentActivity] = await Promise.all([
      mapCategoryCounts(6),
      getRecentActivity(user.id, 5),
    ]);

    return {
      user,
      quickActions: [
        { label: "Start Chat", action: "START_CHAT" },
        { label: "View FAQ", action: "VIEW_FAQ" },
        { label: "Report Issue", action: "REPORT_ISSUE" },
      ],
      popularIssues,
      recentActivity,
    };
  },

  getPopularIssues: mapCategoryCounts,
  getRecentActivity,
};
