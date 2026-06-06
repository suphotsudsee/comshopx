import { AdminShell, Stat, StatusBadge } from "./components";
import {
  auditLogs,
  businessDocuments,
  productCatalog,
  reportCards,
  serialInventory
} from "@/lib/admin-data";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default function AdminDashboard() {
  const lowStock = productCatalog.filter((product) => product.stockQuantity <= product.reorderPoint);
  const serialIssues = serialInventory.filter((serial) => serial.status === "CLAIMED" || serial.status === "RESERVED");

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="ภาพรวมยอดขาย สต๊อก เอกสาร และสถานะ Serial Number"
    >
      <section className="adminStatGrid">
        {reportCards.map((card) => (
          <Stat
            key={card.label}
            label={card.label}
            value={money.format(card.value)}
            helper={card.helper}
          />
        ))}
      </section>

      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Low Stock Alert</p>
              <h2>สินค้าที่ต้องเติมสต๊อก</h2>
            </div>
            <StatusBadge value={`${lowStock.length} SKU`} />
          </div>
          <div className="adminTable">
            {lowStock.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku}</span>
                </div>
                <b>{product.stockQuantity} ชิ้น</b>
              </div>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Serial Watchlist</p>
              <h2>Serial Number ที่ต้องติดตาม</h2>
            </div>
            <StatusBadge value={`${serialIssues.length} รายการ`} />
          </div>
          <div className="adminTable">
            {serialIssues.map((serial) => (
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

      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Document Workflow</p>
              <h2>เอกสารล่าสุด</h2>
            </div>
          </div>
          <div className="adminTable">
            {businessDocuments.slice(0, 4).map((document) => (
              <div className="adminRow" key={document.documentNo}>
                <div>
                  <strong>{document.documentNo}</strong>
                  <span>{document.customerName}</span>
                </div>
                <StatusBadge value={document.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Audit Log</p>
              <h2>กิจกรรมระบบ</h2>
            </div>
          </div>
          <div className="auditList">
            {auditLogs.map((log) => (
              <span key={log}>{log}</span>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
