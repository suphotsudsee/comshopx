import { PackagePlus, Upload } from "lucide-react";
import { AdminShell, ScanInput, StatusBadge, ToolButton } from "../components";
import { productCatalog, serialInventory } from "@/lib/admin-data";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default function InventoryPage() {
  return (
    <AdminShell title="Inventory & Serial Number" subtitle="จัดการสินค้า รับเข้า ติดตามประกัน และป้องกันขาย Serial ซ้ำ">
      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Goods Receiving</p>
              <h2>รับสินค้าเข้า</h2>
            </div>
            <div className="toolbar">
              <ToolButton label="รับเข้า" icon={<PackagePlus size={16} />} />
              <ToolButton label="Bulk import" icon={<Upload size={16} />} />
            </div>
          </div>
          <ScanInput placeholder="สแกน SKU หรือ Serial Number ที่รับเข้า" />
          <div className="serialForm">
            <input placeholder="SKU เช่น GPU-RTX4070S-12G" />
            <input placeholder="Serial Number" />
            <input placeholder="Warranty end date" type="date" />
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Product Master</p>
              <h2>สินค้า</h2>
            </div>
          </div>
          <div className="adminTable compact">
            {productCatalog.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku} · {product.category}</span>
                </div>
                <span>{product.stockQuantity} ชิ้น</span>
                <b>{money.format(product.price)}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Serial Number Tracking</p>
            <h2>รายการ Serial Number</h2>
          </div>
        </div>
        <div className="adminTable">
          {serialInventory.map((serial) => (
            <div className="adminRow serial" key={serial.serialNumber}>
              <div>
                <strong>{serial.serialNumber}</strong>
                <span>{serial.productName}</span>
              </div>
              <span>{serial.sku}</span>
              <span>Warranty: {serial.warrantyEndAt}</span>
              <StatusBadge value={serial.status} />
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
