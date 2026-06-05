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
      accountStatus: "ACTIVE",
      department: "IT",
    },
    {
      email: "helpdesk@epson.local",
      employeeId: "HD001",
      name: "Helpdesk Agent",
      role: "HELPDESK",
      accountStatus: "ACTIVE",
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
    ["Print Quality Issue", "Masalah hasil cetak seperti garis, missing dot, tinta meleber, warna pudar, atau alignment tidak presisi."],
    ["Scanner Error", "Masalah scanner seperti ADF macet, kalibrasi gagal, garis pada hasil scan, atau gangguan sensor."],
    ["Network Issue", "Masalah koneksi seperti printer tidak terdeteksi, konflik IP, Wi-Fi, Ethernet, atau gangguan print server."],
    ["Hardware Problem", "Masalah mekanik atau fisik seperti sensor, motor, cover, jalur kertas, atau komponen perangkat."],
    ["Firmware Problem", "Masalah firmware seperti proses update, versi tidak sesuai, atau perubahan perilaku perangkat setelah upgrade."],
    ["Part Problem", "Masalah consumable atau spare part seperti kabel, tray, roller, cartridge, tinta, atau part pengganti."],
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
        "Jika hasil cetak Epson terlihat bergaris atau warna tidak rata, lakukan nozzle check terlebih dahulu dan simpan hasilnya. Periksa status tinta, kebersihan platen, posisi media, serta alignment head sebelum menjalankan head cleaning. Head cleaning hanya dilakukan setelah jalur tinta dan maintenance tank dipastikan normal. Jika defect tetap muncul setelah cleaning dan alignment, lampirkan sample output, serial number printer, lot tinta, serta kondisi lingkungan sebelum eskalasi ke helpdesk.",
    },
    {
      title: "Scanner ADF Jam Recovery",
      source: "Internal SOP SCN-014",
      categoryId: categories["Scanner Error"].id,
      content:
        "Untuk gejala ADF macet, kertas miring, atau hasil scan tidak masuk sempurna, hentikan pekerjaan scan terlebih dahulu. Keluarkan kertas mengikuti arah feed, lalu periksa kondisi separation pad, pickup roller, dan jalur kertas. Bersihkan debu pada paper path dan jalankan calibration scan. Jika sensor ADF masih aktif walaupun jalur sudah kosong, catat status sensor dan eskalasikan ke helpdesk dengan foto area feed.",
    },
    {
      title: "Network Printer Discovery Checklist",
      source: "Internal SOP NET-022",
      categoryId: categories["Network Issue"].id,
      content:
        "Jika printer tidak terdeteksi di jaringan produksi, pastikan lampu link menyala dan alamat IP sudah benar. Verifikasi subnet, gateway, DNS, serta status queue pada print server. Cek kemungkinan duplicate IP dan perubahan DHCP reservation terbaru. Restart network service hanya dilakukan pada window produksi yang disetujui. Saat eskalasi, lampirkan hasil ping dan network report dari perangkat.",
    },
  ];

  const created = [];
  for (const document of documents) {
    created.push(await upsertKnowledge(document));
  }

  return created;
};

const main = async () => {
  await seedUsers();
  const categories = await seedCategories();
  await seedKnowledge(categories);
};

main()
  .then(async () => {
    console.log("Seed completed: admin/helpdesk accounts, categories, and knowledge base");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
