import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <main className="loginScreen">
      <section className="loginPanel">
        <div className="brandMark">CX</div>
        <div>
          <p className="eyebrow">ComShopX Admin</p>
          <h1>เข้าสู่ระบบผู้ดูแล</h1>
          <span>Prototype login สำหรับ Admin/Owner, Cashier, Inventory และ Accounting</span>
        </div>
        <label>
          Email
          <input defaultValue="suphotsudsee@gmail.com" type="email" />
        </label>
        <label>
          Password
          <input defaultValue="admin-demo" type="password" />
        </label>
        <Link className="primaryButton loginButton" href="/admin">
          <LockKeyhole size={18} />
          Login
        </Link>
      </section>
    </main>
  );
}
