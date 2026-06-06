import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/security";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const products = await prisma.product.findMany({
    include: { category: true, serialNumbers: true },
    orderBy: { sku: "asc" }
  });
  const rows = [
    ["SKU", "Name", "Category", "Stock", "Reorder Point", "Require Serial", "Cost Price", "Sale Price", "Serial Count"],
    ...products.map((product) => [
      product.sku,
      product.name,
      product.category.name,
      product.stockQuantity,
      product.reorderPoint,
      product.requireSerial,
      product.costPrice,
      product.price,
      product.serialNumbers.length
    ])
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=comshopx-inventory.csv"
    }
  });
}
