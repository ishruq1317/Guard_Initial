import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LandGuard | Fraud & Double-Selling Detection",
  description:
    "Next-generation cryptographic registry and fraud detection engine for land parcels. LandTech 2026 Hackathon (P3).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[#090d16] text-slate-100 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
