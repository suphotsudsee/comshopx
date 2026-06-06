export const adminUser = {
  name: "Suphot Sudsee",
  email: "suphotsudsee@gmail.com",
  role: "ADMIN / OWNER"
};

export const productCatalog = [
  {
    sku: "CPU-AMD-7800X3D",
    barcode: "8850001000011",
    name: "AMD Ryzen 7 7800X3D",
    category: "CPU",
    costPrice: 11900,
    price: 13900,
    stockQuantity: 4,
    reorderPoint: 3,
    requireSerial: true
  },
  {
    sku: "GPU-RTX4070S-12G",
    barcode: "8850001000028",
    name: "NVIDIA GeForce RTX 4070 SUPER 12GB",
    category: "GPU",
    costPrice: 21800,
    price: 24900,
    stockQuantity: 2,
    reorderPoint: 2,
    requireSerial: true
  },
  {
    sku: "RAM-DDR5-32G-6000",
    barcode: "8850001000035",
    name: "DDR5 32GB 6000MHz Kit",
    category: "RAM",
    costPrice: 3100,
    price: 3900,
    stockQuantity: 9,
    reorderPoint: 5,
    requireSerial: false
  },
  {
    sku: "SSD-NVME-2TB-PRO",
    barcode: "8850001000042",
    name: "NVMe SSD 2TB Pro",
    category: "Storage",
    costPrice: 4390,
    price: 5290,
    stockQuantity: 3,
    reorderPoint: 4,
    requireSerial: true
  },
  {
    sku: "MB-B650-PRO",
    barcode: "8850001000059",
    name: "B650 Pro Gaming Mainboard",
    category: "Mainboard",
    costPrice: 5200,
    price: 6290,
    stockQuantity: 5,
    reorderPoint: 3,
    requireSerial: true
  }
];

export const serialInventory = [
  {
    productName: "AMD Ryzen 7 7800X3D",
    sku: "CPU-AMD-7800X3D",
    serialNumber: "SN-CPU-7800X3D-240601",
    status: "IN_STOCK",
    warrantyEndAt: "2029-06-01"
  },
  {
    productName: "AMD Ryzen 7 7800X3D",
    sku: "CPU-AMD-7800X3D",
    serialNumber: "SN-CPU-7800X3D-240602",
    status: "SOLD",
    warrantyEndAt: "2029-06-02"
  },
  {
    productName: "NVIDIA GeForce RTX 4070 SUPER 12GB",
    sku: "GPU-RTX4070S-12G",
    serialNumber: "SN-GPU-4070S-240688",
    status: "RESERVED",
    warrantyEndAt: "2027-06-10"
  },
  {
    productName: "NVIDIA GeForce RTX 4070 SUPER 12GB",
    sku: "GPU-RTX4070S-12G",
    serialNumber: "SN-GPU-4070S-240702",
    status: "CLAIMED",
    warrantyEndAt: "2027-06-18"
  },
  {
    productName: "NVMe SSD 2TB Pro",
    sku: "SSD-NVME-2TB-PRO",
    serialNumber: "SN-SSD-2TB-240021",
    status: "IN_STOCK",
    warrantyEndAt: "2029-05-20"
  }
];

export const customerProfiles = [
  {
    name: "บริษัท สปีดคอม จำกัด",
    type: "COMPANY",
    phone: "02-118-9000",
    email: "accounting@speedcom.example",
    taxId: "0105568123456",
    address: "99/9 ถนนพหลโยธิน กรุงเทพฯ",
    purchasedSerials: ["SN-SSD-2TB-240021"]
  },
  {
    name: "คุณภาคิน วงศ์สวัสดิ์",
    type: "PERSON",
    phone: "089-456-7788",
    email: "pakin@example.com",
    taxId: "",
    address: "22 หมู่ 4 อุบลราชธานี",
    purchasedSerials: ["SN-CPU-7800X3D-240602"]
  },
  {
    name: "โรงเรียนเทคโนโลยีเมืองใหม่",
    type: "COMPANY",
    phone: "044-221-100",
    email: "it@school.example",
    taxId: "0994000123456",
    address: "188 ถนนหลักเมือง นครราชสีมา",
    purchasedSerials: []
  }
];

export const businessDocuments = [
  {
    documentNo: "QUO-202606-0001",
    type: "QUOTATION",
    customerName: "บริษัท สปีดคอม จำกัด",
    status: "ISSUED",
    reference: "-",
    expiresAt: "2026-06-20",
    totalAmount: 42800
  },
  {
    documentNo: "DN-202606-0001",
    type: "DELIVERY_NOTE",
    customerName: "โรงเรียนเทคโนโลยีเมืองใหม่",
    status: "ISSUED",
    reference: "QUO-202606-0002",
    expiresAt: "-",
    totalAmount: 98500
  },
  {
    documentNo: "REC-202606-0001",
    type: "RECEIPT",
    customerName: "คุณภาคิน วงศ์สวัสดิ์",
    status: "PAID",
    reference: "DN-202606-0001",
    expiresAt: "-",
    totalAmount: 72600
  },
  {
    documentNo: "TAX-202606-0001",
    type: "TAX_INVOICE",
    customerName: "บริษัท สปีดคอม จำกัด",
    status: "PAID",
    reference: "REC-202606-0001",
    expiresAt: "-",
    totalAmount: 42800
  }
];

export const auditLogs = [
  "08:05 Admin issued QUO-202606-0001",
  "08:14 Cashier converted quotation to delivery note",
  "08:20 Inventory reserved SN-GPU-4070S-240688",
  "08:31 Accounting exported TAX-202606-0001 PDF"
];

export const paymentMethods = ["Cash", "Transfer", "Credit Card", "Mixed"];

export const reportCards = [
  { label: "ยอดขายวันนี้", value: 72600, helper: "จากใบเสร็จ 1 ฉบับ" },
  { label: "ยอดขายเดือนนี้", value: 213700, helper: "รวม VAT แล้ว" },
  { label: "กำไรขั้นต้น", value: 31800, helper: "ประเมินจากราคาทุน" },
  { label: "เอกสารค้างชำระ", value: 42800, helper: "ใบเสนอราคา/ใบส่งของ" }
];
