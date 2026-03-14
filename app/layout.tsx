import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dieta — Diet & Nutrition Tracker",
  description: "Mobile-first health & diet tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans antialiased">
        <main className="mx-auto min-h-screen max-w-[390px] bg-white dark:bg-[#0d0d0d]">
          {children}
        </main>
      </body>
    </html>
  );
}
