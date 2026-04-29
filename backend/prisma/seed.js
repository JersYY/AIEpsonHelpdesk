import bcrypt from "bcrypt";

import { prisma } from "../src/config/prisma.js";

const chunkContent = (content, maxLength = 900) => {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = "";

  for (const paragraph of paragraphs.length ? paragraphs : [content]) {
    if (`${buffer}\n\n${paragraph}`.trim().length > maxLength && buffer) {
      chunks.push(buffer.trim());
      buffer = paragraph;
    } else {
      buffer = `${buffer}\n\n${paragraph}`.trim();
    }
  }

  if (buffer) chunks.push(buffer.trim());
  return chunks;
};

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    {
      email: "admin@epson.local",
      employeeId: "ADM001",
      name: "Epson Admin",
      role: "ADMIN",
      department: "IT",
    },
    {
      email: "operator.assembly@epson.local",
      employeeId: "EMP001",
      name: "Assembly Operator",
      role: "USER",
      department: "Assembly",
    },
    {
      email: "helpdesk@epson.local",
      employeeId: "HD001",
      name: "Helpdesk Agent",
      role: "HELPDESK",
      department: "Helpdesk",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, passwordHash },
      create: { ...user, passwordHash },
    });
  }
};

const seedCategories = async () => {
  const categories = [
    ["Print Quality Issue", "Banding, missing dots, ink smear, faint output, or alignment defects."],
    ["Scanner Error", "ADF jam, calibration failure, scan line artifacts, or sensor issues."],
    ["Network Issue", "Printer discovery, IP conflict, Wi-Fi, Ethernet, or print server failures."],
    ["Hardware Problem", "Mechanical, sensor, motor, cover, or physical component problems."],
    ["Firmware Problem", "Firmware update, version mismatch, or device behavior after upgrade."],
    ["Part Problem", "Consumable, spare part, cable, tray, roller, or replacement part issues."],
  ];

  const result = {};
  for (const [name, description] of categories) {
    result[name] = await prisma.issueCategory.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
  }

  return result;
};

const upsertKnowledge = async ({ title, source, content, categoryId }) => {
  let document = await prisma.knowledgeDocument.findFirst({ where: { title } });

  if (document) {
    document = await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { title, source, content, categoryId },
    });
    await prisma.knowledgeChunk.deleteMany({ where: { documentId: document.id } });
  } else {
    document = await prisma.knowledgeDocument.create({
      data: { title, source, content, categoryId },
    });
  }

  await prisma.knowledgeChunk.createMany({
    data: chunkContent(content).map((chunkText, index) => ({
      documentId: document.id,
      chunkText,
      metadata: { chunkIndex: index, source: "seed" },
    })),
  });

  return document;
};

const seedKnowledge = async (categories) => {
  const documents = [
    {
      title: "Print Quality Banding Troubleshooting",
      source: "Internal SOP PQ-001",
      categoryId: categories["Print Quality Issue"].id,
      content:
        "When banding appears on Epson production print output, confirm the nozzle check result, ink supply status, platen cleanliness, and media alignment. Run head cleaning only after verifying the ink path and maintenance tank status. If the defect repeats after cleaning and alignment, capture sample output, printer serial number, ink lot, and environmental condition before escalation.",
    },
    {
      title: "Scanner ADF Jam Recovery",
      source: "Internal SOP SCN-014",
      categoryId: categories["Scanner Error"].id,
      content:
        "For scanner ADF jam or skew symptoms, stop the scan job, remove paper in the feed direction, inspect separation pad and pickup roller wear, clean dust from the paper path, and run a calibration scan. If the ADF sensor remains active after the paper path is clear, log the sensor state and escalate to helpdesk with an image of the feed area.",
    },
    {
      title: "Network Printer Discovery Checklist",
      source: "Internal SOP NET-022",
      categoryId: categories["Network Issue"].id,
      content:
        "If a printer cannot be discovered on the production network, confirm link light, assigned IP address, subnet, gateway, DNS, and print server queue status. Check for duplicate IP addresses and recent DHCP reservations. Restart network service only during approved production windows. Attach ping result and device network report when escalating.",
    },
  ];

  const created = [];
  for (const document of documents) {
    created.push(await upsertKnowledge(document));
  }

  return created;
};

const seedSuggestedQuestions = async (documents) => {
  const questions = [
    {
      question: "Why does the print output have banding lines?",
      category: "Print Quality Issue",
      documentId: documents[0].id,
    },
    {
      question: "What should I check before running head cleaning?",
      category: "Print Quality Issue",
      documentId: documents[0].id,
    },
    {
      question: "How do I recover from an ADF jam?",
      category: "Scanner Error",
      documentId: documents[1].id,
    },
    {
      question: "Why is the scanner still showing jam after paper removal?",
      category: "Scanner Error",
      documentId: documents[1].id,
    },
    {
      question: "What network details are needed before escalating printer discovery failure?",
      category: "Network Issue",
      documentId: documents[2].id,
    },
  ];

  for (const item of questions) {
    const existing = await prisma.suggestedQuestion.findFirst({
      where: { question: item.question },
    });

    if (existing) {
      await prisma.suggestedQuestion.update({
        where: { id: existing.id },
        data: item,
      });
    } else {
      await prisma.suggestedQuestion.create({ data: item });
    }
  }
};

const main = async () => {
  await seedUsers();
  const categories = await seedCategories();
  const documents = await seedKnowledge(categories);
  await seedSuggestedQuestions(documents);
};

main()
  .then(async () => {
    console.log("Seed completed");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
