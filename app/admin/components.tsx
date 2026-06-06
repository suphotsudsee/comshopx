import Link from "next/link";
import {
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  ReceiptText,
  ScanLine,
  Settings,
  ShoppingCart,
  Users
} from "lucide-react";
import { adminUser } from "@/lib/admin-data";
import { logoutAction } from "@/lib/actions";
import { currentUser } from "@/lib/security";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pos", label: "POS", icon: ShoppingCart },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export async function AdminShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const displayUser = user
    ? { name: user.name, email: user.email, role: user.role }
    : adminUser;

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <Link href="/admin" className="adminBrand">
          <div className="brandMark">CX</div>
          <div>
            <strong>ComShopX</strong>
            <span>Admin Console</span>
          </div>
        </Link>
        <nav className="adminNav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="adminWorkspace">
        <header className="adminTopbar">
          <div>
            <p className="eyebrow">Role-based access control</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>
          <div className="userBox">
            <LockKeyhole size={18} />
            <div>
              <strong>{displayUser.name}</strong>
              <span>{displayUser.role}</span>
            </div>
            <form action={logoutAction}>
              <button className="linkButton" type="submit">Logout</button>
            </form>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function Stat({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="adminStat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase()}`}>{value}</span>;
}

export function ToolButton({
  label,
  icon
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button className="secondaryButton" type="button">
      {icon}
      {label}
    </button>
  );
}

export function ScanInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="adminScanInput">
      <ScanLine size={18} />
      <input placeholder={placeholder} />
    </div>
  );
}
