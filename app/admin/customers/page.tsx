import { FileText, UserPlus } from "lucide-react";
import { AdminShell, StatusBadge, ToolButton } from "../components";
import { createCustomerAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

export default async function CustomersPage() {
  await requireUser(["ADMIN", "OWNER", "CASHIER", "ACCOUNTING"]);
  const [customers, documents] = await Promise.all([
    prisma.customer.findMany({ include: { documents: true }, orderBy: { updatedAt: "desc" } }),
    prisma.document.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 20 })
  ]);

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
        <form action={createCustomerAction} className="adminForm">
          <label className="wide">ชื่อลูกค้า<input name="name" required /></label>
          <label>เบอร์โทร<input name="phone" /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Tax ID<input name="taxId" /></label>
          <label className="full">ที่อยู่<textarea name="address" /></label>
          <button className="primaryButton" type="submit">บันทึกลูกค้า</button>
        </form>
      </section>

      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Customer Database</p>
            <h2>รายชื่อลูกค้า</h2>
          </div>
        </div>
        <div className="customerAdminGrid">
          {customers.map((customer) => (
            <article className="customerAdminCard" key={customer.name}>
              <div>
                <strong>{customer.name}</strong>
                <StatusBadge value={customer.taxId ? "COMPANY" : "PERSON"} />
              </div>
              <span>{customer.phone} · {customer.email}</span>
              <span>Tax ID: {customer.taxId || "-"}</span>
              <small>{customer.address}</small>
              <div className="miniList">
                {customer.documents.length ? (
                  customer.documents.slice(0, 3).map((document) => <b key={document.id}>{document.documentNo}</b>)
                ) : (
                  <b>No document history</b>
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
          {documents.map((document) => (
            <div className="adminRow" key={document.documentNo}>
              <div>
                <strong>{document.customer?.name ?? "Walk-in customer"}</strong>
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
