import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUVTSAS — Барааны каталог",
  description: "Хувцасны зураг, үнэ, размер бүртгэж хадгалах каталог",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
