import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Noto Sans KR for Korean typography (Google Fonts)
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WIGVU | URL 기반 영어 학습 플랫폼",
  description:
    "URL을 입력하면 영어 학습 콘텐츠로 변환합니다. 뉴스 기사 번역, 숙어 추출, 문장 구조 파싱, YouTube 영상 분석까지.",
  keywords: [
    "영어 학습",
    "뉴스 번역",
    "영어 기사",
    "YouTube 학습",
    "숙어",
    "영어 문장 구조",
  ],
  openGraph: {
    title: "WIGVU | URL 기반 영어 학습 플랫폼",
    description: "URL을 입력하면 영어 학습 콘텐츠로 변환합니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${notoSansKR.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <main className="min-h-screen">{children}</main>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
