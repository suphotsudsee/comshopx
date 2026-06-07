import { Barcode, CreditCard, ReceiptText } from "lucide-react";
import { AdminShell, ScanInput, StatusBadge, ToolButton } from "../components";
import { createPosSaleAction } from "@/lib/actions";
import { paymentMethods } from "@/lib/admin-data";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default async function PosPage({ searchParams }: { searchParams?: { error?: string } }) {
  await requireUser(["ADMIN", "OWNER", "CASHIER"]);
  let loadError = "";
  const [products, customers, recentReceipts] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, serialNumbers: { where: { status: "IN_STOCK" }, orderBy: { serialNumber: "asc" } } },
      orderBy: { name: "asc" }
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.document.findMany({ where: { type: "RECEIPT" }, orderBy: { createdAt: "desc" }, take: 3 })
  ]).catch((error: Error) => {
    loadError = error.message;
    return [[], [], []] as const;
  });
  const preview = products.slice(0, 3);
  const subtotal = preview.reduce((sum, item) => sum + Number(item.price), 0);
  const vat = Math.round(subtotal * 0.07);
  const total = subtotal + vat;
  const formError = searchParams?.error ? decodeURIComponent(searchParams.error) : "";

  return (
    <AdminShell title="Point of Sale" subtitle="ขายหน้าร้าน สแกน Barcode/QR และเลือก Serial Number ตอนขาย">
      {loadError ? (
        <div className="alertBox danger">POS data load failed: {loadError}</div>
      ) : null}
      {formError ? (
        <div className="alertBox danger">POS sale failed: {formError}</div>
      ) : null}
      <section className="adminGrid pos">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Scanner</p>
              <h2>ค้นหาสินค้า</h2>
            </div>
            <ToolButton label="Scan" icon={<Barcode size={16} />} />
          </div>
          <ScanInput placeholder="ยิง Barcode, QR Code, SKU หรือ Serial Number" />
          <div className="adminTable compact">
            {products.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku} · {product.category?.name ?? "No category"}</span>
                </div>
                <b>{money.format(Number(product.price))}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Cart</p>
              <h2>ตะกร้าสินค้า</h2>
            </div>
            <StatusBadge value="VAT 7%" />
          </div>
          <form action={createPosSaleAction} className="adminForm">
            <label className="wide">ลูกค้า
              <select name="customerId">
                <option value="">Walk-in customer</option>
                {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label>ชำระเงิน
              <select name="paymentMethod" defaultValue="CASH">
                <option value="CASH">Cash</option>
                <option value="TRANSFER">Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="MIXED">Mixed</option>
              </select>
            </label>
            <div className="full adminTable">
              {products.map((product) => (
                <label className="adminRow" key={product.id}>
                  <span>
                    <input name="productId" type="checkbox" value={product.id} />
                    {" "}
                    <strong>{product.name}</strong>
                    <small>{product.sku} · {money.format(Number(product.price))}</small>
                  </span>
                  {product.requireSerial ? (
                    <select name={`serial_${product.id}`} defaultValue="">
                      <option value="">เลือก Serial Number</option>
                      {product.serialNumbers.map((serial) => (
                        <option value={serial.id} key={serial.id}>{serial.serialNumber}</option>
                      ))}
                    </select>
                  ) : (
                    <input name={`serial_${product.id}`} type="hidden" value="" />
                  )}
                </label>
              ))}
            </div>
            <button className="primaryButton full" type="submit">
              <CreditCard size={18} />
              รับชำระเงินและออกใบเสร็จ
            </button>
          </form>
          <div className="checkoutBox">
            <span>Subtotal <b>{money.format(subtotal)}</b></span>
            <span>VAT 7% <b>{money.format(vat)}</b></span>
            <strong>Total {money.format(total)}</strong>
          </div>
          <div className="paymentGrid">
            {paymentMethods.map((method) => (
              <button type="button" key={method}>{method}</button>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Document Output</p>
              <h2>เอกสารหลังขาย</h2>
            </div>
            <ReceiptText size={20} />
          </div>
          <div className="documentFlow">
            {recentReceipts.map((receipt) => <span key={receipt.id}>{receipt.documentNo}</span>)}
            {!recentReceipts.length ? <span>ยังไม่มีใบเสร็จ</span> : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
