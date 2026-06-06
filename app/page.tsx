import {
  AlertTriangle,
  Barcode,
  Boxes,
  FileText,
  ReceiptText,
  ScanLine,
  ShoppingCart,
  Users
} from "lucide-react";
import { customers, documents, lowStockProducts, products, serialNumbers } from "@/lib/mock-data";

const formatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default function Home() {
  const revenue = documents
    .filter((document) => document.type === "RECEIPT")
    .reduce((sum, document) => sum + document.totalAmount, 0);
  const inStockSerials = serialNumbers.filter((serial) => serial.status === "IN_STOCK").length;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">CX</div>
          <div>
            <strong>ComShopX</strong>
            <span>Computer Store Suite</span>
          </div>
        </div>
        <nav className="nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#pos">POS</a>
          <a href="#documents">Documents</a>
          <a href="#inventory">Inventory</a>
          <a href="#customers">Customers</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">6 June 2026</p>
            <h1>ระบบจัดการร้านคอมพิวเตอร์ครบวงจร</h1>
          </div>
          <div className="topActions">
            <button className="iconButton" aria-label="Scan barcode">
              <ScanLine size={20} />
            </button>
            <button className="primaryButton">
              <ReceiptText size={18} />
              ออกใบเสร็จ
            </button>
          </div>
        </header>

        <section id="dashboard" className="metricGrid">
          <Metric icon={<ReceiptText size={22} />} label="ยอดขายวันนี้" value={formatter.format(revenue)} />
          <Metric icon={<FileText size={22} />} label="เอกสารเดือนนี้" value={`${documents.length} ฉบับ`} />
          <Metric icon={<Boxes size={22} />} label="Serial พร้อมขาย" value={`${inStockSerials} รายการ`} />
          <Metric icon={<AlertTriangle size={22} />} label="สินค้าใกล้หมด" value={`${lowStockProducts.length} SKU`} />
        </section>

        <section className="contentGrid">
          <div id="pos" className="panel posPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Point of Sale</p>
                <h2>ขายหน้าร้าน</h2>
              </div>
              <button className="iconButton" aria-label="Barcode scan">
                <Barcode size={18} />
              </button>
            </div>
            <div className="scanBox">
              <ScanLine size={28} />
              <span>สแกน Barcode / Serial Number</span>
            </div>
            <div className="cartList">
              {products.slice(0, 3).map((product) => (
                <div className="cartRow" key={product.sku}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                  </div>
                  <b>{formatter.format(product.price)}</b>
                </div>
              ))}
            </div>
            <div className="summaryBox">
              <span>VAT 7% รวมในราคา</span>
              <strong>{formatter.format(72600)}</strong>
            </div>
            <button className="wideButton">
              <ShoppingCart size={18} />
              รับชำระเงิน
            </button>
          </div>

          <div id="documents" className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Document Workflow</p>
                <h2>เอกสารล่าสุด</h2>
              </div>
              <button className="secondaryButton">สร้างเอกสาร</button>
            </div>
            <div className="table">
              {documents.map((document) => (
                <div className="tableRow" key={document.documentNo}>
                  <div>
                    <strong>{document.documentNo}</strong>
                    <span>{document.customerName}</span>
                  </div>
                  <span className={`badge ${document.status.toLowerCase()}`}>{document.status}</span>
                  <b>{formatter.format(document.totalAmount)}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="contentGrid">
          <div id="inventory" className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Serial Number Inventory</p>
                <h2>คลังสินค้า</h2>
              </div>
              <button className="secondaryButton">รับสินค้าเข้า</button>
            </div>
            <div className="serialList">
              {serialNumbers.map((serial) => (
                <div className="serialRow" key={serial.serialNumber}>
                  <div>
                    <strong>{serial.productName}</strong>
                    <span>{serial.serialNumber}</span>
                  </div>
                  <span className={`badge ${serial.status.toLowerCase()}`}>{serial.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="customers" className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">CRM</p>
                <h2>ลูกค้า</h2>
              </div>
              <Users size={20} />
            </div>
            <div className="customerGrid">
              {customers.map((customer) => (
                <article className="customerCard" key={customer.name}>
                  <strong>{customer.name}</strong>
                  <span>{customer.phone}</span>
                  <small>Tax ID: {customer.taxId || "-"}</small>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="metric">
      <div className="metricIcon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
