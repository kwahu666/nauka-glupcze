import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nauka, Głupcze! - Najlepszy agregator naukowy",
  description: "Wiadomości ze świata nauki, kosmosu i technologii w jednym miejscu. Bądź na bieżąco – czytaj artykuły i oglądaj najnowsze materiały wideo.",
  metadataBase: new URL("https://naukaglupcze.pl"),
  openGraph: {
    title: "Nauka, Głupcze! - Agregator Naukowy",
    description: "Wiadomości ze świata nauki, kosmosu i technologii w jednym miejscu. Bądź na bieżąco z najnowszymi odkryciami.",
    url: "https://naukaglupcze.pl",
    siteName: "Nauka, Głupcze!",
    images: [
      {
        // TUTAJ ZMIANA: Pełny, twardy link do obrazka
        url: "https://naukaglupcze.pl/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Nauka Głupcze - Karta informacyjna",
      },
    ],
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nauka, Głupcze! - Agregator Naukowy",
    description: "Najświeższe wiadomości ze świata nauki i kosmosu.",
    // TUTAJ ZMIANA: Pełny link do obrazka dla Twittera/X
    images: ["https://naukaglupcze.pl/og-image.png"],
  },
  icons: {
    icon: "/logo.svg", 
  },
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
