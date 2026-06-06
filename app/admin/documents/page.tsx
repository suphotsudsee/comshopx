import { Download, FilePlus2, Printer } from "lucide-react";
import Link from "next/link";
import { AdminShell, StatusBadge, ToolButton } from "../components";
import { createDocumentAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default async function DocumentsPage() {
  await requireUser(["ADMIN", "OWNER", "CASHIER", "ACCOUNTING"]);
  const [documents, customers, products] = await Promise.all([
    prisma.document.findMany({
      include: { customer: true, referenceDocument: true, items: { include: { product: true, serialNumber: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <AdminShell title="Document Management" subtitle="ใบเสนอราคา ใบส่งของ ใบเสร็จรับเงิน และใบกำกับภาษี">
      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Business Documents</p>
            <h2>รายการเอกสาร</h2>
          </div>
          <div className="toolbar">
            <ToolButton label="New quotation" icon={<FilePlus2 size={16} />} />
            <ToolButton label="Export PDF" icon={<Download size={16} />} />
          </div>
        </div>
        <form action={createDocumentAction} className="adminForm">
          <label>ประเภทเอกสาร
            <select name="type" defaultValue="QUOTATION">
              <option value="QUOTATION">Quotation</option>
              <option value="DELIVERY_NOTE">Delivery Note</option>
              <option value="RECEIPT">Receipt</option>
              <option value="TAX_INVOICE">Tax Invoice</option>
            </select>
          </label>
          <label className="wide">ลูกค้า
            <select name="customerId">
              <option value="">Walk-in customer</option>
              {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label className="wide">สินค้า
            <select name="productId" required>
              {products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}
            </select>
          </label>
          <label>จำนวน<input name="quantity" type="number" min="1" defaultValue="1" /></label>
          <label>ส่วนลด<input name="discountAmount" type="number" min="0" step="0.01" defaultValue="0" /></label>
          <label className="wide">หมายเหตุ<input name="note" /></label>
          <button className="primaryButton" type="submit">สร้างเอกสาร</button>
        </form>
      </section>

      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Business Documents</p>
            <h2>รายการเอกสาร</h2>
          </div>
        </div>
        <div className="adminTable">
          {documents.map((document) => (
            <div className="adminRow document" key={document.documentNo}>
              <div>
                <strong>{document.documentNo}</strong>
                <span>{document.type} · Ref: {document.referenceDocument?.documentNo ?? "-"}</span>
              </div>
              <span>{document.customer?.name ?? "Walk-in customer"}</span>
              <StatusBadge value={document.status} />
              <b>{money.format(Number(document.totalAmount))}</b>
              <Link className="iconButton" href={`/admin/documents/${document.id}`} aria-label="Print document">
                <Printer size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="adminGrid three">
        <div className="adminPanel flowStep">
          <strong>1. Quotation</strong>
          <span>สร้างใบเสนอราคา กำหนดวันหมดอายุ ส่วนลด และ VAT</span>
        </div>
        <div className="adminPanel flowStep">
          <strong>2. Delivery Note</strong>
          <span>แปลงจากใบเสนอราคาและระบุ Serial Number ที่ส่งมอบจริง</span>
        </div>
        <div className="adminPanel flowStep">
          <strong>3. Receipt / Tax Invoice</strong>
          <span>รับชำระเงิน ออกเลขเอกสาร และ Export PDF</span>
        </div>
      </section>
    </AdminShell>
  );
}
