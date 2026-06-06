import { AdminShell, StatusBadge } from "../components";
import { createUserAction, updateCompanySettingsAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

const roles = [
  ["Admin/Owner", "Full access"],
  ["Cashier/Sale", "POS, quotations, receipts"],
  ["Inventory Staff", "Products, receiving, serial tracking"],
  ["Accounting", "Documents, tax invoice, reports"]
];

export default async function SettingsPage() {
  await requireUser(["ADMIN", "OWNER"]);
  const [users, company] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.companySetting.findUnique({ where: { id: "default" } })
  ]);

  return (
    <AdminShell title="Settings & RBAC" subtitle="ตั้งค่าร้าน เลขที่เอกสาร VAT และสิทธิ์ผู้ใช้งาน">
      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Company Profile</p>
            <h2>ชื่อบริษัทและโลโก้</h2>
          </div>
        </div>
        <form action={updateCompanySettingsAction} className="adminForm">
          <label className="wide">ชื่อบริษัท<input name="name" defaultValue={company?.name ?? "ComShopX"} required /></label>
          <label className="wide">Logo URL<input name="logoUrl" defaultValue={company?.logoUrl ?? ""} placeholder="https://example.com/logo.png" /></label>
          <label>Tax ID<input name="taxId" defaultValue={company?.taxId ?? ""} /></label>
          <label>Phone<input name="phone" defaultValue={company?.phone ?? ""} /></label>
          <label className="wide">Email<input name="email" defaultValue={company?.email ?? ""} type="email" /></label>
          <label className="full">Address<textarea name="address" defaultValue={company?.address ?? ""} /></label>
          <button className="primaryButton" type="submit">บันทึกข้อมูลบริษัท</button>
        </form>
        {company?.logoUrl ? (
          <div className="companyPreview">
            <img src={company.logoUrl} alt={`${company.name} logo`} />
            <div>
              <strong>{company.name}</strong>
              <span>{company.taxId}</span>
            </div>
          </div>
        ) : null}
      </section>
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
      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Users</p>
            <h2>เพิ่มผู้ใช้งาน</h2>
          </div>
        </div>
        <form action={createUserAction} className="adminForm">
          <label>ชื่อ<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          <label>Role
            <select name="role" defaultValue="CASHIER">
              <option value="ADMIN">ADMIN</option>
              <option value="OWNER">OWNER</option>
              <option value="CASHIER">CASHIER</option>
              <option value="INVENTORY">INVENTORY</option>
              <option value="ACCOUNTING">ACCOUNTING</option>
            </select>
          </label>
          <button className="primaryButton" type="submit">สร้าง user</button>
        </form>
      </section>
      <section className="adminPanel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Active Users</p>
            <h2>ผู้ใช้งานในระบบ</h2>
          </div>
        </div>
        <div className="adminTable">
          {users.map((user) => (
            <div className="adminRow" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <StatusBadge value={user.role} />
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
