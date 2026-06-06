import { Download, FilePlus2, Printer } from "lucide-react";
import { AdminShell, StatusBadge, ToolButton } from "../components";
import { businessDocuments } from "@/lib/admin-data";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default function DocumentsPage() {
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
        <div className="adminTable">
          {businessDocuments.map((document) => (
            <div className="adminRow document" key={document.documentNo}>
              <div>
                <strong>{document.documentNo}</strong>
                <span>{document.type} · Ref: {document.reference}</span>
              </div>
              <span>{document.customerName}</span>
              <StatusBadge value={document.status} />
              <b>{money.format(document.totalAmount)}</b>
              <button className="iconButton" type="button" aria-label="Print document">
                <Printer size={16} />
              </button>
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
