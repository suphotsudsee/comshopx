import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { PrintButton } from "./print-button";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB"
});

const names: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา",
  DELIVERY_NOTE: "ใบส่งของ",
  RECEIPT: "ใบเสร็จรับเงิน",
  TAX_INVOICE: "ใบกำกับภาษี"
};

export default async function PrintableDocumentPage({
  params
}: {
  params: { id: string };
}) {
  await requireUser(["ADMIN", "OWNER", "CASHIER", "ACCOUNTING"]);
  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      referenceDocument: true,
      items: { include: { product: true, serialNumber: true } }
    }
  });
  if (!document) notFound();

  return (
    <main className="printPage">
      <div className="printToolbar">
        <Link href="/admin/documents" className="secondaryButton">Back</Link>
        <PrintButton />
      </div>
      <section className="printSheet">
        <header className="printHeader">
          <div>
            <h1>ComShopX</h1>
            <span>All-in-One Computer Store Management System</span>
            <span>Tax ID: 0000000000000</span>
          </div>
          <div>
            <h2>{names[document.type]}</h2>
            <strong>{document.documentNo}</strong>
            <span>Date: {document.issuedAt?.toISOString().slice(0, 10) ?? document.createdAt.toISOString().slice(0, 10)}</span>
          </div>
        </header>

        <section className="printCustomer">
          <strong>Customer</strong>
          <span>{document.customer?.name ?? "Walk-in customer"}</span>
          <span>Tax ID: {document.customer?.taxId ?? "-"}</span>
          <span>{document.customer?.address ?? "-"}</span>
          <span>{document.customer?.phone ?? ""} {document.customer?.email ?? ""}</span>
          <span>Reference: {document.referenceDocument?.documentNo ?? "-"}</span>
        </section>

        <table className="printTable">
          <thead>
            <tr>
              <th>Item</th>
              <th>Serial Number</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>{item.serialNumber?.serialNumber ?? "-"}</td>
                <td>{item.quantity}</td>
                <td>{money.format(Number(item.unitPrice))}</td>
                <td>{money.format(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="printTotals">
          <span>Subtotal <b>{money.format(Number(document.subtotalAmount))}</b></span>
          <span>Discount <b>{money.format(Number(document.discountAmount))}</b></span>
          <span>VAT 7% <b>{money.format(Number(document.vatAmount))}</b></span>
          <strong>Total {money.format(Number(document.totalAmount))}</strong>
        </section>

        <footer className="printFooter">
          <span>ผู้รับสินค้า / Customer Signature</span>
          <span>ผู้อนุมัติ / Authorized Signature</span>
        </footer>
      </section>
    </main>
  );
}
