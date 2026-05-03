import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantEdge | Options Pricing & Greeks Dashboard",
  description:
    "Professional-grade options pricing platform using Black-Scholes and Monte Carlo simulation. Real-time Greeks computation and risk visualization.",
  keywords: ["options pricing", "Black-Scholes", "Monte Carlo", "Greeks", "quantitative finance"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
