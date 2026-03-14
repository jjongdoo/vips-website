// app/layout.tsx
// SEO 최적화 메타태그 포함

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  // ── 기본 메타 ──
  title: 'VIPS - 숭실대학교 가치투자학회 | Value Investment Pioneers',
  description: 'VIPS(Value Investment Pioneers)는 숭실대학교 금융학부 소속 가치투자 학회입니다. 자체 펀드 운용, 리서치 리포트 발간, CFA 스터디, Alumni 네트워크를 운영합니다.',
  keywords: ['VIPS', '숭실대학교', '가치투자', '투자동아리', '금융학부', 'Value Investment', '숭실대 동아리', '주식 동아리', '가치투자학회', 'SSU'],

  // ── Open Graph (카카오톡, 페이스북 공유 시 미리보기) ──
  openGraph: {
    title: 'VIPS - 숭실대학교 가치투자학회',
    description: '가치투자의 본질을 탐구하고, 시장을 이기는 전략을 연구합니다. 자체 펀드 운용 · 리서치 발간 · CFA 스터디 · Alumni 네트워크',
    url: 'https://ssuvips.com',
    siteName: 'VIPS - Value Investment Pioneers',
    locale: 'ko_KR',
    type: 'website',
    // 이미지는 나중에 추가 가능 (public 폴더에 og-image.png 넣으면 됨)
    // images: [{ url: 'https://ssuvips.com/og-image.png', width: 1200, height: 630 }],
  },

  // ── 트위터 카드 ──
  twitter: {
    card: 'summary_large_image',
    title: 'VIPS - 숭실대학교 가치투자학회',
    description: '가치투자의 본질을 탐구하고, 시장을 이기는 전략을 연구합니다.',
  },

  // ── 검색엔진 설정 ──
  robots: {
    index: true,
    follow: true,
  },

  // ── 기타 ──
  alternates: {
    canonical: 'https://ssuvips.com',
  },

  // ── 네이버/구글 소유 확인 메타태그 ──
  // 아래에 발급받은 코드를 넣으세요
  verification: {
    google: 'OZvEX32WTOAQeaVbXuPoUw-rAHHRcoSNEzAomMvqOOU',  // 구글 서치콘솔에서 받은 코드 (예: 'abc123xyz')
    // @ts-ignore
    other: {
      'naver-site-verification': '',  // 네이버에서 받은 코드
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}