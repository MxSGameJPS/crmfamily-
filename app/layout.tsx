import type { Metadata } from "next";
import "./globals.css";
import "./stock-alert.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "CRM Family",
  description: "CRM multiempresa para gestão das lojas da família",
  applicationName: "CRM Family",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
