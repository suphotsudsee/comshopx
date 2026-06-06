import { AdminShell, Stat, StatusBadge } from "./components";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default async function AdminDashboard() {
  await requireUser();
  const [products, serialIssues, documents, auditLogs] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.serialNumber.findMany({
      where: { status: { in: ["CLAIMED", "RESERVED"] } },
      include: { product: true },
      orderBy: { updatedAt: "desc" },
      take: 8
    }),
    prisma.document.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);
  const lowStock = products.filter((product) => product.stockQuantity <= product.reorderPoint);
  const paidDocuments = documents.filter((document) => document.status === "PAID");
  const revenue = paidDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const pending = documents
    .filter((document) => document.status !== "PAID" && document.status !== "CANCELLED")
    .reduce((sum, document) => sum + Number(document.totalAmount), 0);

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="ภาพรวมยอดขาย สต๊อก เอกสาร และสถานะ Serial Number"
    >
      <section className="adminStatGrid">
        <Stat label="ยอดขายจากเอกสารชำระแล้ว" value={money.format(revenue)} helper={`${paidDocuments.length} เอกสาร`} />
        <Stat label="เอกสารค้างชำระ" value={money.format(pending)} helper="ใบเสนอราคา/ใบส่งของ" />
        <Stat label="สินค้าใกล้หมด" value={`${lowStock.length} SKU`} helper="จาก Product Master" />
        <Stat label="Serial ติดตาม" value={`${serialIssues.length} รายการ`} helper="Reserved / Claimed" />
      </section>

      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Low Stock Alert</p>
              <h2>สินค้าที่ต้องเติมสต๊อก</h2>
            </div>
            <StatusBadge value={`${lowStock.length} SKU`} />
          </div>
          <div className="adminTable">
            {lowStock.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku}</span>
                </div>
                <b>{product.stockQuantity} ชิ้น</b>
              </div>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Serial Watchlist</p>
              <h2>Serial Number ที่ต้องติดตาม</h2>
            </div>
            <StatusBadge value={`${serialIssues.length} รายการ`} />
          </div>
          <div className="adminTable">
            {serialIssues.map((serial) => (
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

      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Document Workflow</p>
              <h2>เอกสารล่าสุด</h2>
            </div>
          </div>
          <div className="adminTable">
            {documents.slice(0, 4).map((document) => (
              <div className="adminRow" key={document.documentNo}>
                <div>
                  <strong>{document.documentNo}</strong>
                  <span>{document.customer?.name ?? "Walk-in customer"}</span>
                </div>
                <StatusBadge value={document.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Audit Log</p>
              <h2>กิจกรรมระบบ</h2>
            </div>
          </div>
          <div className="auditList">
            {auditLogs.map((log) => (
              <span key={log.id}>
                {log.createdAt.toLocaleString("th-TH")} {log.user?.name ?? "System"} {log.action} {log.entity}
              </span>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
