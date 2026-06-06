import { Download } from "lucide-react";
import Link from "next/link";
import { AdminShell, Stat, StatusBadge } from "../components";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default async function ReportsPage() {
  await requireUser(["ADMIN", "OWNER", "ACCOUNTING", "INVENTORY"]);
  const [products, serialInventory, paidDocuments, pendingDocuments] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.serialNumber.findMany({ include: { product: true }, orderBy: { updatedAt: "desc" } }),
    prisma.document.findMany({ where: { status: "PAID" } }),
    prisma.document.findMany({ where: { status: { in: ["DRAFT", "ISSUED"] } } })
  ]);
  const revenue = paidDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const pending = pendingDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const grossProfit = products.reduce(
    (sum, product) => sum + (Number(product.price) - Number(product.costPrice)) * product.stockQuantity,
    0
  );

  return (
    <AdminShell title="Reports" subtitle="ยอดขาย สินค้าคงคลัง Serial Number และเอกสารสำหรับบัญชี">
      <section className="adminStatGrid">
        <Stat label="ยอดขายชำระแล้ว" value={money.format(revenue)} helper={`${paidDocuments.length} เอกสาร`} />
        <Stat label="เอกสารค้างชำระ" value={money.format(pending)} helper={`${pendingDocuments.length} เอกสาร`} />
        <Stat label="กำไรขั้นต้นคงคลัง" value={money.format(grossProfit)} helper="จากราคาขาย - ราคาทุน" />
        <Stat label="Serial ทั้งหมด" value={`${serialInventory.length} รายการ`} helper="ทุกสถานะ" />
      </section>

      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Inventory Report</p>
              <h2>สินค้าคงคลัง</h2>
            </div>
            <Link className="secondaryButton" href="/admin/reports/inventory.csv">
              <Download size={16} />
              Export CSV
            </Link>
          </div>
          <div className="adminTable">
            {products.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku}</span>
                </div>
                <StatusBadge value={product.stockQuantity <= product.reorderPoint ? "LOW" : "OK"} />
                <b>{product.stockQuantity}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Serial Report</p>
              <h2>สถานะ Serial Number</h2>
            </div>
            <Link className="secondaryButton" href="/admin/reports/documents.csv">
              <Download size={16} />
              Export CSV
            </Link>
          </div>
          <div className="adminTable">
            {serialInventory.map((serial) => (
              <div className="adminRow" key={serial.serialNumber}>
                <div>
                  <strong>{serial.serialNumber}</strong>
                  <span>{serial.product.name}</span>
                </div>
                <StatusBadge value={serial.status} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
