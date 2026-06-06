import { FileText, UserPlus } from "lucide-react";
import { AdminShell, StatusBadge, ToolButton } from "../components";
import { businessDocuments, customerProfiles } from "@/lib/admin-data";

export default function CustomersPage() {
  return (
    <AdminShell title="Customer CRM" subtitle="ข้อมูลลูกค้า ประวัติซื้อ เอกสาร และ Serial Number ที่เคยซื้อ">
      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Customer Database</p>
            <h2>ลูกค้า</h2>
          </div>
          <ToolButton label="เพิ่มลูกค้า" icon={<UserPlus size={16} />} />
        </div>
        <div className="customerAdminGrid">
          {customerProfiles.map((customer) => (
            <article className="customerAdminCard" key={customer.name}>
              <div>
                <strong>{customer.name}</strong>
                <StatusBadge value={customer.type} />
              </div>
              <span>{customer.phone} · {customer.email}</span>
              <span>Tax ID: {customer.taxId || "-"}</span>
              <small>{customer.address}</small>
              <div className="miniList">
                {customer.purchasedSerials.length ? (
                  customer.purchasedSerials.map((serial) => <b key={serial}>{serial}</b>)
                ) : (
                  <b>No serial purchase history</b>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Customer Documents</p>
            <h2>ประวัติเอกสาร</h2>
          </div>
          <FileText size={20} />
        </div>
        <div className="adminTable">
          {businessDocuments.map((document) => (
            <div className="adminRow" key={document.documentNo}>
              <div>
                <strong>{document.customerName}</strong>
                <span>{document.documentNo} · {document.type}</span>
              </div>
              <StatusBadge value={document.status} />
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
