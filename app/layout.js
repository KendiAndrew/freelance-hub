import { Geist } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "FreelanceHub - Платформа для фрілансерів",
  description: "Знайдіть найкращих фрілансерів або проекти для роботи",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body className={`${geistSans.variable} antialiased min-h-screen flex flex-col`} style={{ background: '#f8fafc' }}>
        <SessionProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
            {children}
          </main>
          <footer className="hero-gradient text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <div className="text-xl font-bold mb-1">FreelanceHub</div>
                  <div className="text-indigo-200 text-sm">Платформа для пошуку фрілансерів та проектів</div>
                </div>
                <div className="text-indigo-200 text-sm">
                  &copy; 2025 FreelanceHub. Курсовий проект з баз даних.
                </div>
              </div>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
