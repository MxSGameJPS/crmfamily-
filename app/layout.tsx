import type { Metadata } from "next";
import "./globals.css";
import "./stock-alert.css";
import "./brand-specialized.css";
import "./module-shortcut.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "CRM Family",
  description: "Gestão integrada da Sedux, Schemmer Cell e House Pet",
  applicationName: "CRM Family",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
