import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { requireFields } from "../../utils/validators.js";

const includeCounts = {
  _count: {
    select: {
      chatSessions: true,
      knowledgeDocuments: true,
      escalationTickets: true,
    },
  },
};

const cleanName = (name) => String(name || "").replace(/\s+/g, " ").trim();
const cleanDescription = (description) => {
  if (description === undefined) return undefined;
  const value = String(description || "").trim();
  return value || null;
};

const candidateUsageCount = async (categoryId) => prisma.knowledgeCandidate.count({
  where: { categoryId },
});

const duplicateNameWhere = (name, excludeId = null) => ({
  name: { equals: name, mode: "insensitive" },
  ...(excludeId ? { NOT: { id: excludeId } } : {}),
});

export const CategoriesService = {
  async list() {
    const categories = await prisma.issueCategory.findMany({
      orderBy: { name: "asc" },
      include: includeCounts,
    });

    const candidateCounts = await prisma.knowledgeCandidate.groupBy({
      by: ["categoryId"],
      where: { categoryId: { not: null } },
      _count: { _all: true },
    });
    const candidateMap = new Map(candidateCounts.map((item) => [item.categoryId, item._count._all]));

    return categories.map((category) => ({
      ...category,
      usage: {
        chatSessions: category._count.chatSessions,
        knowledgeDocuments: category._count.knowledgeDocuments,
        escalationTickets: category._count.escalationTickets,
        knowledgeCandidates: candidateMap.get(category.id) || 0,
      },
    }));
  },

  async create(payload) {
    requireFields(payload, ["name"]);
    const name = cleanName(payload.name);
    if (!name) throw new ApiError(400, "Category name is required");

    const existing = await prisma.issueCategory.findFirst({
      where: duplicateNameWhere(name),
    });
    if (existing) throw new ApiError(409, "Category name already exists");

    return prisma.issueCategory.create({
      data: {
        name,
        description: cleanDescription(payload.description) ?? null,
      },
      include: includeCounts,
    });
  },

  async update(id, payload) {
    const current = await prisma.issueCategory.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "Category not found");

    const data = {};
    if (payload.name !== undefined) {
      const name = cleanName(payload.name);
      if (!name) throw new ApiError(400, "Category name is required");
      const existing = await prisma.issueCategory.findFirst({
        where: duplicateNameWhere(name, id),
      });
      if (existing) throw new ApiError(409, "Category name already exists");
      data.name = name;
    }

    if (payload.description !== undefined) {
      data.description = cleanDescription(payload.description);
    }

    return prisma.issueCategory.update({
      where: { id },
      data,
      include: includeCounts,
    });
  },

  async remove(id) {
    const category = await prisma.issueCategory.findUnique({
      where: { id },
      include: includeCounts,
    });
    if (!category) throw new ApiError(404, "Category not found");

    const usage = {
      chatSessions: category._count.chatSessions,
      knowledgeDocuments: category._count.knowledgeDocuments,
      escalationTickets: category._count.escalationTickets,
      knowledgeCandidates: await candidateUsageCount(id),
    };
    const totalUsage = Object.values(usage).reduce((sum, count) => sum + count, 0);
    if (totalUsage) {
      throw new ApiError(409, "Category is still used", usage);
    }

    await prisma.issueCategory.delete({ where: { id } });
    return { id, deleted: true };
  },
};

export default CategoriesService;
