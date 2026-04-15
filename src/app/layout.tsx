import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Finance | Premium Crypto Analytics",
  description: "Advanced financial dashboard built with Next.js 15 and Tailwind 4",
};

import { LayoutDashboard, TrendingUp, Wallet, Settings } from "lucide-react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden">
        <div className="flex h-screen bg-black">
          {/* Sidebar */}
          <aside className="w-20 lg:w-64 border-r border-white/10 flex flex-col items-center lg:items-start p-6">
            <div className="text-apple-blue font-bold text-2xl mb-12 hidden lg:block">NEXUS</div>
            <nav className="flex flex-col gap-6 w-full">
              <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
              <NavItem icon={<TrendingUp size={20} />} label="Markets" />
              <NavItem icon={<Wallet size={20} />} label="Portfolio" />
              <NavItem icon={<Settings size={20} />} label="Settings" />
            </nav>
          </aside>
          
          {/* Main View */}
          <main className="flex-1 overflow-y-auto bg-[#050505]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-apple-blue/10 text-apple-blue' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
      {icon}
      <span className="hidden lg:block font-medium">{label}</span>
    </div>
  );
}
