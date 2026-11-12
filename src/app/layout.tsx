import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CODGuard — COD Verification & RTO Prevention",
  description: "Pakistan COD order risk scoring and verification for e-commerce merchants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
