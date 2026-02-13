import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WIGVU | 한국어 학습",
  description: "한국어 텍스트를 읽고, AI가 문장별로 번역해드려요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
                <main className="app-content">{children}</main>
              </div>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
