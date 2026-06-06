import { AdminShell, StatusBadge } from "../components";

const roles = [
  ["Admin/Owner", "Full access"],
  ["Cashier/Sale", "POS, quotations, receipts"],
  ["Inventory Staff", "Products, receiving, serial tracking"],
  ["Accounting", "Documents, tax invoice, reports"]
];

export default function SettingsPage() {
  return (
    <AdminShell title="Settings & RBAC" subtitle="ตั้งค่าร้าน เลขที่เอกสาร VAT และสิทธิ์ผู้ใช้งาน">
      <section className="adminGrid two">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Document Numbering</p>
              <h2>รูปแบบเลขที่เอกสาร</h2>
            </div>
          </div>
          <div className="settingList">
            <span>Quotation: QUO-YYYYMM-0001</span>
            <span>Delivery Note: DN-YYYYMM-0001</span>
            <span>Receipt: REC-YYYYMM-0001</span>
            <span>Tax Invoice: TAX-YYYYMM-0001</span>
            <span>VAT: 7%</span>
          </div>
        </div>

        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">RBAC</p>
              <h2>สิทธิ์ผู้ใช้งาน</h2>
            </div>
          </div>
          <div className="adminTable">
            {roles.map(([role, access]) => (
              <div className="adminRow" key={role}>
                <div>
                  <strong>{role}</strong>
                  <span>{access}</span>
                </div>
                <StatusBadge value="ACTIVE" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
