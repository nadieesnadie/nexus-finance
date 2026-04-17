import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Finance | Institutional Market Terminal",
  description: "Advanced financial intelligence dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden bg-[#0a0518]">
        {children}
      </body>
    </html>
  );
}
