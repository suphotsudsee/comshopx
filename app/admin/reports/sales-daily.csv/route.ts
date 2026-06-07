import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/security";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const documents = await prisma.document.findMany({
    where: { status: "PAID" },
    orderBy: { issuedAt: "desc" }
  });
  const sales = Array.from(
    documents.reduce((map, document) => {
      const date = document.issuedAt ?? document.createdAt;
      const key = dateKey(date);
      const row = map.get(key) ?? { period: key, count: 0, subtotal: 0, vat: 0, total: 0 };
      row.count += 1;
      row.subtotal += Number(document.subtotalAmount);
      row.vat += Number(document.vatAmount);
      row.total += Number(document.totalAmount);
      map.set(key, row);
      return map;
    }, new Map<string, { period: string; count: number; subtotal: number; vat: number; total: number }>())
  )
    .map(([, row]) => row)
    .sort((a, b) => b.period.localeCompare(a.period));
  const rows = [
    ["Date", "Document Count", "Subtotal", "VAT", "Total"],
    ...sales.map((row) => [row.period, row.count, row.subtotal, row.vat, row.total])
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=comshopx-sales-daily.csv"
    }
  });
}
