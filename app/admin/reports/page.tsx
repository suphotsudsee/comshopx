import { Download } from "lucide-react";
import Link from "next/link";
import { AdminShell, Stat, StatusBadge } from "../components";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2
});

const number = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

type PaidDocument = {
  issuedAt: Date | null;
  createdAt: Date;
  subtotalAmount: unknown;
  vatAmount: unknown;
  totalAmount: unknown;
  customerId: string | null;
  customer: { name: string } | null;
  items: Array<{
    quantity: number;
    total: unknown;
    product: { costPrice: unknown };
  }>;
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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function monthKey(date: Date) {
  return dateKey(date).slice(0, 7);
}

function displayDate(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
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

function documentProfit(document: PaidDocument) {
  return document.items.reduce((sum, item) => {
    const cost = Number(item.product.costPrice) * item.quantity;
    return sum + Number(item.total) - cost;
  }, 0);
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

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: { dateFrom?: string; dateTo?: string };
}) {
  await requireUser(["ADMIN", "OWNER", "ACCOUNTING", "INVENTORY"]);
  const today = dateKey(new Date());
  const dateFrom = searchParams?.dateFrom || today;
  const dateTo = searchParams?.dateTo || dateFrom;

  const [products, serialInventory, paidDocuments, pendingDocuments, company] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.serialNumber.findMany({ include: { product: true }, orderBy: { updatedAt: "desc" } }),
    prisma.document.findMany({
      where: { status: "PAID" },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { issuedAt: "desc" }
    }),
    prisma.document.findMany({ where: { status: { in: ["DRAFT", "ISSUED"] } } }),
    prisma.companySetting.findUnique({ where: { id: "default" } })
  ]);

  const filteredDocuments = paidDocuments.filter((document) => {
    const key = dateKey(documentDate(document));
    return key >= dateFrom && key <= dateTo;
  });
  const revenue = paidDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const pending = pendingDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const todayRevenue = paidDocuments
    .filter((document) => dateKey(documentDate(document)) === today)
    .reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const currentMonthKey = monthKey(new Date());
  const monthRevenue = paidDocuments
    .filter((document) => monthKey(documentDate(document)) === currentMonthKey)
    .reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const inventoryGrossProfit = products.reduce(
    (sum, product) => sum + (Number(product.price) - Number(product.costPrice)) * product.stockQuantity,
    0
  );
  const rangeSales = filteredDocuments.reduce((sum, document) => sum + Number(document.totalAmount), 0);
  const rangeProfit = filteredDocuments.reduce((sum, document) => sum + documentProfit(document), 0);
  const shippingCost = 0;
  const profitAfterShipping = rangeProfit - shippingCost;
  const profitPercent = rangeSales > 0 ? (profitAfterShipping / rangeSales) * 100 : 0;
  const customerType = filteredDocuments.every((document) => !document.customerId) ? "ลูกค้าจร" : "ลูกค้าทั้งหมด";
  const dailySales = groupSales(paidDocuments, dateKey).slice(0, 30);
  const monthlySales = groupSales(paidDocuments, monthKey);

  return (
    <AdminShell title="Reports" subtitle="ยอดขายประจำวัน ยอดขายประจำเดือน กำไรขั้นต้น และรายงานเดินสะพัด">
      <section className="adminStatGrid">
        <Stat label="ยอดขายชำระแล้ว" value={money.format(revenue)} helper={`${paidDocuments.length} เอกสาร`} />
        <Stat label="ยอดขายวันนี้" value={money.format(todayRevenue)} helper={today} />
        <Stat label="ยอดขายเดือนนี้" value={money.format(monthRevenue)} helper={currentMonthKey} />
        <Stat label="เอกสารค้างชำระ" value={money.format(pending)} helper={`${pendingDocuments.length} เอกสาร`} />
        <Stat label="กำไรขั้นต้นคงคลัง" value={money.format(inventoryGrossProfit)} helper="ราคาขาย - ราคาทุน" />
        <Stat label="Serial ทั้งหมด" value={`${serialInventory.length} รายการ`} helper="ทุกสถานะ" />
      </section>

      <section className="adminPanel circulationReport">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Gross Profit Circulation</p>
            <h2>รายงานเดินสะพัด / กำไรขั้นต้น</h2>
          </div>
          <form className="reportFilter">
            <label>
              จากวันที่
              <input name="dateFrom" type="date" defaultValue={dateFrom} />
            </label>
            <label>
              ถึงวันที่
              <input name="dateTo" type="date" defaultValue={dateTo} />
            </label>
            <button className="secondaryButton" type="submit">ดูรายงาน</button>
          </form>
        </div>

        <div className="circulationSheet">
          <div className="circulationTop">
            <span>{displayDate(new Date())}</span>
            <strong>{company?.taxId ?? "-"} : {company?.name ?? "ComShopX"} ({company?.address ? "สำนักงานใหญ่" : ""})</strong>
            <span>ช่วงเวลา {dateFrom} ถึง {dateTo}</span>
          </div>

          <div className="circulationGrid">
            <div>
              <span>ประเภท</span>
              <strong>{customerType}</strong>
            </div>
            <div>
              <span>กำไร (บาท)</span>
              <strong>{number.format(profitAfterShipping)}</strong>
            </div>
            <div>
              <span>กำไร %</span>
              <strong>{number.format(profitPercent)}</strong>
            </div>
            <div>
              <span>ยอดขาย (บาท)</span>
              <strong>{number.format(rangeSales)}</strong>
            </div>
            <div>
              <span>ยอดขาย %</span>
              <strong>{rangeSales > 0 ? "100.00" : "0.00"}</strong>
            </div>
          </div>

          <div className="circulationSummary">
            <span>กำไรขั้นต้น <b>{money.format(rangeProfit)}</b></span>
            <span>หักค่าขนส่ง <b>{money.format(shippingCost)}</b></span>
            <span>กำไรขั้นต้น-ค่าขนส่ง <b>{money.format(profitAfterShipping)}</b></span>
            <span>ยอดขาย <b>{money.format(rangeSales)}</b></span>
            <strong>{number.format(profitPercent)}%</strong>
          </div>

          <div className="circulationFooter">
            <strong>รายงานเดินสะพัด</strong>
            <span>(ส่งสินค้าระหว่างสาขา) RN, CRN, DRN, ZRN</span>
          </div>
        </div>
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
