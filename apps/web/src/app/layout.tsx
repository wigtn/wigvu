import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/components/providers";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { Sidebar } from "@/shared/components/layout/sidebar";
import { MobileHeader } from "@/shared/components/layout/mobile-header";
import { TopBar } from "@/shared/components/layout/top-bar";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WIGVU | Learn Korean",
  description: "Read Korean texts and get AI-powered sentence-by-sentence translations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            <div className="app-layout">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <MobileHeader />
                <TopBar />
                <main className="app-content">{children}</main>
              </div>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
