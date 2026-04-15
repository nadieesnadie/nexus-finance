import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Nexus Finance | Premium Crypto Analytics",
  description: "Advanced financial dashboard built with Next.js 15 and Tailwind 4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden bg-black">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
