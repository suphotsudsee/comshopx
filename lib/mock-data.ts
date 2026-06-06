export const products = [
  {
    sku: "CPU-AMD-7800X3D",
    name: "AMD Ryzen 7 7800X3D",
    category: "CPU",
    price: 13900,
    stockQuantity: 4,
    reorderPoint: 3,
    requireSerial: true
  },
  {
    sku: "GPU-RTX4070S-12G",
    name: "NVIDIA GeForce RTX 4070 SUPER 12GB",
    category: "GPU",
    price: 24900,
    stockQuantity: 2,
    reorderPoint: 2,
    requireSerial: true
  },
  {
    sku: "RAM-DDR5-32G-6000",
    name: "DDR5 32GB 6000MHz Kit",
    category: "RAM",
    price: 3900,
    stockQuantity: 9,
    reorderPoint: 5,
    requireSerial: false
  },
  {
    sku: "SSD-NVME-2TB-PRO",
    name: "NVMe SSD 2TB Pro",
    category: "Storage",
    price: 5290,
    stockQuantity: 3,
    reorderPoint: 4,
    requireSerial: true
  }
];

export const lowStockProducts = products.filter((product) => product.stockQuantity <= product.reorderPoint);

export const serialNumbers = [
  {
    productName: "AMD Ryzen 7 7800X3D",
    serialNumber: "SN-CPU-7800X3D-240601",
    status: "IN_STOCK"
  },
  {
    productName: "NVIDIA GeForce RTX 4070 SUPER 12GB",
    serialNumber: "SN-GPU-4070S-240688",
    status: "RESERVED"
  },
  {
    productName: "NVMe SSD 2TB Pro",
    serialNumber: "SN-SSD-2TB-240021",
    status: "SOLD"
  },
  {
    productName: "NVIDIA GeForce RTX 4070 SUPER 12GB",
    serialNumber: "SN-GPU-4070S-240702",
    status: "CLAIMED"
  }
];

export const customers = [
  {
    name: "บริษัท สปีดคอม จำกัด",
    phone: "02-118-9000",
    taxId: "0105568123456"
  },
  {
    name: "คุณภาคิน วงศ์สวัสดิ์",
    phone: "089-456-7788",
    taxId: ""
  },
  {
    name: "โรงเรียนเทคโนโลยีเมืองใหม่",
    phone: "044-221-100",
    taxId: "0994000123456"
  },
  {
    name: "คุณนิชา แสงทอง",
    phone: "081-882-4490",
    taxId: ""
  }
];

export const documents = [
  {
    documentNo: "QUO-202606-0001",
    type: "QUOTATION",
    customerName: "บริษัท สปีดคอม จำกัด",
    status: "ISSUED",
    totalAmount: 42800
  },
  {
    documentNo: "DN-202606-0001",
    type: "DELIVERY_NOTE",
    customerName: "โรงเรียนเทคโนโลยีเมืองใหม่",
    status: "ISSUED",
    totalAmount: 98500
  },
  {
    documentNo: "REC-202606-0001",
    type: "RECEIPT",
    customerName: "คุณภาคิน วงศ์สวัสดิ์",
    status: "PAID",
    totalAmount: 72600
  }
];
