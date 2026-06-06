import type { DocumentType, PrismaClient } from "@prisma/client";

const prefixes: Record<DocumentType, string> = {
  QUOTATION: "QUO",
  DELIVERY_NOTE: "DN",
  RECEIPT: "REC",
  TAX_INVOICE: "TAX"
};

export async function nextDocumentNo(tx: PrismaClient, type: DocumentType) {
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const counter = await tx.documentCounter.upsert({
    where: { type_period: { type, period } },
    update: { sequence: { increment: 1 } },
    create: { type, period, sequence: 1 }
  });
  return `${prefixes[type]}-${period}-${String(counter.sequence).padStart(4, "0")}`;
}
