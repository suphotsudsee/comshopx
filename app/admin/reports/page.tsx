import { Download } from "lucide-react";
import { AdminShell, Stat, StatusBadge, ToolButton } from "../components";
import { productCatalog, reportCards, serialInventory } from "@/lib/admin-data";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default function ReportsPage() {
  return (
    <AdminShell title="Reports" subtitle="ยอดขาย สินค้าคงคลัง Serial Number และเอกสารสำหรับบัญชี">
      <section className="adminStatGrid">
        {reportCards.map((card) => (
          <Stat key={card.label} label={card.label} value={money.format(card.value)} helper={card.helper} />
        ))}
      </section>

      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Inventory Report</p>
              <h2>สินค้าคงคลัง</h2>
            </div>
            <ToolButton label="Export CSV" icon={<Download size={16} />} />
          </div>
          <div className="adminTable">
            {productCatalog.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku}</span>
                </div>
                <StatusBadge value={product.stockQuantity <= product.reorderPoint ? "LOW" : "OK"} />
                <b>{product.stockQuantity}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Serial Report</p>
              <h2>สถานะ Serial Number</h2>
            </div>
            <ToolButton label="Export PDF" icon={<Download size={16} />} />
          </div>
          <div className="adminTable">
            {serialInventory.map((serial) => (
              <div className="adminRow" key={serial.serialNumber}>
                <div>
                  <strong>{serial.serialNumber}</strong>
                  <span>{serial.productName}</span>
                </div>
                <StatusBadge value={serial.status} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
