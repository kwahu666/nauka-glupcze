import type { Metadata } from "next";
import "./globals.css"; // To ta linijka ładuje całą magię kolorów i układu!

export const metadata: Metadata = {
  title: "Nauka Głupcze",
  description: "Najlepszy agregator naukowy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
