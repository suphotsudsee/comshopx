"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { DocumentType, PaymentMethod, SerialStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "./security";
import { nextDocumentNo } from "./document-number";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function moneyValue(formData: FormData, key: string) {
  return Number(value(formData, key) || 0);
}

export async function loginAction(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/admin/login?error=invalid");
  }
  await createSession(user.id);
  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id }
  });
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function createCustomerAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "CASHIER", "ACCOUNTING"]);
  await prisma.customer.create({
    data: {
      name: value(formData, "name"),
      phone: value(formData, "phone") || null,
      email: value(formData, "email") || null,
      taxId: value(formData, "taxId") || null,
      address: value(formData, "address") || null
    }
  });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "CREATE", entity: "Customer", detail: value(formData, "name") }
  });
  revalidatePath("/admin/customers");
}

export async function createProductAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "INVENTORY"]);
  const categoryName = value(formData, "category") || "General";
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName }
  });
  await prisma.product.create({
    data: {
      sku: value(formData, "sku"),
      barcode: value(formData, "barcode") || null,
      name: value(formData, "name"),
      categoryId: category.id,
      costPrice: moneyValue(formData, "costPrice"),
      price: moneyValue(formData, "price"),
      stockQuantity: Number(value(formData, "stockQuantity") || 0),
      reorderPoint: Number(value(formData, "reorderPoint") || 0),
      requireSerial: formData.get("requireSerial") === "on"
    }
  });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "CREATE", entity: "Product", detail: value(formData, "sku") }
  });
  revalidatePath("/admin/inventory");
}

export async function receiveSerialAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "INVENTORY"]);
  const sku = value(formData, "sku");
  const product = await prisma.product.findUniqueOrThrow({ where: { sku } });
  const serialNumber = value(formData, "serialNumber");
  const warrantyEnd = value(formData, "warrantyEndAt");
  await prisma.$transaction(async (tx) => {
    const serial = await tx.serialNumber.create({
      data: {
        productId: product.id,
        serialNumber,
        warrantyStartAt: new Date(),
        warrantyEndAt: warrantyEnd ? new Date(warrantyEnd) : null,
        status: "IN_STOCK"
      }
    });
    await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: { increment: 1 } }
    });
    await tx.stockMovement.create({
      data: {
        productId: product.id,
        serialNumberId: serial.id,
        quantity: 1,
        movementType: "RECEIVE",
        note: "Receive serial into stock"
      }
    });
    await tx.auditLog.create({
      data: { userId: user.id, action: "RECEIVE", entity: "SerialNumber", entityId: serial.id, detail: serialNumber }
    });
  });
  revalidatePath("/admin/inventory");
}

export async function updateSerialStatusAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "INVENTORY"]);
  const id = value(formData, "id");
  const status = value(formData, "status") as SerialStatus;
  await prisma.serialNumber.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "UPDATE_STATUS", entity: "SerialNumber", entityId: id, detail: status }
  });
  revalidatePath("/admin/inventory");
}

export async function createDocumentAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "CASHIER", "ACCOUNTING"]);
  const type = value(formData, "type") as DocumentType;
  const customerId = value(formData, "customerId") || null;
  const productId = value(formData, "productId");
  const quantity = Number(value(formData, "quantity") || 1);
  const discount = moneyValue(formData, "discountAmount");
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const subtotal = Number(product.price) * quantity;
  const vat = Math.round((subtotal - discount) * 0.07 * 100) / 100;
  const total = subtotal - discount + vat;
  await prisma.$transaction(async (tx) => {
    const documentNo = await nextDocumentNo(tx as never, type);
    const document = await tx.document.create({
      data: {
        documentNo,
        type,
        customerId,
        subtotalAmount: subtotal,
        discountAmount: discount,
        vatAmount: vat,
        totalAmount: total,
        status: type === "RECEIPT" || type === "TAX_INVOICE" ? "PAID" : "ISSUED",
        issuedAt: new Date(),
        expiresAt: type === "QUOTATION" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
        note: value(formData, "note") || null,
        items: {
          create: {
            productId,
            quantity,
            unitPrice: product.price,
            discountAmount: discount,
            total
          }
        }
      }
    });
    await tx.auditLog.create({
      data: { userId: user.id, action: "CREATE", entity: "Document", entityId: document.id, detail: documentNo }
    });
  });
  revalidatePath("/admin/documents");
}

