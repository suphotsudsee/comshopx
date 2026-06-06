"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createPosSaleAction(formData: FormData) {
  const user = await requireUser(["ADMIN", "OWNER", "CASHIER"]);
  const customerId = value(formData, "customerId") || null;
  const productIds = formData.getAll("productId").map(String).filter(Boolean);
  const paymentMethod = (value(formData, "paymentMethod") || "CASH") as PaymentMethod;
  if (!productIds.length) redirect("/admin/pos?error=empty-cart");

  await prisma.$transaction(async (tx) => {
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
  });
  revalidatePath("/admin/pos");
  revalidatePath("/admin/documents");
  revalidatePath("/admin/inventory");
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
