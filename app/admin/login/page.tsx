import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/lib/actions";

export default function AdminLoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="loginScreen">
      <section className="loginPanel">
        <div className="brandMark">CX</div>
        <div>
          <p className="eyebrow">ComShopX Admin</p>
          <h1>เข้าสู่ระบบผู้ดูแล</h1>
          <span>Prototype login สำหรับ Admin/Owner, Cashier, Inventory และ Accounting</span>
        </div>
        {searchParams?.error ? <span className="badge cancelled">อีเมลหรือรหัสผ่านไม่ถูกต้อง</span> : null}
        <form action={loginAction} className="loginForm">
          <label>
            Email
            <input defaultValue="suphotsudsee@gmail.com" name="email" type="email" />
          </label>
          <label>
            Password
            <input defaultValue="admin1234" name="password" type="password" />
          </label>
          <button className="primaryButton loginButton" type="submit">
            <LockKeyhole size={18} />
            Login
          </button>
        </form>
        <Link href="/" className="linkButton">กลับหน้าแรก</Link>
      </section>
    </main>
  );
}
