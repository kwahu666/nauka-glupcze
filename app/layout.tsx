import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nauka, Głupcze! - Najlepszy agregator naukowy",
  description: "Wiadomości ze świata nauki, kosmosu i technologii w jednym miejscu. Bądź na bieżąco – czytaj artykuły i oglądaj najnowsze materiały wideo.",
  // Dodane WWW do bazy
  metadataBase: new URL("https://www.naukaglupcze.pl"),
  openGraph: {
    title: "Nauka, Głupcze! - Agregator Naukowy",
    description: "Wiadomości ze świata nauki, kosmosu i technologii w jednym miejscu. Bądź na bieżąco z najnowszymi odkryciami.",
    // Dodane WWW do urla
    url: "https://www.naukaglupcze.pl",
    siteName: "Nauka, Głupcze!",
    images: [
      {
        // Twardy, pełny adres do pliku z obrazkiem i WWW
        url: "https://www.naukaglupcze.pl/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Nauka Głupcze",
      },
    ],
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nauka, Głupcze! - Agregator Naukowy",
    description: "Najświeższe wiadomości ze świata nauki i kosmosu.",
    images: ["https://www.naukaglupcze.pl/og-image.jpg"],
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
