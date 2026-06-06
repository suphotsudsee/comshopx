import { Barcode, CreditCard, ReceiptText } from "lucide-react";
import { AdminShell, ScanInput, StatusBadge, ToolButton } from "../components";
import { paymentMethods, productCatalog, serialInventory } from "@/lib/admin-data";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default function PosPage() {
  const cart = productCatalog.slice(0, 3);
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discount = 1200;
  const vat = Math.round((subtotal - discount) * 0.07);
  const total = subtotal - discount + vat;

  return (
    <AdminShell title="Point of Sale" subtitle="ขายหน้าร้าน สแกน Barcode/QR และเลือก Serial Number ตอนขาย">
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
            {productCatalog.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku} · {product.category}</span>
                </div>
                <b>{money.format(product.price)}</b>
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
          <div className="adminTable">
            {cart.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>
                    {product.requireSerial
                      ? serialInventory.find((serial) => serial.sku === product.sku)?.serialNumber
                      : "No serial required"}
                  </span>
                </div>
                <b>{money.format(product.price)}</b>
              </div>
            ))}
          </div>
          <div className="checkoutBox">
            <span>Subtotal <b>{money.format(subtotal)}</b></span>
            <span>Discount <b>{money.format(discount)}</b></span>
            <span>VAT 7% <b>{money.format(vat)}</b></span>
            <strong>Total {money.format(total)}</strong>
          </div>
          <div className="paymentGrid">
            {paymentMethods.map((method) => (
              <button type="button" key={method}>{method}</button>
            ))}
          </div>
          <button className="wideButton" type="button">
            <CreditCard size={18} />
            รับชำระเงินและออกใบเสร็จ
          </button>
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
            <span>QUO-202606-0001</span>
            <span>DN-202606-0001</span>
            <span>REC-202606-0001 / TAX-202606-0001</span>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
