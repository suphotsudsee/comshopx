import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

const categories = ["CPU", "GPU", "RAM", "Storage", "Mainboard"];

const products = [
  ["CPU-AMD-7800X3D", "8850001000011", "AMD Ryzen 7 7800X3D", "CPU", 11900, 13900, 4, 3, true],
  ["GPU-RTX4070S-12G", "8850001000028", "NVIDIA GeForce RTX 4070 SUPER 12GB", "GPU", 21800, 24900, 2, 2, true],
  ["RAM-DDR5-32G-6000", "8850001000035", "DDR5 32GB 6000MHz Kit", "RAM", 3100, 3900, 9, 5, false],
  ["SSD-NVME-2TB-PRO", "8850001000042", "NVMe SSD 2TB Pro", "Storage", 4390, 5290, 3, 4, true],
  ["MB-B650-PRO", "8850001000059", "B650 Pro Gaming Mainboard", "Mainboard", 5200, 6290, 5, 3, true]
];

const serials = [
  ["CPU-AMD-7800X3D", "SN-CPU-7800X3D-240601", "IN_STOCK"],
  ["CPU-AMD-7800X3D", "SN-CPU-7800X3D-240602", "IN_STOCK"],
  ["GPU-RTX4070S-12G", "SN-GPU-4070S-240688", "IN_STOCK"],
  ["GPU-RTX4070S-12G", "SN-GPU-4070S-240702", "CLAIMED"],
  ["SSD-NVME-2TB-PRO", "SN-SSD-2TB-240021", "IN_STOCK"]
];

const customers = [
  ["บริษัท สปีดคอม จำกัด", "0105568123456", "99/9 ถนนพหลโยธิน กรุงเทพฯ", "02-118-9000", "accounting@speedcom.example"],
  ["คุณภาคิน วงศ์สวัสดิ์", null, "22 หมู่ 4 อุบลราชธานี", "089-456-7788", "pakin@example.com"],
  ["โรงเรียนเทคโนโลยีเมืองใหม่", "0994000123456", "188 ถนนหลักเมือง นครราชสีมา", "044-221-100", "it@school.example"]
];

async function main() {
  await prisma.user.upsert({
    where: { email: "suphotsudsee@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Suphot Sudsee",
      email: "suphotsudsee@gmail.com",
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "admin1234"),
      role: "ADMIN"
    }
  });

  await prisma.companySetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "ComShopX",
      logoUrl: "",
      taxId: "0000000000000",
      address: "99/9 Computer Store Road, Thailand",
      phone: "02-000-0000",
      email: "admin@comshopx.local"
    }
  });

  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const [sku, barcode, name, categoryName, costPrice, price, stockQuantity, reorderPoint, requireSerial] of products) {
    const category = await prisma.category.findUniqueOrThrow({ where: { name: categoryName } });
    await prisma.product.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        barcode,
        name,
        categoryId: category.id,
        costPrice,
        price,
        stockQuantity,
        reorderPoint,
        requireSerial
      }
    });
  }

  for (const [sku, serialNumber, status] of serials) {
    const product = await prisma.product.findUniqueOrThrow({ where: { sku } });
    await prisma.serialNumber.upsert({
      where: { serialNumber },
      update: {},
      create: {
        productId: product.id,
        serialNumber,
        status,
        warrantyStartAt: new Date(),
        warrantyEndAt: new Date("2029-06-06")
      }
    });
  }

  for (const [name, taxId, address, phone, email] of customers) {
    const existing = await prisma.customer.findFirst({ where: { name } });
    if (!existing) {
      await prisma.customer.create({ data: { name, taxId, address, phone, email } });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
