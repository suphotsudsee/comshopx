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

type PaidDocument = {
  issuedAt: Date | null;
  createdAt: Date;
  subtotalAmount: unknown;
  vatAmount: unknown;
  totalAmount: unknown;
};

type SalesRow = {
  period: string;
  count: number;
  subtotal: number;
  vat: number;
  total: number;
};

function documentDate(document: Pick<PaidDocument, "issuedAt" | "createdAt">) {
  return document.issuedAt ?? document.createdAt;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function groupSales(documents: PaidDocument[], keyForDate: (date: Date) => string) {
  return Array.from(
    documents.reduce((map, document) => {
      const key = keyForDate(documentDate(document));
      const row = map.get(key) ?? { period: key, count: 0, subtotal: 0, vat: 0, total: 0 };
      row.count += 1;
      row.subtotal += Number(document.subtotalAmount);
      row.vat += Number(document.vatAmount);
      row.total += Number(document.totalAmount);
      map.set(key, row);
      return map;
    }, new Map<string, SalesRow>())
  )
    .map(([, row]) => row)
    .sort((a, b) => b.period.localeCompare(a.period));
}

function SalesReportTable({ rows, periodLabel }: { rows: SalesRow[]; periodLabel: string }) {
  return (
    <div className="reportTable">
      <div className="reportRow head">
        <span>{periodLabel}</span>
        <span>เอกสาร</span>
        <span>ก่อน VAT</span>
        <span>VAT</span>
        <span>รวม</span>
      </div>
      {rows.map((row) => (
        <div className="reportRow" key={row.period}>
          <strong>{row.period}</strong>
          <span>{row.count}</span>
          <span>{money.format(row.subtotal)}</span>
          <span>{money.format(row.vat)}</span>
          <b>{money.format(row.total)}</b>
        </div>
      ))}
      {!rows.length ? <div className="emptyState">ยังไม่มียอดขาย</div> : null}
    </div>
  );
}

export default async function ReportsPage() {
  await requireUser(["ADMIN", "OWNER", "ACCOUNTING", "INVENTORY"]);
  const [products, serialInventory, paidDocuments, pendingDocuments] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.serialNumber.findMany({ include: { product: true }, orderBy: { updatedAt: "desc" } }),
    prisma.document.findMany({ where: { status: "PAID" }, orderBy: { issuedAt: "desc" } }),
    prisma.document.findMany({ where: { status: { in: ["DRAFT", "ISSUED"] } } })
  ]);

  const revenue = paidDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const pending = pendingDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const todayKey = dateKey(new Date());
  const currentMonthKey = monthKey(new Date());
  const todayRevenue = paidDocuments
    .filter((document) => dateKey(documentDate(document)) === todayKey)
    .reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const monthRevenue = paidDocuments
    .filter((document) => monthKey(documentDate(document)) === currentMonthKey)
    .reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const grossProfit = products.reduce(
    (sum, product) => sum + (Number(product.price) - Number(product.costPrice)) * product.stockQuantity,
    0
  );
  const dailySales = groupSales(paidDocuments, dateKey).slice(0, 30);
  const monthlySales = groupSales(paidDocuments, monthKey);

  return (
    <AdminShell title="Reports" subtitle="ยอดขายประจำวัน ยอดขายประจำเดือน สินค้าคงคลัง Serial Number และเอกสารบัญชี">
      <section className="adminStatGrid">
        <Stat label="ยอดขายชำระแล้ว" value={money.format(revenue)} helper={`${paidDocuments.length} เอกสาร`} />
        <Stat label="ยอดขายวันนี้" value={money.format(todayRevenue)} helper={todayKey} />
        <Stat label="ยอดขายเดือนนี้" value={money.format(monthRevenue)} helper={currentMonthKey} />
        <Stat label="เอกสารค้างชำระ" value={money.format(pending)} helper={`${pendingDocuments.length} เอกสาร`} />
        <Stat label="กำไรขั้นต้นคงคลัง" value={money.format(grossProfit)} helper="ราคาขาย - ราคาทุน" />
        <Stat label="Serial ทั้งหมด" value={`${serialInventory.length} รายการ`} helper="ทุกสถานะ" />
      </section>

      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Daily Sales</p>
              <h2>รายงานยอดขายประจำวัน</h2>
            </div>
            <Link className="secondaryButton" href="/admin/reports/sales-daily.csv">
              <Download size={16} />
              Export CSV
            </Link>
          </div>
          <SalesReportTable rows={dailySales} periodLabel="วันที่" />
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Monthly Sales</p>
              <h2>รายงานยอดขายประจำเดือน</h2>
            </div>
            <Link className="secondaryButton" href="/admin/reports/sales-monthly.csv">
              <Download size={16} />
              Export CSV
            </Link>
          </div>
          <SalesReportTable rows={monthlySales} periodLabel="เดือน" />
        </div>
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
