import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/security";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const documents = await prisma.document.findMany({
    include: { customer: true, referenceDocument: true },
    orderBy: { createdAt: "desc" }
  });
  const rows = [
    ["Document No", "Type", "Status", "Customer", "Reference", "Subtotal", "Discount", "VAT", "Total", "Issued At"],
    ...documents.map((document) => [
      document.documentNo,
      document.type,
      document.status,
      document.customer?.name ?? "Walk-in customer",
      document.referenceDocument?.documentNo ?? "",
      document.subtotalAmount,
      document.discountAmount,
      document.vatAmount,
      document.totalAmount,
      document.issuedAt?.toISOString() ?? ""
    ])
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=comshopx-documents.csv"
    }
  });
}