export async function convertDocumentAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "CASHIER", "ACCOUNTING"]);
  const sourceDocumentId = value(formData, "sourceDocumentId");
  const targetType = value(formData, "targetType") as DocumentType;
  const paymentMethod = (value(formData, "paymentMethod") || "CASH") as PaymentMethod;

  await prisma.$transaction(async (tx) => {
    const source = await tx.document.findUniqueOrThrow({
      where: { id: sourceDocumentId },
      include: { items: { include: { product: true, serialNumber: true } } }
    });
    if (source.status === "CANCELLED" || source.status === "VOID") {
      throw new Error("Cannot convert cancelled or void document");
    }
    const valid =
      (source.type === "QUOTATION" && targetType === "DELIVERY_NOTE") ||
      (source.type === "DELIVERY_NOTE" && targetType === "RECEIPT") ||
      (source.type === "RECEIPT" && targetType === "TAX_INVOICE");
    if (!valid) throw new Error(`Invalid conversion ${source.type} -> ${targetType}`);

    const documentNo = await nextDocumentNo(tx as never, targetType);
    const document = await tx.document.create({
      data: {
        documentNo,
        type: targetType,
        customerId: source.customerId,
        referenceDocumentId: source.id,
        subtotalAmount: source.subtotalAmount,
        discountAmount: source.discountAmount,
        vatAmount: source.vatAmount,
        totalAmount: source.totalAmount,
        status: targetType === "RECEIPT" || targetType === "TAX_INVOICE" ? "PAID" : "ISSUED",
        paymentMethod: targetType === "RECEIPT" ? paymentMethod : null,
        issuedAt: new Date(),
        note: `Converted from ${source.documentNo}`
      }
    });

    for (const item of source.items) {
      let serialNumberId = item.serialNumberId;
      const requestedSerial = value(formData, `serial_${item.id}`);
      if (item.product.requireSerial && targetType !== "TAX_INVOICE") {
        serialNumberId = requestedSerial || serialNumberId;
        if (!serialNumberId) throw new Error(`Serial Number required for ${item.product.sku}`);
        const serial = await tx.serialNumber.findUniqueOrThrow({ where: { id: serialNumberId } });
        if (serial.productId !== item.productId) throw new Error(`Serial does not match ${item.product.sku}`);
        const allowedStatus = targetType === "DELIVERY_NOTE" ? "IN_STOCK" : "RESERVED";
        if (serial.status !== allowedStatus && !(targetType === "RECEIPT" && serial.status === "IN_STOCK")) {
          throw new Error(`Serial Number ${serial.serialNumber} is not available`);
        }
      }

      await tx.documentItem.create({
        data: {
          documentId: document.id,
          productId: item.productId,
          serialNumberId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          total: item.total
        }
      });

      if (serialNumberId && targetType === "DELIVERY_NOTE") {
        await tx.serialNumber.update({ where: { id: serialNumberId }, data: { status: "RESERVED" } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            serialNumberId,
            documentId: document.id,
            quantity: 0,
            movementType: "RESERVE",
            note: documentNo
          }
        });
      }

      if (targetType === "RECEIPT") {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        if (serialNumberId) {
          await tx.serialNumber.update({ where: { id: serialNumberId }, data: { status: "SOLD" } });
        }
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            serialNumberId,
            documentId: document.id,
            quantity: -item.quantity,
            movementType: "SALE",
            note: documentNo
          }
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CONVERT",
        entity: "Document",
        entityId: document.id,
        detail: `${source.documentNo} -> ${documentNo}`
      }
    });
  });

  revalidatePath("/admin/documents");
  revalidatePath(`/admin/documents/${sourceDocumentId}`);
  revalidatePath("/admin/inventory");
}

export async function cancelDocumentAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "ACCOUNTING"]);
  const documentId = value(formData, "documentId");
  await prisma.$transaction(async (tx) => {
    const childCount = await tx.document.count({ where: { referenceDocumentId: documentId } });
    if (childCount > 0) throw new Error("Cannot cancel a document that has child documents");
    const document = await tx.document.update({
      where: { id: documentId },
      data: { status: "CANCELLED" }
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CANCEL",
        entity: "Document",
        entityId: document.id,
        detail: document.documentNo
      }
    });
  });
  revalidatePath("/admin/documents");
  revalidatePath(`/admin/documents/${documentId}`);
}

