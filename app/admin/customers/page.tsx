import { FileText, UserPlus } from "lucide-react";
import { AdminShell, StatusBadge, ToolButton } from "../components";
import { createCustomerAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

export default async function CustomersPage() {
  await requireUser(["ADMIN", "OWNER", "CASHIER", "ACCOUNTING"]);
  const [customers, documents] = await Promise.all([
    prisma.customer.findMany({
      include: {
        documents: {
          include: {
            items: { include: { product: true, serialNumber: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.document.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  return (
    <AdminShell title="Customer CRM" subtitle="Customer records, document history, and purchased Serial Numbers">
      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Customer Database</p>
            <h2>Add customer</h2>
          </div>
          <ToolButton label="New customer" icon={<UserPlus size={16} />} />
        </div>
        <form action={createCustomerAction} className="adminForm">
          <label className="wide">Customer name<input name="name" required /></label>
          <label>Phone<input name="phone" /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Tax ID<input name="taxId" /></label>
          <label className="full">Address<textarea name="address" /></label>
          <button className="primaryButton" type="submit">Save customer</button>
        </form>
      </section>

      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">CRM</p>
            <h2>Customers</h2>
          </div>
        </div>
        <div className="customerAdminGrid">
          {customers.map((customer) => {
            const serials = customer.documents.flatMap((document) =>
              document.items
                .filter((item) => item.serialNumber)
                .map((item) => ({
                  id: item.id,
                  documentNo: document.documentNo,
                  serialNumber: item.serialNumber?.serialNumber,
                  productName: item.product.name
                }))
            );

            return (
              <article className="customerAdminCard" key={customer.id}>
                <div>
                  <strong>{customer.name}</strong>
                  <StatusBadge value={customer.taxId ? "COMPANY" : "PERSON"} />
                </div>
                <span>{customer.phone || "-"} · {customer.email || "-"}</span>
                <span>Tax ID: {customer.taxId || "-"}</span>
                <small>{customer.address || "-"}</small>
                <div className="miniList">
                  {customer.documents.length ? (
                    customer.documents.slice(0, 3).map((document) => <b key={document.id}>{document.documentNo}</b>)
                  ) : (
                    <b>No document history</b>
                  )}
                </div>
                <div className="miniList">
                  {serials.length ? (
                    serials.slice(0, 4).map((serial) => (
                      <b key={serial.id}>{serial.serialNumber} · {serial.documentNo}</b>
                    ))
                  ) : (
                    <b>No serial purchase history</b>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Customer Documents</p>
            <h2>Document history</h2>
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
