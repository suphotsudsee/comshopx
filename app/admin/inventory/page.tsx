import { PackagePlus, Upload } from "lucide-react";
import { AdminShell, ScanInput, StatusBadge, ToolButton } from "../components";
import { createProductAction, receiveSerialAction, updateSerialStatusAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
});

export default async function InventoryPage({ searchParams }: { searchParams?: { error?: string } }) {
  await requireUser(["ADMIN", "OWNER", "INVENTORY"]);
  const [products, serialInventory] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.serialNumber.findMany({ include: { product: true }, orderBy: { updatedAt: "desc" } })
  ]);
  const formError = searchParams?.error ? decodeURIComponent(searchParams.error) : "";

  return (
    <AdminShell title="Inventory & Serial Number" subtitle="จัดการสินค้า รับเข้า ติดตามประกัน และป้องกันขาย Serial ซ้ำ">
      {formError ? (
        <div className="alertBox danger">Inventory failed: {formError}</div>
      ) : null}
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
          <form action={receiveSerialAction} className="serialForm">
            <input name="sku" placeholder="SKU เช่น GPU-RTX4070S-12G" required />
            <input name="serialNumber" placeholder="Serial Number" required />
            <input name="warrantyEndAt" placeholder="Warranty end date" type="date" />
            <button className="primaryButton" type="submit">บันทึก Serial</button>
          </form>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Product Master</p>
              <h2>สินค้า</h2>
            </div>
          </div>
          <div className="adminTable compact">
            {products.map((product) => (
              <div className="adminRow" key={product.sku}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku} · {product.category.name}</span>
                </div>
                <span>{product.stockQuantity} ชิ้น</span>
                <b>{money.format(Number(product.price))}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Product Master</p>
            <h2>เพิ่มสินค้าใหม่</h2>
          </div>
        </div>
        <form action={createProductAction} className="adminForm">
          <label>SKU<input name="sku" required /></label>
          <label>Barcode<input name="barcode" /></label>
          <label className="wide">ชื่อสินค้า<input name="name" required /></label>
          <label>หมวดหมู่<input name="category" required /></label>
          <label>ราคาทุน<input name="costPrice" type="number" min="0" step="0.01" required /></label>
          <label>ราคาขาย<input name="price" type="number" min="0" step="0.01" required /></label>
          <label>คงเหลือ<input name="stockQuantity" type="number" min="0" defaultValue="0" /></label>
          <label>จุดสั่งซื้อ<input name="reorderPoint" type="number" min="0" defaultValue="0" /></label>
          <label><span>ต้องใช้ Serial</span><input name="requireSerial" type="checkbox" /></label>
          <button className="primaryButton" type="submit">เพิ่มสินค้า</button>
        </form>
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
                <span>{serial.product.name}</span>
              </div>
              <span>{serial.product.sku}</span>
              <span>Warranty: {serial.warrantyEndAt?.toISOString().slice(0, 10) ?? "-"}</span>
              <StatusBadge value={serial.status} />
              <form action={updateSerialStatusAction} className="inlineForm">
                <input type="hidden" name="id" value={serial.id} />
                <select name="status" defaultValue={serial.status}>
                  <option value="IN_STOCK">IN_STOCK</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="SOLD">SOLD</option>
                  <option value="CLAIMED">CLAIMED</option>
                  <option value="RETURNED">RETURNED</option>
                  <option value="LOST">LOST</option>
                </select>
                <button type="submit">Save</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