export async function createPosSaleAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "CASHIER"]);
  const customerId = value(formData, "customerId") || null;
  const productIds = formData.getAll("productId").map(String).filter(Boolean);
  const paymentMethod = (value(formData, "paymentMethod") || "CASH") as PaymentMethod;
  if (!productIds.length) redirect("/admin/pos?error=empty-cart");

  const saleResult = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: { serialNumbers: true }
    });
    let subtotal = 0;
    const items = [];
    for (const productId of productIds) {
      const product = products.find((item) => item.id === productId);
      if (!product) throw new Error("Product not found");
      if (product.stockQuantity < 1) throw new Error(`${product.sku} is out of stock`);
      const serialId = value(formData, `serial_${product.id}`);
      if (product.requireSerial) {
        if (!serialId) throw new Error(`Serial Number required for ${product.sku}`);
        const serial = await tx.serialNumber.findUniqueOrThrow({ where: { id: serialId } });
        if (serial.status !== "IN_STOCK" || serial.productId !== product.id) {
          throw new Error(`Serial Number ${serial.serialNumber} is not available`);
        }
      }
      subtotal += Number(product.price);
      items.push({ product, serialId: serialId || null });
    }
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    const total = subtotal + vat;
    const receiptNo = await nextDocumentNo(tx as never, "RECEIPT");
    const receipt = await tx.document.create({
      data: {
        documentNo: receiptNo,
        type: "RECEIPT",
        customerId,
        subtotalAmount: subtotal,
        vatAmount: vat,
        totalAmount: total,
        status: "PAID",
        paymentMethod,
        issuedAt: new Date()
      }
    });
    for (const item of items) {
      await tx.documentItem.create({
        data: {
          documentId: receipt.id,
          productId: item.product.id,
          serialNumberId: item.serialId,
          quantity: 1,
          unitPrice: item.product.price,
          total: item.product.price
        }
      });
      await tx.product.update({
        where: { id: item.product.id },
        data: { stockQuantity: { decrement: 1 } }
      });
      if (item.serialId) {
        await tx.serialNumber.update({ where: { id: item.serialId }, data: { status: "SOLD" } });
      }
      await tx.stockMovement.create({
        data: {
          productId: item.product.id,
          serialNumberId: item.serialId,
          documentId: receipt.id,
          quantity: -1,
          movementType: "SALE",
          note: receiptNo
        }
      });
    }
    await tx.auditLog.create({
      data: { userId: user.id, action: "POS_SALE", entity: "Document", entityId: receipt.id, detail: receiptNo }
    });
    return { documentId: receipt.id, error: "" };
  }).catch((error: Error) => ({
    documentId: "",
    error: error.message || "Unexpected POS error"
  }));
  if (saleResult.error) redirect(`/admin/pos?error=${encodeURIComponent(saleResult.error)}`);
  revalidatePath("/admin/pos");
  revalidatePath("/admin/documents");
  revalidatePath("/admin/inventory");
  redirect(`/admin/documents/${saleResult.documentId}`);
}

export async function createUserAction(formData: FormData) {
  await requireUser(["ADMIN", "OWNER"]);
  await prisma.user.create({
    data: {
      name: value(formData, "name"),
      email: value(formData, "email").toLowerCase(),
      passwordHash: hashPassword(value(formData, "password")),
      role: value(formData, "role") as never
    }
  });
  revalidatePath("/admin/settings");
}

export async function updateCompanySettingsAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER"]);
  const name = value(formData, "name");
  let logoUrl = value(formData, "logoUrl") || null;
  const logoFile = formData.get("logoFile");

  if (logoFile instanceof File && logoFile.size > 0) {
    if (!logoFile.type.startsWith("image/")) {
      throw new Error("Logo file must be an image");
    }
    if (logoFile.size > 2 * 1024 * 1024) {
      throw new Error("Logo file must be smaller than 2MB");
    }
    const extension = path.extname(logoFile.name).toLowerCase() || ".png";
    const safeExtension = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(extension)
      ? extension
      : ".png";
    const uploadDir = path.join(process.cwd(), "public", "uploads", "company");
    await mkdir(uploadDir, { recursive: true });
    const fileName = `logo-${Date.now()}${safeExtension}`;
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await logoFile.arrayBuffer()));
    logoUrl = `/uploads/company/${fileName}`;
  }

  await prisma.companySetting.upsert({
    where: { id: "default" },
    update: {
      name,
      logoUrl,
      taxId: value(formData, "taxId") || null,
      address: value(formData, "address") || null,
      phone: value(formData, "phone") || null,
      email: value(formData, "email") || null
    },
    create: {
      id: "default",
      name,
      logoUrl,
      taxId: value(formData, "taxId") || null,
      address: value(formData, "address") || null,
      phone: value(formData, "phone") || null,
      email: value(formData, "email") || null
    }
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "UPDATE",
      entity: "CompanySetting",
      entityId: "default",
      detail: name
    }
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/documents");
}
