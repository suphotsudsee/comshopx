import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComShopX",
  description: "All-in-one computer store management system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
